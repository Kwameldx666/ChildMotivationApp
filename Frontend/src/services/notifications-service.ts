import { httpClient } from '@/services/api/http-client'
import type { UserSettings } from '@/services/user-settings-service'

export type NotificationType = 
  | 'task_created' 
  | 'task_completed' 
  | 'task_updated'
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

type NotificationVisibilitySettings = Pick<
  UserSettings,
  'taskNotificationsEnabled' | 'rewardNotificationsEnabled' | 'achievementNotificationsEnabled' | 'systemNotificationsEnabled'
>

export function isNotificationAllowedBySettings(type: string, settings: NotificationVisibilitySettings): boolean {
  if (type.startsWith('task_')) return settings.taskNotificationsEnabled
  if (type.startsWith('reward_')) return settings.rewardNotificationsEnabled
  if (type === 'achievement_unlocked' || type === 'streak_bonus' || type === 'level_up') {
    return settings.achievementNotificationsEnabled
  }

  return settings.systemNotificationsEnabled
}

export function filterNotificationsBySettings(
  notifications: NotificationDto[],
  settings: NotificationVisibilitySettings,
): NotificationDto[] {
  return notifications.filter((notification) => isNotificationAllowedBySettings(notification.type, settings))
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
