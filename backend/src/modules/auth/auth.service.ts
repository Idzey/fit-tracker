import crypto from 'node:crypto'
import argon2 from 'argon2'
import { Role } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors'

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 1,
} as const

async function createRefreshToken(userId: string, family: string) {
  const token = crypto.randomBytes(40).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
  return prisma.refreshToken.create({ data: { userId, token, family, expiresAt } })
}

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ConflictError('EMAIL_TAKEN', 'Email already registered')

  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS)

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: Role.TRAINER,
        trainerProfile: { create: { name } },
      },
      include: { trainerProfile: true },
    })
    await tx.subscription.create({ data: { trainerId: u.trainerProfile!.id } })
    return u
  })

  const family = crypto.randomUUID()
  const rt = await createRefreshToken(user.id, family)

  return { userId: user.id, role: user.role, refreshToken: rt.token }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.deletedAt) throw new UnauthorizedError('INVALID_CREDENTIALS')

  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) throw new UnauthorizedError('INVALID_CREDENTIALS')

  const family = crypto.randomUUID()
  const rt = await createRefreshToken(user.id, family)

  return { userId: user.id, role: user.role, refreshToken: rt.token }
}

export async function refresh(rawToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  })

  if (!stored) throw new UnauthorizedError('INVALID_TOKEN')

  if (stored.revoked) {
    // Token reuse detected — revoke entire family (theft response)
    await prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revoked: true },
    })
    throw new UnauthorizedError('TOKEN_REUSE_DETECTED')
  }

  if (stored.expiresAt < new Date()) throw new UnauthorizedError('TOKEN_EXPIRED')

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } })
  const newRt = await createRefreshToken(stored.userId, stored.family)

  return { userId: stored.userId, role: stored.user.role, refreshToken: newRt.token }
}

export async function logout(rawToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: rawToken },
    data: { revoked: true },
  })
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      trainerProfile: {
        select: { id: true, name: true, bio: true, specialization: true, avatarKey: true },
      },
      clientProfile: {
        select: {
          id: true,
          name: true,
          age: true,
          goals: true,
          weight: true,
          height: true,
          trainerId: true,
        },
      },
    },
  })

  if (!user || user === null) throw new UnauthorizedError('UNAUTHORIZED')
  return user
}
