import { EventEmitter } from 'node:events'
import { NotificationType, Platform, type Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../shared/errors'
import type { DeviceTokenInput, NotificationsQuery } from './notifications.schema'

type SsePayload = Prisma.InputJsonValue

export const realtimeEvents = new EventEmitter()

export async function saveDeviceToken(userId: string, input: DeviceTokenInput) {
  await prisma.deviceToken.upsert({
    where: { token: input.token },
    update: { userId, platform: input.platform as Platform },
    create: { userId, token: input.token, platform: input.platform as Platform },
  })
}

export async function deleteDeviceToken(userId: string, token: string) {
  await prisma.deviceToken.deleteMany({ where: { userId, token } })
}

export async function listNotifications(userId: string, query: NotificationsQuery) {
  const skip = (query.page - 1) * query.limit
  const where = { userId, ...(query.unreadOnly ? { readAt: null } : {}) }
  const [total, notifications] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    data: notifications,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasMore: skip + notifications.length < total,
    },
  }
}

export async function markNotificationRead(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  })

  if (!notification) throw new NotFoundError('NOTIFICATION_NOT_FOUND', 'Notification not found')

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function emitToUser(userId: string, eventType: string, payload: SsePayload) {
  const event = await prisma.sseEvent.create({
    data: { userId, eventType, payload },
  })

  realtimeEvents.emit(userId, {
    id: event.id,
    eventType: event.eventType,
    payload: event.payload,
  })

  return event
}

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Prisma.InputJsonValue
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    },
  })

  await emitToUser(input.userId, 'notification', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    createdAt: notification.createdAt.toISOString(),
  })

  await sendPushNotification(input.userId, input.title, input.body, input.data)

  return notification
}

export async function getMissedEvents(userId: string, lastEventId?: string) {
  return prisma.sseEvent.findMany({
    where: {
      userId,
      ...(lastEventId ? { id: { gt: lastEventId } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
}

export async function notifyWorkoutCompleted(input: {
  trainerUserId: string
  clientId: string
  clientName: string
  workoutLogId: string
  templateName: string
  completedAt: Date
}) {
  const payload = {
    clientId: input.clientId,
    clientName: input.clientName,
    workoutLogId: input.workoutLogId,
    templateName: input.templateName,
    completedAt: input.completedAt.toISOString(),
  }

  await emitToUser(input.trainerUserId, 'workout_completed', payload)
  await createNotification({
    userId: input.trainerUserId,
    type: NotificationType.WORKOUT_COMPLETED,
    title: `${input.clientName} completed a workout`,
    body: input.templateName,
    data: payload,
  })
}

export async function notifyPhotoUploaded(input: {
  trainerUserId: string
  clientId: string
  clientName: string
  photoId: string
}) {
  const payload = {
    clientId: input.clientId,
    clientName: input.clientName,
    photoId: input.photoId,
  }

  await emitToUser(input.trainerUserId, 'photo_uploaded', payload)
  await createNotification({
    userId: input.trainerUserId,
    type: NotificationType.PHOTO_UPLOADED,
    title: `${input.clientName} uploaded a progress photo`,
    body: 'A new progress photo is ready to view',
    data: payload,
  })
}

export async function notifySubscriptionExpiring(input: {
  trainerUserId: string
  expiresAt: Date
}) {
  await createNotification({
    userId: input.trainerUserId,
    type: NotificationType.SUBSCRIPTION_EXPIRING,
    title: 'Your Pro subscription is expiring soon',
    body: `Renew before ${input.expiresAt.toISOString().slice(0, 10)}`,
    data: { expiresAt: input.expiresAt.toISOString() },
  })
}

async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Prisma.InputJsonValue,
) {
  const tokens = await prisma.deviceToken.findMany({ where: { userId } })
  const messages = tokens
    .filter((item) => item.token.startsWith('ExponentPushToken[') || item.token.startsWith('ExpoPushToken['))
    .map((item) => ({
      to: item.token,
      title,
      body,
      data,
      sound: 'default',
    }))

  if (!messages.length) return

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    if (!response.ok) return

    const result = (await response.json()) as {
      data?: Array<{ status: string; details?: { error?: string } }>
    }

    const invalidTokens = result.data
      ?.map((ticket, index) => ({ ticket, token: messages[index]?.to }))
      .filter((item) => item.ticket.status === 'error' && item.ticket.details?.error === 'DeviceNotRegistered')
      .map((item) => item.token)
      .filter(Boolean)

    if (invalidTokens?.length) {
      await prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } })
    }
  } catch {
    // Push is best-effort; in-app notification and SSE event remain persisted.
  }
}
