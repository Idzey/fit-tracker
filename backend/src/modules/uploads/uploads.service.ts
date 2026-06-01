import crypto from 'node:crypto'
import { PhotoStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../shared/errors'
import type { PresignUploadInput } from './uploads.schema'
import { generateThumbnail, getExtension, getObjectHead, getUploadUrl } from '../photos/storage'

const MAX_PHOTO_SIZE = 10 * 1024 * 1024

async function getClientProfileId(userId: string) {
  const client = await prisma.clientProfile.findFirst({
    where: { userId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new UnauthorizedError('CLIENT_PROFILE_NOT_FOUND', 'Client profile not found')
  return client.id
}

export async function createPresignedUploadUrl(userId: string, input: PresignUploadInput) {
  const clientId = await getClientProfileId(userId)
  const photoId = crypto.randomUUID()
  const extension = getExtension(input.contentType)
  const key = `photos/${clientId}/${photoId}/original.${extension}`
  const uploadUrl = await getUploadUrl(key, input.contentType, input.size)

  await prisma.progressPhoto.create({
    data: {
      id: photoId,
      clientId,
      key,
      size: input.size,
      status: PhotoStatus.PENDING,
      takenAt: input.takenAt,
    },
  })

  return {
    uploadUrl,
    photoId,
    key,
    expiresAt: new Date(Date.now() + 300_000),
  }
}

export async function confirmUpload(userId: string, photoId: string) {
  const clientId = await getClientProfileId(userId)
  const photo = await prisma.progressPhoto.findFirst({
    where: { id: photoId, clientId },
  })

  if (!photo) throw new NotFoundError('PHOTO_NOT_FOUND', 'Photo not found')
  if (photo.status === PhotoStatus.READY) return photo

  let actualSize = photo.size
  try {
    const head = await getObjectHead(photo.key)
    actualSize = Number(head.ContentLength ?? photo.size)
  } catch {
    throw new BadRequestError('FILE_NOT_UPLOADED', 'Uploaded file was not found')
  }

  if (actualSize > MAX_PHOTO_SIZE) {
    await prisma.progressPhoto.update({
      where: { id: photo.id },
      data: { status: PhotoStatus.FAILED, size: actualSize },
    })
    throw new BadRequestError('FILE_TOO_LARGE', 'Photo must be 10MB or smaller')
  }

  await prisma.progressPhoto.update({
    where: { id: photo.id },
    data: {
      status: PhotoStatus.UPLOADED,
      size: actualSize,
      uploadedAt: new Date(),
    },
  })

  try {
    const thumbnail = await generateThumbnail(photo.key)
    return prisma.progressPhoto.update({
      where: { id: photo.id },
      data: {
        status: PhotoStatus.READY,
        thumbnailKey: thumbnail.thumbnailKey,
        size: thumbnail.size,
      },
    })
  } catch {
    await prisma.progressPhoto.update({
      where: { id: photo.id },
      data: { status: PhotoStatus.FAILED },
    })
    throw new BadRequestError('INVALID_IMAGE', 'Uploaded file is not a valid image')
  }
}
