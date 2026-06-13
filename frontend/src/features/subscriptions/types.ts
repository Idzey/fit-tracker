export type SubscriptionPlan = 'FREE' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface Subscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  clientLimit: number | null
  currentClientCount: number
  templateLimit: number | null
  currentTemplateCount: number
  storageMbLimit: number
}

export interface BackendSubscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  expiresAt: string | null
  clientsUsed: number
  clientsLimit: number | null
  templatesUsed: number
  templatesLimit: number | null
  storageMbLimit: number
}

export interface YoomoneyUrlResponse {
  url: string
}

export const PLAN_DETAILS: Record<SubscriptionPlan, { label: string; clientLimit: number | null; price: string }> = {
  FREE: { label: 'Free', clientLimit: 3, price: 'Free' },
  PRO: { label: 'Pro', clientLimit: null, price: 'RUB 990/mo' },
}

