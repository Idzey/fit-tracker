import { z } from 'zod'

export const presignUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().min(1).max(10 * 1024 * 1024),
  takenAt: z.coerce.date().optional(),
})

export const confirmUploadParamsSchema = z.object({
  photoId: z.string().min(1),
})

export type PresignUploadInput = z.infer<typeof presignUploadSchema>
