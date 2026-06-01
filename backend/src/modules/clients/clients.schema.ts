import { z } from 'zod'

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
})

export const clientParamsSchema = z.object({
  clientId: z.string().min(1),
})

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).toLowerCase(),
  age: z.number().int().min(10).max(100).optional(),
  weight: z.number().min(20).max(500).optional(),
  height: z.number().min(50).max(250).optional(),
  goals: z.string().trim().max(500).optional(),
})

export const updateClientSchema = createClientSchema
  .omit({ email: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
