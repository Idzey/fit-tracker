import { Role, type PhotoStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, UnauthorizedError } from '../../shared/errors'
import type { ListPhotosQuery } from './photos.schema'
import { deleteObject, getViewUrl } from './storage'

type CurrentRole = `${Role}`

async function getClientProfileId(userId: string) {
  const client = await prisma.clientProfile.findFirst({
    where: { userId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new UnauthorizedError('CLIENT_PROFILE_NOT_FOUND', 'Client profile not found')
  return client.id
}

async function getTrainerOwnedClientId(userId: string, clientId: string) {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!trainer) throw new UnauthorizedError('TRAINER_PROFILE_NOT_FOUND', 'Trainer profile not found')

  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId: trainer.id, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')
  return client.id
}

function mapPhoto(photo: {
  id: string
  clientId: string
  key: string
  thumbnailKey: string | null
  size: number
  status: PhotoStatus
  takenAt: Date | null
  uploadedAt: Date | null
  createdAt: Date
}) {
  return {
    id: photo.id,
    clientId: photo.clientId,
    key: photo.key,
    thumbnailKey: photo.thumbnailKey,
    size: photo.size,
    status: photo.status,
    takenAt: photo.takenAt,
    uploadedAt: photo.uploadedAt,
    createdAt: photo.createdAt,
  }
}

export async function listMyPhotos(userId: string, query: ListPhotosQuery) {
  const clientId = await getClientProfileId(userId)
  return listPhotosByClientId(clientId, query)
}

export async function listClientPhotos(userId: string, clientId: string, query: ListPhotosQuery) {
  const ownedClientId = await getTrainerOwnedClientId(userId, clientId)
  return listPhotosByClientId(ownedClientId, query)
}

async function listPhotosByClientId(clientId: string, query: ListPhotosQuery) {
  const skip = (query.page - 1) * query.limit
  const where = { clientId }
  const [total, photos] = await prisma.$transaction([
    prisma.progressPhoto.count({ where }),
    prisma.progressPhoto.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    data: photos.map(mapPhoto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasMore: skip + photos.length < total,
    },
  }
}

export async function getPhotoUrl(userId: string, role: CurrentRole, photoId: string) {
  const photo = await findAccessiblePhoto(userId, role, photoId)
  const targetKey = photo.thumbnailKey ?? photo.key
  return getViewUrl(targetKey)
}

export async function deleteMyPhoto(userId: string, photoId: string) {
  const clientId = await getClientProfileId(userId)
  const photo = await prisma.progressPhoto.findFirst({
    where: { id: photoId, clientId },
  })

  if (!photo) throw new NotFoundError('PHOTO_NOT_FOUND', 'Photo not found')

  await prisma.progressPhoto.delete({ where: { id: photo.id } })
  await Promise.allSettled([
    deleteObject(photo.key),
    photo.thumbnailKey ? deleteObject(photo.thumbnailKey) : Promise.resolve(),
  ])
}

async function findAccessiblePhoto(userId: string, role: CurrentRole, photoId: string) {
  const photo = await prisma.progressPhoto.findUnique({
    where: { id: photoId },
    include: { client: { select: { trainerId: true, userId: true } } },
  })

  if (!photo) throw new NotFoundError('PHOTO_NOT_FOUND', 'Photo not found')

  if (role === Role.CLIENT && photo.client.userId === userId) return photo

  if (role === Role.TRAINER) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (trainer && photo.client.trainerId === trainer.id) return photo
  }

  throw new NotFoundError('PHOTO_NOT_FOUND', 'Photo not found')
}
