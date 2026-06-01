import { z } from 'zod'

export const photoParamsSchema = z.object({
  photoId: z.string().min(1),
})

export const clientPhotosParamsSchema = z.object({
  clientId: z.string().min(1),
})

export const listPhotosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ListPhotosQuery = z.infer<typeof listPhotosQuerySchema>
