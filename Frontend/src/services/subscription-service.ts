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
   * Get current user subscription
   */
  async getCurrentSubscription(): Promise<SubscriptionDto> {
    return httpClient.get<SubscriptionDto>('/api-gateway/user-service/subscription/me')
  },

  /**
   * Get subscription by userId
   */
  async getSubscription(userId: string): Promise<SubscriptionDto> {
    return httpClient.get<SubscriptionDto>(`/api-gateway/user-service/subscription/${userId}`)
  },

  /**
   * Change subscription (upgrade/downgrade)
   */
  async changeSubscription(request: ChangeSubscriptionRequest): Promise<SubscriptionDto> {
    return httpClient.post<SubscriptionDto>('/api-gateway/user-service/subscription/change', request)
  },

  /**
   * Cancel subscription (downgrade to Free)
   */
  async cancelSubscription(): Promise<SubscriptionDto> {
    return httpClient.post<SubscriptionDto>('/api-gateway/user-service/subscription/cancel', {})
  },

  /**
   * Get available subscription tiers
   */
  async getAvailableTiers(): Promise<SubscriptionTierInfo[]> {
    return httpClient.get<SubscriptionTierInfo[]>('/api-gateway/user-service/subscription/tiers', { auth: false })
  },
}
