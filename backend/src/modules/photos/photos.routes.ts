import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import {
  clientPhotosParamsSchema,
  listPhotosQuerySchema,
  photoParamsSchema,
} from './photos.schema'
import * as photosService from './photos.service'

export async function photosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/photos', async (req, reply) => {
    if (req.user.role !== Role.CLIENT) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'Insufficient permissions' })
    }

    const query = listPhotosQuerySchema.parse(req.query)
    return photosService.listMyPhotos(req.user.sub, query)
  })

  fastify.delete('/photos/:photoId', async (req, reply) => {
    if (req.user.role !== Role.CLIENT) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'Insufficient permissions' })
    }

    const params = photoParamsSchema.parse(req.params)
    await photosService.deleteMyPhoto(req.user.sub, params.photoId)
    return reply.code(204).send()
  })

  fastify.get('/photos/:photoId/url', async (req) => {
    const params = photoParamsSchema.parse(req.params)
    return photosService.getPhotoUrl(req.user.sub, req.user.role, params.photoId)
  })

  fastify.get('/clients/:clientId/photos', async (req, reply) => {
    if (req.user.role !== Role.TRAINER) {
      return reply.status(403).send({ code: 'FORBIDDEN', message: 'Insufficient permissions' })
    }

    const params = clientPhotosParamsSchema.parse(req.params)
    const query = listPhotosQuerySchema.parse(req.query)
    return photosService.listClientPhotos(req.user.sub, params.clientId, query)
  })
}
