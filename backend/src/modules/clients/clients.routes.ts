import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/require-role'
import {
  clientParamsSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from './clients.schema'
import * as clientsService from './clients.service'

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireRole(Role.TRAINER))

  fastify.get('/', async (req) => {
    const query = listClientsQuerySchema.parse(req.query)
    return clientsService.listClients(req.user.sub, query)
  })

  fastify.post('/', async (req, reply) => {
    const body = createClientSchema.parse(req.body)
    const client = await clientsService.createClient(req.user.sub, body)
    return reply.code(201).send(client)
  })

  fastify.get('/:clientId', async (req) => {
    const params = clientParamsSchema.parse(req.params)
    return clientsService.getClient(req.user.sub, params.clientId)
  })

  fastify.put('/:clientId', async (req) => {
    const params = clientParamsSchema.parse(req.params)
    const body = updateClientSchema.parse(req.body)
    return clientsService.updateClient(req.user.sub, params.clientId, body)
  })

  fastify.delete('/:clientId', async (req, reply) => {
    const params = clientParamsSchema.parse(req.params)
    await clientsService.deleteClient(req.user.sub, params.clientId)
    return reply.code(204).send()
  })
}
