export type NotificationType =
  | 'WORKOUT_REMINDER'
  | 'WORKOUT_COMPLETED'
  | 'PHOTO_UPLOADED'
  | 'SUBSCRIPTION_EXPIRING'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface BackendNotificationListResponse {
  data: AppNotification[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

export interface NotificationListResponse {
  items: AppNotification[]
  unreadCount: number
}

