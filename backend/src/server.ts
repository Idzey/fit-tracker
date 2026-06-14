import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { ZodError } from 'zod'
import { prisma } from './lib/prisma'
import { captureException, flushSentry } from './lib/sentry'
import { authRoutes } from './modules/auth/auth.routes'
import { clientsRoutes } from './modules/clients/clients.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'
import { photosRoutes } from './modules/photos/photos.routes'
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes'
import { uploadsRoutes } from './modules/uploads/uploads.routes'
import { workoutsRoutes } from './modules/workouts/workouts.routes'
import { AppError } from './shared/errors'
import './shared/types'

const fastify = Fastify({
  requestIdHeader: 'x-request-id',
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
    ],
    formatters: { level: (label) => ({ level: label }) },
  },
})

fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
})

fastify.register(helmet, { contentSecurityPolicy: false })

fastify.register(rateLimit, {
  global: true,
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  keyGenerator: (req) => req.ip,
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
})

fastify.setErrorHandler((error, req, reply) => {
  if (error instanceof AppError) {
    req.log.warn({ err: error, code: error.code }, 'Handled application error')
    return reply.status(error.statusCode).send({ code: error.code, message: error.message })
  }

  if (error instanceof ZodError) {
    req.log.warn({ err: error, path: req.url }, 'Validation error')
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors,
    })
  }

  if (error.validation) {
    req.log.warn({ err: error, path: req.url }, 'Fastify validation error')
    return reply.status(400).send({ code: 'VALIDATION_ERROR', message: error.message })
  }

  captureException(error, {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userId: req.user?.sub,
  })
  req.log.error({ err: error, requestId: req.id }, 'Unhandled request error')
  return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Internal server error' })
})

fastify.get('/health/live', async () => ({
  status: 'ok',
  uptime: Math.round(process.uptime()),
}))

fastify.get('/health/ready', async () => {
  await prisma.$queryRaw`SELECT 1`
  return {
    status: 'ok',
    db: 'ok',
    uptime: Math.round(process.uptime()),
  }
})

fastify.get('/health', async () => {
  await prisma.$queryRaw`SELECT 1`
  return {
    status: 'ok',
    db: 'ok',
    uptime: Math.round(process.uptime()),
  }
})

fastify.register(authRoutes, { prefix: '/auth' })
fastify.register(clientsRoutes, { prefix: '/trainer/clients' })
fastify.register(uploadsRoutes, { prefix: '/uploads' })
fastify.register(photosRoutes)
fastify.register(notificationsRoutes)
fastify.register(subscriptionsRoutes)
fastify.register(workoutsRoutes)

const shutdown = async () => {
  fastify.log.info('Shutting down')
  await fastify.close()
  await prisma.$disconnect()
  await flushSentry()
}

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
  } catch (err) {
    captureException(err, { phase: 'server-start' })
    fastify.log.error({ err }, 'Failed to start server')
    await prisma.$disconnect()
    await flushSentry()
    process.exit(1)
  }
}

process.on('unhandledRejection', (reason) => {
  captureException(reason, { phase: 'unhandled-rejection' })
  fastify.log.error({ err: reason }, 'Unhandled rejection')
})

process.on('uncaughtException', async (error) => {
  captureException(error, { phase: 'uncaught-exception' })
  fastify.log.fatal({ err: error }, 'Uncaught exception')
  await flushSentry()
  process.exit(1)
})

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start()
