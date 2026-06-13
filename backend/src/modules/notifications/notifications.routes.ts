import type { FastifyInstance, FastifyReply } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import {
  deleteDeviceTokenSchema,
  deviceTokenSchema,
  notificationParamsSchema,
  notificationsQuerySchema,
  sseQuerySchema,
} from './notifications.schema'
import * as notificationsService from './notifications.service'

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.post('/devices/token', { preHandler: [authenticate] }, async (req, reply) => {
    const body = deviceTokenSchema.parse(req.body)
    await notificationsService.saveDeviceToken(req.user.sub, body)
    return reply.code(204).send()
  })

  fastify.delete('/devices/token', { preHandler: [authenticate] }, async (req, reply) => {
    const body = deleteDeviceTokenSchema.parse(req.body)
    await notificationsService.deleteDeviceToken(req.user.sub, body.token)
    return reply.code(204).send()
  })

  fastify.get('/notifications', { preHandler: [authenticate] }, async (req) => {
    const query = notificationsQuerySchema.parse(req.query)
    return notificationsService.listNotifications(req.user.sub, query)
  })

  fastify.post('/notifications/:id/read', { preHandler: [authenticate] }, async (req) => {
    const params = notificationParamsSchema.parse(req.params)
    return notificationsService.markNotificationRead(req.user.sub, params.id)
  })

  fastify.post('/notifications/read-all', { preHandler: [authenticate] }, async (req, reply) => {
    await notificationsService.markAllNotificationsRead(req.user.sub)
    return reply.code(204).send()
  })

  fastify.get('/sse', async (req, reply) => {
    const query = sseQuerySchema.parse(req.query)
    const header = req.headers.authorization
    const token = query.token ?? header?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Missing token' })
    }

    try {
      const payload = await fastify.jwt.verify<{ sub: string }>(token)
      await openSseStream(reply, payload.sub, query.lastEventId ?? (req.headers['last-event-id'] as string | undefined))
    } catch {
      return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Invalid token' })
    }
  })
}

async function openSseStream(reply: FastifyReply, userId: string, lastEventId?: string) {
  reply.hijack()
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const send = (event: { id: string; eventType: string; payload: unknown }) => {
    if (reply.raw.writableEnded) return
    reply.raw.write(`id: ${event.id}\nevent: ${event.eventType}\ndata: ${JSON.stringify(event.payload)}\n\n`)
  }

  const missed = await notificationsService.getMissedEvents(userId, lastEventId)
  for (const event of missed) {
    send({ id: event.id, eventType: event.eventType, payload: event.payload })
  }

  const listener = (event: { id: string; eventType: string; payload: unknown }) => send(event)
  notificationsService.realtimeEvents.on(userId, listener)

  const heartbeat = setInterval(() => {
    if (!reply.raw.writableEnded) reply.raw.write(': heartbeat\n\n')
  }, 30_000)

  reply.raw.on('close', () => {
    clearInterval(heartbeat)
    notificationsService.realtimeEvents.off(userId, listener)
  })
}
