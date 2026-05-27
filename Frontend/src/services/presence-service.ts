import { httpClient } from '@/services/api/http-client'

export interface PresenceStatusesResponse {
  statuses: Record<string, boolean>
}

const normalizeUserIds = (userIds: string[]) => {
  return Array.from(
    new Set(
      userIds
        .map(userId => userId.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 100).sort()
}

// Demo children always shown as "online" so the UI is visually interesting in demos.
// These are the fixed IDs from AuthDatabaseInitializer (child1, child3, child5).
const DEMO_ONLINE_IDS = new Set([
  'a1000000-0000-0000-0000-000000000002', // Никита  (Family 1)
  'a2000000-0000-0000-0000-000000000002', // Максим  (Family 2)
  'a3000000-0000-0000-0000-000000000002', // Артём   (Family 3)
])

export const presenceService = {
  async getOnlineStatuses(userIds: string[]): Promise<PresenceStatusesResponse> {
    const normalizedUserIds = normalizeUserIds(userIds)

    if (normalizedUserIds.length === 0) {
      return { statuses: {} }
    }

    const searchParams = new URLSearchParams()
    normalizedUserIds.forEach((userId) => {
      searchParams.append('userIds', userId)
    })

    let statuses: Record<string, boolean> = {}

    try {
      const result = await httpClient.get<PresenceStatusesResponse>(
        `/api-gateway/notifications/online?${searchParams.toString()}`,
      )
      statuses = { ...(result?.statuses ?? {}) }
    } catch {
      // API unavailable — fall through to demo overrides below
    }

    // Ensure demo children always appear online (real API value takes priority if true already)
    normalizedUserIds.forEach((userId) => {
      if (DEMO_ONLINE_IDS.has(userId) && !statuses[userId]) {
        statuses[userId] = true
      }
    })

    return { statuses }
  },
}