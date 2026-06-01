import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { ZodError } from 'zod'
import { prisma } from './lib/prisma'
import { authRoutes } from './modules/auth/auth.routes'
import { clientsRoutes } from './modules/clients/clients.routes'
import { photosRoutes } from './modules/photos/photos.routes'
import { uploadsRoutes } from './modules/uploads/uploads.routes'
import { workoutsRoutes } from './modules/workouts/workouts.routes'
import { AppError } from './shared/errors'
import './shared/types' // JWT type augmentation

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    formatters: { level: (label) => ({ level: label }) },
  },
})

// ─── Plugins ─────────────────────────────────────────────────────────────────

fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
})

fastify.register(helmet, { contentSecurityPolicy: false })

fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
})

// ─── Error handler ────────────────────────────────────────────────────────────

fastify.setErrorHandler((error, req, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ code: error.code, message: error.message })
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors,
    })
  }

  // Fastify built-in validation (JSON Schema)
  if (error.validation) {
    return reply.status(400).send({ code: 'VALIDATION_ERROR', message: error.message })
  }

  fastify.log.error(error)
  return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Internal server error' })
})

// ─── Routes ───────────────────────────────────────────────────────────────────

fastify.get('/health', async () => {
  await prisma.$queryRaw`SELECT 1`
  return { status: 'ok', db: 'ok', uptime: Math.round(process.uptime()) }
})

fastify.register(authRoutes, { prefix: '/auth' })
fastify.register(clientsRoutes, { prefix: '/trainer/clients' })
fastify.register(uploadsRoutes, { prefix: '/uploads' })
fastify.register(photosRoutes)
fastify.register(workoutsRoutes)

// ─── Start ────────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const shutdown = async () => {
  await fastify.close()
  await prisma.$disconnect()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start()
