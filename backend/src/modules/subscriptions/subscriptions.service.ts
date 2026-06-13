import crypto from 'node:crypto'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { BadRequestError, UnauthorizedError } from '../../shared/errors'
import { notifySubscriptionExpiring } from '../notifications/notifications.service'
import type { RevenuecatWebhookInput, YoomoneyWebhookInput } from './subscriptions.schema'

export const PLAN_LIMITS = {
  FREE: { clients: 3, templates: 5, storageMb: 500 },
  PRO: { clients: Number.POSITIVE_INFINITY, templates: Number.POSITIVE_INFINITY, storageMb: 10240 },
} as const

async function getTrainerProfile(userId: string) {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  })

  if (!trainer) throw new UnauthorizedError('TRAINER_PROFILE_NOT_FOUND', 'Trainer profile not found')
  return trainer
}

export async function getSubscriptionSummary(userId: string) {
  const trainer = await getTrainerProfile(userId)
  const [subscription, clientsUsed, templatesUsed] = await prisma.$transaction([
    prisma.subscription.upsert({
      where: { trainerId: trainer.id },
      update: {},
      create: { trainerId: trainer.id },
    }),
    prisma.clientProfile.count({ where: { trainerId: trainer.id, user: { deletedAt: null } } }),
    prisma.workoutTemplate.count({ where: { trainerId: trainer.id } }),
  ])
  const normalizedSubscription =
    subscription.status === SubscriptionStatus.ACTIVE &&
    subscription.expiresAt &&
    subscription.expiresAt < new Date()
      ? await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED, plan: SubscriptionPlan.FREE },
        })
      : subscription
  const limits = PLAN_LIMITS[normalizedSubscription.plan]

  return {
    plan: normalizedSubscription.plan,
    status: normalizedSubscription.status,
    expiresAt: normalizedSubscription.expiresAt,
    clientsUsed,
    clientsLimit: Number.isFinite(limits.clients) ? limits.clients : null,
    templatesUsed,
    templatesLimit: Number.isFinite(limits.templates) ? limits.templates : null,
    storageMbLimit: limits.storageMb,
  }
}

export async function createYoomoneyPaymentUrl(userId: string) {
  const trainer = await getTrainerProfile(userId)
  const receiver = process.env.YOOMONEY_WALLET
  if (!receiver) throw new BadRequestError('YOOMONEY_NOT_CONFIGURED', 'YooMoney wallet is not configured')

  const params = new URLSearchParams({
    receiver,
    'quickpay-form': 'shop',
    targets: 'FitTrack Pro subscription',
    paymentType: 'AC',
    sum: process.env.PRO_MONTHLY_PRICE ?? '990',
    label: trainer.id,
    successURL: process.env.PAYMENT_SUCCESS_URL ?? 'fittrack://payment-success',
  })

  return { url: `https://yoomoney.ru/quickpay/confirm.xml?${params}` }
}

export async function handleRevenuecatWebhook(input: RevenuecatWebhookInput) {
  const event = input.event ?? input
  if (!event.type || !event.app_user_id) {
    throw new BadRequestError('INVALID_WEBHOOK', 'Invalid RevenueCat webhook payload')
  }

  const trainer = await findTrainerByWebhookId(event.app_user_id)
  const purchaseTypes = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'])
  const inactiveTypes = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'])

  if (purchaseTypes.has(event.type)) {
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null
    await prisma.subscription.upsert({
      where: { trainerId: trainer.id },
      update: {
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        expiresAt,
        revenuecatId: event.id,
      },
      create: {
        trainerId: trainer.id,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        expiresAt,
        revenuecatId: event.id,
      },
    })
  }

  if (inactiveTypes.has(event.type)) {
    await prisma.subscription.upsert({
      where: { trainerId: trainer.id },
      update: {
        plan: SubscriptionPlan.FREE,
        status: event.type === 'EXPIRATION' ? SubscriptionStatus.EXPIRED : SubscriptionStatus.CANCELLED,
        revenuecatId: event.id,
      },
      create: {
        trainerId: trainer.id,
        plan: SubscriptionPlan.FREE,
        status: event.type === 'EXPIRATION' ? SubscriptionStatus.EXPIRED : SubscriptionStatus.CANCELLED,
        revenuecatId: event.id,
      },
    })
  }
}

export async function handleYoomoneyWebhook(input: YoomoneyWebhookInput) {
  const trainerId = input.label
  const unaccepted = toBoolean(input.unaccepted)
  const codepro = toBoolean(input.codepro)
  if (unaccepted || codepro) return

  const trainer = await prisma.trainerProfile.findUnique({
    where: { id: trainerId },
    select: { id: true },
  })

  if (!trainer) throw new BadRequestError('INVALID_TRAINER', 'Trainer not found')

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.subscription.upsert({
    where: { trainerId: trainer.id },
    update: {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      expiresAt,
      yoomoneyOrderId: input.operation_id,
    },
    create: {
      trainerId: trainer.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      expiresAt,
      yoomoneyOrderId: input.operation_id,
    },
  })
}

export async function expireSubscriptions() {
  await prisma.subscription.updateMany({
    where: { status: SubscriptionStatus.ACTIVE, expiresAt: { lt: new Date() } },
    data: { status: SubscriptionStatus.EXPIRED, plan: SubscriptionPlan.FREE },
  })
}

export async function notifyExpiringSubscriptions() {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const expiring = await prisma.subscription.findMany({
    where: {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: { gt: new Date(), lt: soon },
    },
    include: { trainer: { select: { userId: true } } },
  })

  for (const subscription of expiring) {
    if (subscription.expiresAt) {
      await notifySubscriptionExpiring({
        trainerUserId: subscription.trainer.userId,
        expiresAt: subscription.expiresAt,
      })
    }
  }
}

export function verifyRevenuecatSignature(payload: unknown, signature: string | undefined) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!secret) return true
  if (!signature) return false

  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
  return safeEqual(signature, expected)
}

export function verifyYoomoneySignature(input: YoomoneyWebhookInput) {
  const secret = process.env.YOOMONEY_SECRET
  if (!secret) return true
  if (!input.sha1_hash) return false

  const expected = crypto
    .createHash('sha1')
    .update(
      [
        input.notification_type ?? '',
        input.operation_id,
        input.amount ?? '',
        input.currency ?? '',
        input.datetime ?? '',
        input.sender ?? '',
        String(input.codepro ?? ''),
        secret,
        input.label,
      ].join('&'),
    )
    .digest('hex')

  return safeEqual(input.sha1_hash, expected)
}

async function findTrainerByWebhookId(value: string) {
  const trainerById = await prisma.trainerProfile.findUnique({
    where: { id: value },
    select: { id: true },
  })
  if (trainerById) return trainerById

  const trainerByUser = await prisma.trainerProfile.findUnique({
    where: { userId: value },
    select: { id: true },
  })
  if (trainerByUser) return trainerByUser

  throw new BadRequestError('INVALID_TRAINER', 'Trainer not found')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function toBoolean(value: boolean | string | undefined) {
  return value === true || value === 'true'
}
