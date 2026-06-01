import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Role } from '@prisma/client'

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(req.user.role as Role)) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'Insufficient permissions' })
    }
  }
}
