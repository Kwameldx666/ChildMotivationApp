import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { presenceService, type PresenceStatusesResponse } from './presence-service'

interface UseOnlinePresenceOptions {
  enabled?: boolean
  refetchIntervalMs?: number
}

export function useOnlinePresence(userIds: string[], options: UseOnlinePresenceOptions = {}) {
  const { enabled = true, refetchIntervalMs = 15_000 } = options

  const normalizedUserIds = useMemo(() => {
    return Array.from(
      new Set(
        userIds
          .map(userId => userId.trim().toLowerCase())
          .filter(Boolean),
      ),
    )
      .slice(0, 100)
      .sort()
  }, [userIds])

  return useQuery<PresenceStatusesResponse>({
    queryKey: ['presence-online', normalizedUserIds.join(',')],
    queryFn: async () => {
      try {
        return await presenceService.getOnlineStatuses(normalizedUserIds)
      } catch {
        return { statuses: {} }
      }
    },
    enabled: enabled && normalizedUserIds.length > 0,
    staleTime: 5_000,
    refetchInterval: refetchIntervalMs,
  })
}