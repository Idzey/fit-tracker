export type NotificationType =
  | 'WORKOUT_ASSIGNED'
  | 'WORKOUT_COMPLETED'
  | 'PROGRAM_ASSIGNED'
  | 'SUBSCRIPTION_EXPIRING'
  | 'GENERAL'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: AppNotification[]
  unreadCount: number
}
