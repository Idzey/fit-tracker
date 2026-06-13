export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL'

export interface Subscription {
  id: string
  trainerId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  clientLimit: number
  currentClientCount: number
  cancelAtPeriodEnd: boolean
  createdAt: string
}

export interface YoomoneyUrlResponse {
  url: string
}

export const PLAN_DETAILS: Record<SubscriptionPlan, { label: string; clientLimit: number; price: string }> = {
  FREE: { label: 'Free', clientLimit: 3, price: 'Free' },
  BASIC: { label: 'Basic', clientLimit: 10, price: '₽990/mo' },
  PRO: { label: 'Pro', clientLimit: 100, price: '₽2490/mo' },
}
