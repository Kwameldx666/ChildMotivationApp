import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService, type NotificationDto } from './notifications-service'
import { useUserSettings } from '@/hooks/use-user-settings'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const
export const NOTIFICATIONS_UNREAD_KEY = ['notifications', 'unread'] as const
export const NOTIFICATIONS_COUNT_KEY = ['notifications', 'count'] as const

/**
 * Хук для получения всех уведомлений
 */
export function useNotifications() {
  const { settings } = useUserSettings()

  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsService.list(),
    enabled: settings.notificationsEnabled,
    staleTime: 30_000, // 30 секунд
    refetchInterval: 60_000, // Обновляем каждую минуту
  })
}

/**
 * Хук для получения непрочитанных уведомлений
 */
export function useUnreadNotifications() {
  const { settings } = useUserSettings()

  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: () => notificationsService.getUnread(),
    enabled: settings.notificationsEnabled,
    staleTime: 30_000,
    refetchInterval: 30_000, // Обновляем каждые 30 секунд
  })
}

/**
 * Хук для получения количества непрочитанных уведомлений
 */
export function useUnreadNotificationsCount() {
  const { settings } = useUserSettings()

  return useQuery({
    queryKey: NOTIFICATIONS_COUNT_KEY,
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: settings.notificationsEnabled,
    staleTime: 15_000,
    refetchInterval: 15_000, // Обновляем каждые 15 секунд
    select: (data) => data.count,
  })
}

/**
 * Хук для отметки уведомлений как прочитанных
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationIds: string[]) => 
      notificationsService.markAsRead({ notificationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY })
    },
  })
}

/**
 * Хук для отметки всех уведомлений как прочитанных
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: async () => {
      // Оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      
      const previousNotifications = queryClient.getQueryData<NotificationDto[]>(NOTIFICATIONS_QUERY_KEY)
      
      if (previousNotifications) {
        queryClient.setQueryData<NotificationDto[]>(
          NOTIFICATIONS_QUERY_KEY,
          previousNotifications.map(n => ({ ...n, isRead: true }))
        )
      }
      
      queryClient.setQueryData(NOTIFICATIONS_COUNT_KEY, { count: 0 })
      
      return { previousNotifications }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY })
    },
  })
}

/**
 * Хук для удаления уведомления
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.remove(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY })
    },
  })
}
