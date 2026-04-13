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

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export interface LocalizedNotificationContent {
  title: string
  message: string
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

function pickString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function pickDataString(notification: NotificationDto, key: string): string | undefined {
  return pickString(notification.data?.[key])
}

function translateWithFallback(
  t: TranslateFn,
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
): string {
  const translated = t(key, params)
  return translated === key ? fallback : translated
}

export function getLocalizedNotificationContent(
  notification: NotificationDto,
  t: TranslateFn,
): LocalizedNotificationContent {
  const taskTitle = pickDataString(notification, 'taskTitle')
    ?? pickDataString(notification, 'title')
    ?? pickString(notification.title)
    ?? 'Task'

  const fallback = {
    title: notification.title,
    message: notification.message,
  }

  if (notification.type === 'task_created') {
    return {
      title: translateWithFallback(t, 'notificationContent.taskCreated.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.taskCreated.message', fallback.message, { taskTitle }),
    }
  }

  if (notification.type === 'task_assigned') {
    return {
      title: translateWithFallback(t, 'notificationContent.taskAssigned.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.taskAssigned.message', fallback.message, { taskTitle }),
    }
  }

  if (notification.type === 'task_completed') {
    return {
      title: translateWithFallback(t, 'notificationContent.taskCompleted.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.taskCompleted.message', fallback.message, { taskTitle }),
    }
  }

  if (notification.type === 'task_updated') {
    const status = (pickDataString(notification, 'status') ?? '').toLowerCase()
    let statusMessageKey = 'notificationContent.taskUpdated.message'
    if (status === 'inprogress') statusMessageKey = 'notificationContent.taskUpdated.inProgress'
    if (status === 'pendingapproval') statusMessageKey = 'notificationContent.taskUpdated.pendingApproval'
    if (status === 'approvalrejected') statusMessageKey = 'notificationContent.taskUpdated.approvalRejected'
    if (status === 'completed') statusMessageKey = 'notificationContent.taskUpdated.completed'

    return {
      title: translateWithFallback(t, 'notificationContent.taskUpdated.title', fallback.title),
      message: translateWithFallback(t, statusMessageKey, fallback.message, { taskTitle }),
    }
  }

  if (notification.type === 'reward_purchased') {
    return {
      title: translateWithFallback(t, 'notificationContent.rewardPurchased.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.rewardPurchased.message', fallback.message),
    }
  }

  if (notification.type === 'achievement_unlocked') {
    return {
      title: translateWithFallback(t, 'notificationContent.achievementUnlocked.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.achievementUnlocked.message', fallback.message),
    }
  }

  if (notification.type === 'streak_bonus') {
    return {
      title: translateWithFallback(t, 'notificationContent.streakBonus.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.streakBonus.message', fallback.message),
    }
  }

  if (notification.type === 'level_up') {
    return {
      title: translateWithFallback(t, 'notificationContent.levelUp.title', fallback.title),
      message: translateWithFallback(t, 'notificationContent.levelUp.message', fallback.message),
    }
  }

  return fallback
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
