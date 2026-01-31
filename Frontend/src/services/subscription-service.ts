import { httpClient } from '@/services/api/http-client'

export interface SubscriptionDto {
  tier: string
  status: string
  startDate: string
  endDate: string | null
  pricePerMonth: number
  autoRenew: boolean
  maxChildren: number
  maxTasksPerDay: number
  hasAIAssistant: boolean
  hasAdvancedAnalytics: boolean
  hasCustomRewards: boolean
  hasPrioritySupport: boolean
  hasFamilySharing: boolean
  hasOfflineMode: boolean
  daysRemaining: number | null
}

export interface ChangeSubscriptionRequest {
  tier: string
  autoRenew?: boolean
}

export interface SubscriptionTierInfo {
  name: string
  displayName: string
  price: number
  maxChildren: number
  maxTasksPerDay: number
}

export const subscriptionService = {
  /**
   * Получить текущую подписку пользователя
   */
  async getCurrentSubscription(): Promise<SubscriptionDto> {
    return httpClient.get<SubscriptionDto>('/api-gateway/user-service/subscription/me')
  },

  /**
   * Получить подписку по userId
   */
  async getSubscription(userId: string): Promise<SubscriptionDto> {
    return httpClient.get<SubscriptionDto>(`/api-gateway/user-service/subscription/${userId}`)
  },

  /**
   * Изменить подписку (upgrade/downgrade)
   */
  async changeSubscription(request: ChangeSubscriptionRequest): Promise<SubscriptionDto> {
    return httpClient.post<SubscriptionDto>('/api-gateway/user-service/subscription/change', request)
  },

  /**
   * Отменить подписку (переход на Free)
   */
  async cancelSubscription(): Promise<SubscriptionDto> {
    return httpClient.post<SubscriptionDto>('/api-gateway/user-service/subscription/cancel', {})
  },

  /**
   * Получить список доступных тарифов
   */
  async getAvailableTiers(): Promise<SubscriptionTierInfo[]> {
    return httpClient.get<SubscriptionTierInfo[]>('/api-gateway/user-service/subscription/tiers', { auth: false })
  },
}
