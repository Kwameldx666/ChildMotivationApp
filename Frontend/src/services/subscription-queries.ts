import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionService, type SubscriptionDto, type ChangeSubscriptionRequest } from './subscription-service'

export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  byUser: (userId: string) => [...subscriptionKeys.all, 'user', userId] as const,
  tiers: () => [...subscriptionKeys.all, 'tiers'] as const,
}

/**
 * Хук для получения текущей подписки пользователя
 */
export function useCurrentSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: () => subscriptionService.getCurrentSubscription(),
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
  })
}

/**
 * Хук для получения подписки по userId
 */
export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.byUser(userId ?? ''),
    queryFn: () => subscriptionService.getSubscription(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Хук для получения списка доступных тарифов
 */
export function useSubscriptionTiers() {
  return useQuery({
    queryKey: subscriptionKeys.tiers(),
    queryFn: () => subscriptionService.getAvailableTiers(),
    staleTime: 30 * 60 * 1000, // 30 минут - тарифы меняются редко
    refetchOnWindowFocus: false,
  })
}

/**
 * Хук для изменения подписки
 */
export function useChangeSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ChangeSubscriptionRequest) => 
      subscriptionService.changeSubscription(request),
    onSuccess: (data: SubscriptionDto) => {
      // Обновляем кэш подписки
      queryClient.setQueryData(subscriptionKeys.current(), data)
      // Инвалидируем все связанные запросы
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
    onError: (error: Error) => {
      console.error('[subscription] Failed to change subscription:', error.message)
    },
  })
}

/**
 * Хук для отмены подписки
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(),
    onSuccess: (data: SubscriptionDto) => {
      queryClient.setQueryData(subscriptionKeys.current(), data)
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
    onError: (error: Error) => {
      console.error('[subscription] Failed to cancel subscription:', error.message)
    },
  })
}
