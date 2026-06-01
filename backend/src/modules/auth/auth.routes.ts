import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './auth.schema'
import * as authService from './auth.service'

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register — trainer self-registration
  fastify.post('/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const result = await authService.register(body.email, body.password, body.name)
    const accessToken = fastify.jwt.sign(
      { sub: result.userId, role: result.role },
      { expiresIn: '15m' },
    )
    return reply.code(201).send({
      accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.userId, role: result.role },
    })
  })

  // POST /auth/login
  fastify.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const result = await authService.login(body.email, body.password)
    const accessToken = fastify.jwt.sign(
      { sub: result.userId, role: result.role },
      { expiresIn: '15m' },
    )
    return { accessToken, refreshToken: result.refreshToken, user: { id: result.userId, role: result.role } }
  })

  // POST /auth/refresh — token rotation
  fastify.post('/refresh', async (req, reply) => {
    const body = refreshSchema.parse(req.body)
    const result = await authService.refresh(body.refreshToken)
    const accessToken = fastify.jwt.sign(
      { sub: result.userId, role: result.role },
      { expiresIn: '15m' },
    )
    return { accessToken, refreshToken: result.refreshToken }
  })

  // POST /auth/logout
  fastify.post('/logout', { preHandler: [authenticate] }, async (req, reply) => {
    const body = logoutSchema.parse(req.body)
    await authService.logout(body.refreshToken)
    return reply.code(204).send()
  })

  // GET /auth/me
  fastify.get('/me', { preHandler: [authenticate] }, async (req) => {
    return authService.getMe(req.user.sub)
  })
}
