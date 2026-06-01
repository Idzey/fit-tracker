import crypto from 'node:crypto'
import argon2 from 'argon2'
import { Role, SubscriptionPlan, type Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors'
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from './clients.schema'

const FREE_CLIENT_LIMIT = 3

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const

async function getTrainerProfileId(userId: string) {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!trainer) throw new UnauthorizedError('TRAINER_PROFILE_NOT_FOUND', 'Trainer profile not found')
  return trainer.id
}

function mapClientDetail(client: {
  id: string
  name: string
  age: number | null
  weight: number | null
  height: number | null
  goals: string | null
  avatarKey: string | null
  createdAt: Date
  updatedAt: Date
  user: { id: string; email: string }
}) {
  return {
    id: client.id,
    userId: client.user.id,
    email: client.user.email,
    name: client.name,
    age: client.age,
    weight: client.weight,
    height: client.height,
    goals: client.goals,
    avatarKey: client.avatarKey,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }
}

export async function listClients(userId: string, query: ListClientsQuery) {
  const trainerId = await getTrainerProfileId(userId)
  const where: Prisma.ClientProfileWhereInput = {
    trainerId,
    user: { deletedAt: null },
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { user: { email: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const skip = (query.page - 1) * query.limit
  const [total, clients] = await prisma.$transaction([
    prisma.clientProfile.count({ where }),
    prisma.clientProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
      include: {
        workoutLogs: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { completedAt: true },
        },
        assignedPrograms: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { template: { select: { id: true, name: true } } },
        },
        _count: { select: { workoutLogs: true } },
      },
    }),
  ])

  return {
    data: clients.map((client) => ({
      id: client.id,
      name: client.name,
      avatarKey: client.avatarKey,
      lastWorkoutAt: client.workoutLogs[0]?.completedAt ?? null,
      totalWorkouts: client._count.workoutLogs,
      activeProgram: client.assignedPrograms[0]?.template.name ?? null,
      activeProgramId: client.assignedPrograms[0]?.id ?? null,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasMore: skip + clients.length < total,
    },
  }
}

export async function createClient(userId: string, input: CreateClientInput) {
  const trainerId = await getTrainerProfileId(userId)
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('EMAIL_TAKEN', 'Email already registered')

  const subscription = await prisma.subscription.findUnique({ where: { trainerId } })
  if (!subscription || subscription.plan === SubscriptionPlan.FREE) {
    const clientCount = await prisma.clientProfile.count({
      where: { trainerId, user: { deletedAt: null } },
    })

    if (clientCount >= FREE_CLIENT_LIMIT) {
      throw new ForbiddenError('PLAN_LIMIT_REACHED', 'Free plan allows up to 3 clients')
    }
  }

  const temporaryPassword = crypto.randomBytes(32).toString('hex')
  const passwordHash = await argon2.hash(temporaryPassword, ARGON2_OPTIONS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: Role.CLIENT,
      clientProfile: {
        create: {
          trainerId,
          name: input.name,
          age: input.age,
          weight: input.weight,
          height: input.height,
          goals: input.goals,
        },
      },
    },
    include: { clientProfile: true },
  })

  return getClient(userId, user.clientProfile!.id)
}

export async function getClient(userId: string, clientId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId, user: { deletedAt: null } },
    include: { user: { select: { id: true, email: true } } },
  })

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')
  return mapClientDetail(client)
}

export async function updateClient(userId: string, clientId: string, input: UpdateClientInput) {
  const trainerId = await getTrainerProfileId(userId)
  const exists = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!exists) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')

  const client = await prisma.clientProfile.update({
    where: { id: clientId },
    data: input,
    include: { user: { select: { id: true, email: true } } },
  })

  return mapClientDetail(client)
}

export async function deleteClient(userId: string, clientId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId, user: { deletedAt: null } },
    select: { userId: true },
  })

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')

  await prisma.user.update({
    where: { id: client.userId },
    data: { deletedAt: new Date() },
  })
}
