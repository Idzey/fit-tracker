import type { FastifyInstance } from 'fastify'
import { Role } from '@prisma/client'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/require-role'
import { revenuecatWebhookSchema, yoomoneyWebhookSchema } from './subscriptions.schema'
import * as subscriptionsService from './subscriptions.service'

export async function subscriptionsRoutes(fastify: FastifyInstance) {
  fastify.get('/subscription', { preHandler: [authenticate, requireRole(Role.TRAINER)] }, async (req) => {
    return subscriptionsService.getSubscriptionSummary(req.user.sub)
  })

  fastify.post(
    '/subscription/yoomoney-url',
    { preHandler: [authenticate, requireRole(Role.TRAINER)] },
    async (req) => {
      return subscriptionsService.createYoomoneyPaymentUrl(req.user.sub)
    },
  )

  fastify.post('/webhooks/revenuecat', async (req, reply) => {
    if (!subscriptionsService.verifyRevenuecatSignature(req.body, req.headers['x-revenuecat-signature'] as string)) {
      return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Invalid webhook signature' })
    }

    const body = revenuecatWebhookSchema.parse(req.body)
    await subscriptionsService.handleRevenuecatWebhook(body)
    return { ok: true }
  })

  fastify.post('/webhooks/yoomoney', async (req, reply) => {
    const body = yoomoneyWebhookSchema.parse(req.body)
    if (!subscriptionsService.verifyYoomoneySignature(body)) {
      return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Invalid webhook signature' })
    }

    await subscriptionsService.handleYoomoneyWebhook(body)
    return { ok: true }
  })
}
