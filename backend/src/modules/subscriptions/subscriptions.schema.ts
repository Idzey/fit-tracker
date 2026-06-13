import { z } from 'zod'

export const revenuecatWebhookSchema = z.object({
  event: z
    .object({
      id: z.string().optional(),
      type: z.string(),
      app_user_id: z.string(),
      expiration_at_ms: z.number().nullable().optional(),
    })
    .optional(),
  id: z.string().optional(),
  type: z.string().optional(),
  app_user_id: z.string().optional(),
  expiration_at_ms: z.number().nullable().optional(),
})

export const yoomoneyWebhookSchema = z.object({
  notification_type: z.string().optional(),
  operation_id: z.string(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  datetime: z.string().optional(),
  sender: z.string().optional(),
  codepro: z.union([z.boolean(), z.string()]).optional(),
  unaccepted: z.union([z.boolean(), z.string()]).optional(),
  label: z.string(),
  sha1_hash: z.string().optional(),
})

export type RevenuecatWebhookInput = z.infer<typeof revenuecatWebhookSchema>
export type YoomoneyWebhookInput = z.infer<typeof yoomoneyWebhookSchema>
