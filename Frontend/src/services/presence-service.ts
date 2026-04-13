import { httpClient } from '@/services/api/http-client'

export interface PresenceStatusesResponse {
  statuses: Record<string, boolean>
}

const normalizeUserIds = (userIds: string[]) => {
  return Array.from(
    new Set(
      userIds
        .map(userId => userId.trim())
        .filter(Boolean),
    ),
  ).slice(0, 100)
}

export const presenceService = {
  getOnlineStatuses(userIds: string[]) {
    const normalizedUserIds = normalizeUserIds(userIds)

    if (normalizedUserIds.length === 0) {
      return Promise.resolve<PresenceStatusesResponse>({ statuses: {} })
    }

    const searchParams = new URLSearchParams()
    normalizedUserIds.forEach((userId) => {
      searchParams.append('userIds', userId)
    })

    return httpClient.get<PresenceStatusesResponse>(`/api-gateway/notifications/online?${searchParams.toString()}`)
  },
}