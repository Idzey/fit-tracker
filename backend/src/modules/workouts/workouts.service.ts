import { WorkoutStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../shared/errors'
import type {
  AssignProgramInput,
  CreateTemplateInput,
  DayInput,
  UpdateExerciseLogInput,
  UpdateDayInput,
  UpdateTemplateInput,
  WorkoutLogsQuery,
} from './workouts.schema'

async function getTrainerProfileId(userId: string) {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!trainer) throw new UnauthorizedError('TRAINER_PROFILE_NOT_FOUND', 'Trainer profile not found')
  return trainer.id
}

async function getClientProfileId(userId: string) {
  const client = await prisma.clientProfile.findFirst({
    where: { userId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new UnauthorizedError('CLIENT_PROFILE_NOT_FOUND', 'Client profile not found')
  return client.id
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function isSameUtcDay(left: Date, right: Date) {
  return startOfUtcDay(left).getTime() === startOfUtcDay(right).getTime()
}

function getWorkoutDueDate(log: { assignedProgram: { startDate: Date }; day: { dayNumber: number } }) {
  return addDays(log.assignedProgram.startDate, log.day.dayNumber - 1)
}

function mapTemplateSummary(template: {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count: { days: number }
}) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    daysCount: template._count.days,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

function mapTemplateDetail(template: {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  days: Array<{
    id: string
    dayNumber: number
    name: string
    createdAt: Date
    exercises: Array<{
      id: string
      name: string
      sets: number
      reps: number | null
      weight: number | null
      duration: number | null
      notes: string | null
      order: number
    }>
  }>
}) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    daysCount: template.days.length,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    days: template.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      name: day.name,
      createdAt: day.createdAt,
      exercises: day.exercises,
    })),
  }
}

function dayCreateData(day: DayInput) {
  return {
    dayNumber: day.dayNumber,
    name: day.name,
    exercises: {
      create: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        duration: exercise.duration,
        notes: exercise.notes,
        order: exercise.order,
      })),
    },
  }
}

function mapWorkoutLogDetail(log: {
  id: string
  assignedProgramId: string
  clientId: string
  status: WorkoutStatus
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignedProgram: {
    startDate: Date
    template: { id: string; name: string; description: string | null }
  }
  day: { id: string; dayNumber: number; name: string }
  exerciseLogs: Array<{
    id: string
    completedSets: number
    actualReps: number | null
    actualWeight: number | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    exercise: {
      id: string
      name: string
      sets: number
      reps: number | null
      weight: number | null
      duration: number | null
      notes: string | null
      order: number
    }
  }>
}) {
  return {
    id: log.id,
    assignedProgramId: log.assignedProgramId,
    clientId: log.clientId,
    status: log.status,
    dueDate: getWorkoutDueDate(log),
    dayId: log.day.id,
    dayNumber: log.day.dayNumber,
    dayName: log.day.name,
    templateId: log.assignedProgram.template.id,
    templateName: log.assignedProgram.template.name,
    templateDescription: log.assignedProgram.template.description,
    startedAt: log.startedAt,
    completedAt: log.completedAt,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
    exercises: log.exerciseLogs.map((exerciseLog) => ({
      id: exerciseLog.id,
      exerciseId: exerciseLog.exercise.id,
      name: exerciseLog.exercise.name,
      sets: exerciseLog.exercise.sets,
      reps: exerciseLog.exercise.reps,
      weight: exerciseLog.exercise.weight,
      duration: exerciseLog.exercise.duration,
      targetNotes: exerciseLog.exercise.notes,
      order: exerciseLog.exercise.order,
      completedSets: exerciseLog.completedSets,
      actualReps: exerciseLog.actualReps,
      actualWeight: exerciseLog.actualWeight,
      notes: exerciseLog.notes,
      createdAt: exerciseLog.createdAt,
      updatedAt: exerciseLog.updatedAt,
    })),
  }
}

const workoutLogInclude = {
  assignedProgram: {
    include: { template: { select: { id: true, name: true, description: true } } },
  },
  day: true,
  exerciseLogs: {
    orderBy: { exercise: { order: 'asc' } },
    include: { exercise: true },
  },
} as const

