import { Role } from '@prisma/client'

export interface JwtPayload {
  sub: string
  role: Role
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}
