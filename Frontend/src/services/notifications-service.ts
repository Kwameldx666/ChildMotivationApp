import { httpClient } from '@/services/api/http-client'

export type NotificationType = 
  | 'task_created' 
  | 'task_completed' 
  | 'task_assigned' 
  | 'reward_purchased' 
  | 'achievement_unlocked'
  | 'streak_bonus'
  | 'level_up'
  | 'general'

export interface NotificationDto {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

export interface MarkReadPayload {
  notificationIds: string[]
}

export const notificationsService = {
  /**
   * Получить список уведомлений пользователя
   */
  list() {
    return httpClient.get<NotificationDto[]>('/api-gateway/notifications')
  },

  /**
   * Получить непрочитанные уведомления
   */
  getUnread() {
    return httpClient.get<NotificationDto[]>('/api-gateway/notifications/unread')
  },

  /**
   * Получить количество непрочитанных уведомлений
   */
  getUnreadCount() {
    return httpClient.get<{ count: number }>('/api-gateway/notifications/unread/count')
  },

  /**
   * Отметить уведомления как прочитанные
   */
  markAsRead(payload: MarkReadPayload) {
    return httpClient.post<void>('/api-gateway/notifications/mark-read', payload)
  },

  /**
   * Отметить все уведомления как прочитанные
   */
  markAllAsRead() {
    return httpClient.post<void>('/api-gateway/notifications/mark-all-read', {})
  },

  /**
   * Удалить уведомление
   */
  remove(notificationId: string) {
    return httpClient.delete<void>(`/api-gateway/notifications/${notificationId}`)
  },
}