function calculateProgressSummary(logs: Array<{ status: WorkoutStatus; completedAt: Date | null }>) {
  const completedLogs = logs.filter((log) => log.status === WorkoutStatus.COMPLETED && log.completedAt)
  const now = new Date()
  const weekStart = startOfUtcDay(now)
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 1)

  const completedDays = new Set(
    completedLogs.map((log) => startOfUtcDay(log.completedAt!).toISOString().slice(0, 10)),
  )
  let streak = 0
  let cursor = startOfUtcDay(now)

  while (completedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return {
    totalWorkouts: completedLogs.length,
    workoutsThisWeek: completedLogs.filter((log) => log.completedAt! >= weekStart).length,
    completionRate: logs.length === 0 ? 0 : completedLogs.length / logs.length,
    lastWorkoutAt: completedLogs
      .map((log) => log.completedAt!)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null,
    streak,
  }
}

async function getTrainerOwnedClientId(userId: string, clientId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')
  return client.id
}

async function getClientWorkoutLog(userId: string, logId: string) {
  const clientId = await getClientProfileId(userId)
  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, clientId },
    include: workoutLogInclude,
  })

  if (!log) throw new NotFoundError('WORKOUT_LOG_NOT_FOUND', 'Workout log not found')
  return log
}

export async function listTemplates(userId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const templates = await prisma.workoutTemplate.findMany({
    where: { trainerId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { days: true } } },
  })

  return templates.map(mapTemplateSummary)
}

export async function createTemplate(userId: string, input: CreateTemplateInput) {
  const trainerId = await getTrainerProfileId(userId)
  const template = await prisma.workoutTemplate.create({
    data: {
      trainerId,
      name: input.name,
      description: input.description,
      days: { create: input.days.map(dayCreateData) },
    },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  return mapTemplateDetail(template)
}

export async function getTemplate(userId: string, templateId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, trainerId },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!template) throw new NotFoundError('WORKOUT_TEMPLATE_NOT_FOUND', 'Workout template not found')
  return mapTemplateDetail(template)
}

export async function updateTemplate(userId: string, templateId: string, input: UpdateTemplateInput) {
  const trainerId = await getTrainerProfileId(userId)
  const exists = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, trainerId },
    select: { id: true },
  })

  if (!exists) throw new NotFoundError('WORKOUT_TEMPLATE_NOT_FOUND', 'Workout template not found')

  await prisma.workoutTemplate.update({
    where: { id: templateId },
    data: input,
  })

  return getTemplate(userId, templateId)
}

export async function deleteTemplate(userId: string, templateId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, trainerId },
    select: { id: true, _count: { select: { assignedPrograms: true } } },
  })

  if (!template) throw new NotFoundError('WORKOUT_TEMPLATE_NOT_FOUND', 'Workout template not found')
  if (template._count.assignedPrograms > 0) {
    throw new BadRequestError('TEMPLATE_ASSIGNED', 'Cannot delete assigned workout template')
  }

  await prisma.workoutTemplate.delete({ where: { id: templateId } })
}

export async function addDay(userId: string, templateId: string, input: DayInput) {
  const trainerId = await getTrainerProfileId(userId)
  const template = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, trainerId },
    select: { id: true },
  })

  if (!template) throw new NotFoundError('WORKOUT_TEMPLATE_NOT_FOUND', 'Workout template not found')

  await prisma.workoutDay.create({
    data: {
      templateId,
      ...dayCreateData(input),
    },
  })

  return getTemplate(userId, templateId)
}

export async function updateDay(userId: string, templateId: string, dayId: string, input: UpdateDayInput) {
  const trainerId = await getTrainerProfileId(userId)
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, templateId, template: { trainerId } },
    select: { id: true },
  })

  if (!day) throw new NotFoundError('WORKOUT_DAY_NOT_FOUND', 'Workout day not found')

  await prisma.$transaction(async (tx) => {
    await tx.workoutDay.update({
      where: { id: dayId },
      data: {
        dayNumber: input.dayNumber,
        name: input.name,
      },
    })

    if (input.exercises) {
      await tx.exercise.deleteMany({ where: { dayId } })
      await tx.exercise.createMany({
        data: input.exercises.map((exercise) => ({
          dayId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          notes: exercise.notes,
          order: exercise.order,
        })),
      })
    }
  })

  return getTemplate(userId, templateId)
}

