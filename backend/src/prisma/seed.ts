import argon2 from 'argon2'
import { NotificationType, Role, SubscriptionPlan, SubscriptionStatus, WorkoutStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

const password = 'Password123!'
const trainerEmail = 'trainer@fittrack.demo'
const clientEmail = 'client@fittrack.demo'

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

async function clearDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: [trainerEmail, clientEmail] } },
    include: { trainerProfile: true, clientProfile: true },
  })

  const userIds = demoUsers.map((user) => user.id)
  const trainerIds = demoUsers.map((user) => user.trainerProfile?.id).filter(Boolean) as string[]
  const clientIds = demoUsers.map((user) => user.clientProfile?.id).filter(Boolean) as string[]

  if (userIds.length) {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.deviceToken.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.sseEvent.deleteMany({ where: { userId: { in: userIds } } })
  }

  if (clientIds.length) {
    await prisma.exerciseLog.deleteMany({ where: { workoutLog: { clientId: { in: clientIds } } } })
    await prisma.workoutLog.deleteMany({ where: { clientId: { in: clientIds } } })
    await prisma.assignedProgram.deleteMany({ where: { clientId: { in: clientIds } } })
    await prisma.progressPhoto.deleteMany({ where: { clientId: { in: clientIds } } })
    await prisma.clientProfile.deleteMany({ where: { id: { in: clientIds } } })
  }

  if (trainerIds.length) {
    await prisma.subscription.deleteMany({ where: { trainerId: { in: trainerIds } } })
    await prisma.workoutTemplate.deleteMany({ where: { trainerId: { in: trainerIds } } })
    await prisma.trainerProfile.deleteMany({ where: { id: { in: trainerIds } } })
  }

  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }
}

async function main() {
  await clearDemoData()

  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS)
  const today = startOfUtcDay(new Date())

  const trainerUser = await prisma.user.create({
    data: {
      email: trainerEmail,
      passwordHash,
      role: Role.TRAINER,
      trainerProfile: {
        create: {
          name: 'Maya Trainer',
          specialization: 'Strength and mobility',
        },
      },
    },
    include: { trainerProfile: true },
  })

  const trainerId = trainerUser.trainerProfile!.id

  await prisma.subscription.create({
    data: {
      trainerId,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 30),
    },
  })

  const clientUser = await prisma.user.create({
    data: {
      email: clientEmail,
      passwordHash,
      role: Role.CLIENT,
      clientProfile: {
        create: {
          trainerId,
          name: 'Alex Demo',
          age: 29,
          weight: 78,
          height: 181,
          goals: 'Build consistent strength habits',
        },
      },
    },
    include: { clientProfile: true },
  })

  const clientId = clientUser.clientProfile!.id

  const template = await prisma.workoutTemplate.create({
    data: {
      trainerId,
      name: 'Demo Strength Base',
      description: 'Two-day starter plan for the portfolio demo',
      days: {
        create: [
          {
            dayNumber: 1,
            name: 'Full Body A',
            exercises: {
              create: [
                { name: 'Goblet Squat', sets: 3, reps: 10, weight: 24, order: 1 },
                { name: 'Push-up', sets: 3, reps: 12, order: 2 },
                { name: 'Plank', sets: 3, duration: 45, order: 3 },
              ],
            },
          },
          {
            dayNumber: 2,
            name: 'Full Body B',
            exercises: {
              create: [
                { name: 'Romanian Deadlift', sets: 3, reps: 8, weight: 60, order: 1 },
                { name: 'One-arm Row', sets: 3, reps: 10, weight: 22, order: 2 },
                { name: 'Farmer Carry', sets: 4, duration: 30, order: 3 },
              ],
            },
          },
        ],
      },
    },
    include: {
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  const assigned = await prisma.assignedProgram.create({
    data: {
      clientId,
      templateId: template.id,
      startDate: today,
    },
  })

  for (const day of template.days) {
    await prisma.workoutLog.create({
      data: {
        assignedProgramId: assigned.id,
        clientId,
        dayId: day.id,
        status: day.dayNumber === 1 ? WorkoutStatus.PENDING : WorkoutStatus.PENDING,
        exerciseLogs: {
          create: day.exercises.map((exercise) => ({
            exerciseId: exercise.id,
            completedSets: 0,
          })),
        },
      },
    })
  }

  await prisma.notification.create({
    data: {
      userId: trainerUser.id,
      type: NotificationType.WORKOUT_REMINDER,
      title: 'Demo data is ready',
      body: 'Alex Demo has a workout assigned for today.',
      data: { clientId },
    },
  })

  console.log('Demo seed complete')
  console.log(`Trainer: ${trainerEmail} / ${password}`)
  console.log(`Client:  ${clientEmail} / ${password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
