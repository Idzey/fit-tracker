import { z } from 'zod'

export const templateParamsSchema = z.object({
  id: z.string().min(1),
})

export const clientProgramParamsSchema = z.object({
  clientId: z.string().min(1),
})

export const workoutLogParamsSchema = z.object({
  logId: z.string().min(1),
})

export const exerciseLogParamsSchema = workoutLogParamsSchema.extend({
  exerciseLogId: z.string().min(1),
})

export const dayParamsSchema = templateParamsSchema.extend({
  dayId: z.string().min(1),
})

const exerciseInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100).nullable().optional(),
  weight: z.number().min(0).max(1000).nullable().optional(),
  duration: z.number().int().min(1).max(7200).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  order: z.number().int().min(1).max(50),
})

export const dayInputSchema = z.object({
  dayNumber: z.number().int().min(1).max(365),
  name: z.string().trim().min(1).max(100),
  exercises: z.array(exerciseInputSchema).min(1).max(50).default([]),
})

export const createTemplateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  days: z.array(dayInputSchema).max(365).default([]),
})

export const updateTemplateSchema = createTemplateSchema
  .omit({ days: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export const updateDaySchema = dayInputSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
})

export const assignProgramSchema = z.object({
  templateId: z.string().min(1),
  startDate: z.coerce.date().default(() => new Date()),
})

export const workoutLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
})

export const updateExerciseLogSchema = z
  .object({
    completedSets: z.number().int().min(0).max(20).optional(),
    actualReps: z.number().int().min(0).max(200).nullable().optional(),
    actualWeight: z.number().min(0).max(1000).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type DayInput = z.infer<typeof dayInputSchema>
export type UpdateDayInput = z.infer<typeof updateDaySchema>
export type AssignProgramInput = z.infer<typeof assignProgramSchema>
export type WorkoutLogsQuery = z.infer<typeof workoutLogsQuerySchema>
export type UpdateExerciseLogInput = z.infer<typeof updateExerciseLogSchema>