export async function deleteDay(userId: string, templateId: string, dayId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, templateId, template: { trainerId } },
    select: { id: true },
  })

  if (!day) throw new NotFoundError('WORKOUT_DAY_NOT_FOUND', 'Workout day not found')

  const hasWorkoutLogs = await prisma.workoutLog.count({ where: { dayId } })
  if (hasWorkoutLogs > 0) {
    throw new BadRequestError('DAY_ASSIGNED', 'Cannot delete workout day used by assigned programs')
  }

  await prisma.workoutDay.delete({ where: { id: dayId } })
}

export async function listClientPrograms(userId: string, clientId: string) {
  const trainerId = await getTrainerProfileId(userId)
  const client = await prisma.clientProfile.findFirst({
    where: { id: clientId, trainerId, user: { deletedAt: null } },
    select: { id: true },
  })

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')

  const programs = await prisma.assignedProgram.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { id: true, name: true, description: true } },
      _count: { select: { workoutLogs: true } },
    },
  })

  return programs.map((program) => ({
    id: program.id,
    templateId: program.templateId,
    template: program.template,
    clientId: program.clientId,
    startDate: program.startDate,
    createdAt: program.createdAt,
    workoutLogsCount: program._count.workoutLogs,
  }))
}

export async function assignProgram(userId: string, clientId: string, input: AssignProgramInput) {
  const trainerId = await getTrainerProfileId(userId)
  const [client, template] = await Promise.all([
    prisma.clientProfile.findFirst({
      where: { id: clientId, trainerId, user: { deletedAt: null } },
      select: { id: true },
    }),
    prisma.workoutTemplate.findFirst({
      where: { id: input.templateId, trainerId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
    }),
  ])

  if (!client) throw new NotFoundError('CLIENT_NOT_FOUND', 'Client not found')
  if (!template) throw new NotFoundError('WORKOUT_TEMPLATE_NOT_FOUND', 'Workout template not found')
  if (template.days.length === 0) {
    throw new BadRequestError('TEMPLATE_HAS_NO_DAYS', 'Workout template must have at least one day')
  }

  const program = await prisma.$transaction(async (tx) => {
    const assigned = await tx.assignedProgram.create({
      data: {
        clientId,
        templateId: input.templateId,
        startDate: input.startDate,
      },
    })

    for (const day of template.days) {
      const workoutLog = await tx.workoutLog.create({
        data: {
          assignedProgramId: assigned.id,
          clientId,
          dayId: day.id,
        },
      })

      if (day.exercises.length > 0) {
        await tx.exerciseLog.createMany({
          data: day.exercises.map((exercise) => ({
            workoutLogId: workoutLog.id,
            exerciseId: exercise.id,
          })),
        })
      }
    }

    return assigned
  })

  return {
    id: program.id,
    templateId: program.templateId,
    clientId: program.clientId,
    startDate: program.startDate,
    createdAt: program.createdAt,
    workoutLogsCount: template.days.length,
  }
}

export async function listTodayWorkouts(userId: string) {
  const clientId = await getClientProfileId(userId)
  const logs = await prisma.workoutLog.findMany({
    where: { clientId },
    orderBy: [{ assignedProgram: { startDate: 'asc' } }, { day: { dayNumber: 'asc' } }],
    include: workoutLogInclude,
  })
  const today = new Date()

  return logs.filter((log) => isSameUtcDay(getWorkoutDueDate(log), today)).map(mapWorkoutLogDetail)
}

export async function getWorkoutLog(userId: string, logId: string) {
  const log = await getClientWorkoutLog(userId, logId)
  return mapWorkoutLogDetail(log)
}

export async function startWorkout(userId: string, logId: string) {
  const log = await getClientWorkoutLog(userId, logId)

  if (log.status === WorkoutStatus.COMPLETED) {
    throw new BadRequestError('WORKOUT_ALREADY_COMPLETED', 'Workout is already completed')
  }

  await prisma.workoutLog.update({
    where: { id: log.id },
    data: {
      status: WorkoutStatus.IN_PROGRESS,
      startedAt: log.startedAt ?? new Date(),
    },
  })

  return getWorkoutLog(userId, logId)
}

export async function completeWorkout(userId: string, logId: string) {
  const log = await getClientWorkoutLog(userId, logId)

  if (log.status === WorkoutStatus.COMPLETED) return mapWorkoutLogDetail(log)

  await prisma.workoutLog.update({
    where: { id: log.id },
    data: {
      status: WorkoutStatus.COMPLETED,
      startedAt: log.startedAt ?? new Date(),
      completedAt: new Date(),
    },
  })

  return getWorkoutLog(userId, logId)
}

export async function updateExerciseLog(
  userId: string,
  logId: string,
  exerciseLogId: string,
  input: UpdateExerciseLogInput,
) {
  const log = await getClientWorkoutLog(userId, logId)
  if (log.status === WorkoutStatus.COMPLETED) {
    throw new BadRequestError('WORKOUT_ALREADY_COMPLETED', 'Workout is already completed')
  }

  const exerciseLog = log.exerciseLogs.find((item) => item.id === exerciseLogId)
  if (!exerciseLog) throw new NotFoundError('EXERCISE_LOG_NOT_FOUND', 'Exercise log not found')

  await prisma.$transaction([
    prisma.workoutLog.update({
      where: { id: log.id },
      data: {
        status: WorkoutStatus.IN_PROGRESS,
        startedAt: log.startedAt ?? new Date(),
      },
    }),
    prisma.exerciseLog.update({
      where: { id: exerciseLogId },
      data: input,
    }),
  ])

  const exerciseLogs = await prisma.exerciseLog.findMany({
    where: { workoutLogId: log.id },
    include: { exercise: { select: { sets: true } } },
  })
  const isWorkoutCompleted =
    exerciseLogs.length > 0 && exerciseLogs.every((item) => item.completedSets >= item.exercise.sets)

  if (isWorkoutCompleted) {
    await prisma.workoutLog.update({
      where: { id: log.id },
      data: {
        status: WorkoutStatus.COMPLETED,
        completedAt: new Date(),
      },
    })
  }

  const updated = await prisma.exerciseLog.findUniqueOrThrow({
    where: { id: exerciseLogId },
    include: { exercise: true },
  })

  return {
    id: updated.id,
    workoutLogId: updated.workoutLogId,
    exerciseId: updated.exerciseId,
    name: updated.exercise.name,
    sets: updated.exercise.sets,
    completedSets: updated.completedSets,
    actualReps: updated.actualReps,
    actualWeight: updated.actualWeight,
    notes: updated.notes,
    updatedAt: updated.updatedAt,
  }
}

export async function listClientWorkoutLogs(userId: string, clientId: string, query: WorkoutLogsQuery) {
  const ownedClientId = await getTrainerOwnedClientId(userId, clientId)
  return listWorkoutLogsByClientId(ownedClientId, query)
}

export async function listMyWorkoutLogs(userId: string, query: WorkoutLogsQuery) {
  const clientId = await getClientProfileId(userId)
  return listWorkoutLogsByClientId(clientId, query)
}

async function listWorkoutLogsByClientId(clientId: string, query: WorkoutLogsQuery) {
  const where = { clientId, ...(query.status ? { status: query.status } : {}) }
  const skip = (query.page - 1) * query.limit
  const [total, logs] = await prisma.$transaction([
    prisma.workoutLog.count({ where }),
    prisma.workoutLog.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      include: workoutLogInclude,
    }),
  ])

  return {
    data: logs.map(mapWorkoutLogDetail),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasMore: skip + logs.length < total,
    },
  }
}

export async function getClientProgress(userId: string, clientId: string) {
  const ownedClientId = await getTrainerOwnedClientId(userId, clientId)
  return getProgressByClientId(ownedClientId)
}

export async function getMyProgress(userId: string) {
  const clientId = await getClientProfileId(userId)
  return getProgressByClientId(clientId)
}

async function getProgressByClientId(clientId: string) {
  const logs = await prisma.workoutLog.findMany({
    where: { clientId },
    select: { status: true, completedAt: true },
  })

  return calculateProgressSummary(logs)
}
