import { z } from 'zod'

export const deviceTokenSchema = z.object({
  token: z.string().trim().min(1).max(500),
  platform: z
    .enum(['ios', 'android', 'IOS', 'ANDROID'])
    .transform((value) => value.toUpperCase() as 'IOS' | 'ANDROID'),
})

export const deleteDeviceTokenSchema = z.object({
  token: z.string().trim().min(1).max(500),
})

export const notificationParamsSchema = z.object({
  id: z.string().min(1),
})

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
})

export const sseQuerySchema = z.object({
  token: z.string().optional(),
  lastEventId: z.string().optional(),
})

export type DeviceTokenInput = z.infer<typeof deviceTokenSchema>
export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>
