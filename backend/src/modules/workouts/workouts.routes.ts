import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/require-role'
import {
  assignProgramSchema,
  clientProgramParamsSchema,
  createTemplateSchema,
  dayInputSchema,
  dayParamsSchema,
  exerciseLogParamsSchema,
  templateParamsSchema,
  updateDaySchema,
  updateExerciseLogSchema,
  updateTemplateSchema,
  workoutLogParamsSchema,
  workoutLogsQuerySchema,
} from './workouts.schema'
import * as workoutsService from './workouts.service'

async function trainerOnlyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireRole(Role.TRAINER))

  fastify.get('/workout-templates', async (req) => {
    return workoutsService.listTemplates(req.user.sub)
  })

  fastify.post('/workout-templates', async (req, reply) => {
    const body = createTemplateSchema.parse(req.body)
    const template = await workoutsService.createTemplate(req.user.sub, body)
    return reply.code(201).send(template)
  })

  fastify.get('/workout-templates/:id', async (req) => {
    const params = templateParamsSchema.parse(req.params)
    return workoutsService.getTemplate(req.user.sub, params.id)
  })

  fastify.put('/workout-templates/:id', async (req) => {
    const params = templateParamsSchema.parse(req.params)
    const body = updateTemplateSchema.parse(req.body)
    return workoutsService.updateTemplate(req.user.sub, params.id, body)
  })

  fastify.delete('/workout-templates/:id', async (req, reply) => {
    const params = templateParamsSchema.parse(req.params)
    await workoutsService.deleteTemplate(req.user.sub, params.id)
    return reply.code(204).send()
  })

  fastify.post('/workout-templates/:id/days', async (req, reply) => {
    const params = templateParamsSchema.parse(req.params)
    const body = dayInputSchema.parse(req.body)
    const template = await workoutsService.addDay(req.user.sub, params.id, body)
    return reply.code(201).send(template)
  })

  fastify.put('/workout-templates/:id/days/:dayId', async (req) => {
    const params = dayParamsSchema.parse(req.params)
    const body = updateDaySchema.parse(req.body)
    return workoutsService.updateDay(req.user.sub, params.id, params.dayId, body)
  })

  fastify.delete('/workout-templates/:id/days/:dayId', async (req, reply) => {
    const params = dayParamsSchema.parse(req.params)
    await workoutsService.deleteDay(req.user.sub, params.id, params.dayId)
    return reply.code(204).send()
  })

  fastify.get('/trainer/clients/:clientId/programs', async (req) => {
    const params = clientProgramParamsSchema.parse(req.params)
    return workoutsService.listClientPrograms(req.user.sub, params.clientId)
  })

  fastify.post('/trainer/clients/:clientId/programs', async (req, reply) => {
    const params = clientProgramParamsSchema.parse(req.params)
    const body = assignProgramSchema.parse(req.body)
    const program = await workoutsService.assignProgram(req.user.sub, params.clientId, body)
    return reply.code(201).send(program)
  })

  fastify.get('/clients/:clientId/programs', async (req) => {
    const params = clientProgramParamsSchema.parse(req.params)
    return workoutsService.listClientPrograms(req.user.sub, params.clientId)
  })

  fastify.post('/clients/:clientId/programs', async (req, reply) => {
    const params = clientProgramParamsSchema.parse(req.params)
    const body = assignProgramSchema.parse(req.body)
    const program = await workoutsService.assignProgram(req.user.sub, params.clientId, body)
    return reply.code(201).send(program)
  })

  fastify.get('/clients/:clientId/progress', async (req) => {
    const params = clientProgramParamsSchema.parse(req.params)
    return workoutsService.getClientProgress(req.user.sub, params.clientId)
  })

  fastify.get('/clients/:clientId/workout-logs', async (req) => {
    const params = clientProgramParamsSchema.parse(req.params)
    const query = workoutLogsQuerySchema.parse(req.query)
    return workoutsService.listClientWorkoutLogs(req.user.sub, params.clientId, query)
  })
}

async function clientOnlyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', requireRole(Role.CLIENT))

  fastify.get('/workouts/today', async (req) => {
    return workoutsService.listTodayWorkouts(req.user.sub)
  })

  fastify.get('/workouts/:logId', async (req) => {
    const params = workoutLogParamsSchema.parse(req.params)
    return workoutsService.getWorkoutLog(req.user.sub, params.logId)
  })

  fastify.post('/workouts/:logId/start', async (req) => {
    const params = workoutLogParamsSchema.parse(req.params)
    return workoutsService.startWorkout(req.user.sub, params.logId)
  })

  fastify.post('/workouts/:logId/complete', async (req) => {
    const params = workoutLogParamsSchema.parse(req.params)
    return workoutsService.completeWorkout(req.user.sub, params.logId)
  })

  fastify.put('/workouts/:logId/exercises/:exerciseLogId', async (req) => {
    const params = exerciseLogParamsSchema.parse(req.params)
    const body = updateExerciseLogSchema.parse(req.body)
    return workoutsService.updateExerciseLog(req.user.sub, params.logId, params.exerciseLogId, body)
  })

  fastify.get('/progress', async (req) => {
    return workoutsService.getMyProgress(req.user.sub)
  })

  fastify.get('/progress/workout-logs', async (req) => {
    const query = workoutLogsQuerySchema.parse(req.query)
    return workoutsService.listMyWorkoutLogs(req.user.sub, query)
  })
}

export async function workoutsRoutes(fastify: FastifyInstance) {
  fastify.register(trainerOnlyRoutes)
  fastify.register(clientOnlyRoutes)
}
