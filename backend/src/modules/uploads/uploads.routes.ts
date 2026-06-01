import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/require-role'
import { confirmUploadParamsSchema, presignUploadSchema } from './uploads.schema'
import * as uploadsService from './uploads.service'

export async function uploadsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireRole(Role.CLIENT))

  fastify.post('/presign', async (req) => {
    const body = presignUploadSchema.parse(req.body)
    return uploadsService.createPresignedUploadUrl(req.user.sub, body)
  })

  fastify.post('/:photoId/confirm', async (req) => {
    const params = confirmUploadParamsSchema.parse(req.params)
    return uploadsService.confirmUpload(req.user.sub, params.photoId)
  })
}
