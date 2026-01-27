import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { selectAuthSession } from '@/features/auth/store/authSlice'
import { useAppSelector } from '@/store/hooks'
import { AchievementDto, MissionDto, MissionRecurrence, gamificationService } from './gamification-service'

export function useMissions(recurrence?: MissionRecurrence) {
  const session = useAppSelector(selectAuthSession)
  const recurrenceKey = recurrence ?? 'all'

  return useQuery<MissionDto[]>({
    queryKey: ['missions', session?.user.id, recurrenceKey],
    queryFn: () => gamificationService.listMissions(recurrence),
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useMissionProgressMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ missionId, progressDelta = 1 }: { missionId: string; progressDelta?: number }) =>
      gamificationService.updateMissionProgress(missionId, { progressDelta }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] })
    },
  })
}

export function useAchievements() {
  const session = useAppSelector(selectAuthSession)

  return useQuery<AchievementDto[]>({
    queryKey: ['achievements', session?.user.id],
    queryFn: () => gamificationService.listAchievements(),
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 10, // 10 minutes - достижения меняются редко
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useAchievementProgressMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ achievementId, progressDelta = 1 }: { achievementId: string; progressDelta?: number }) =>
      gamificationService.updateAchievementProgress(achievementId, { progressDelta }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}
