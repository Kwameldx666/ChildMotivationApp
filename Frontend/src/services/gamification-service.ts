import { httpClient } from '@/services/api/http-client'

export type MissionRecurrence = 'daily' | 'weekly'

export interface MissionDto {
  id: string
  title: string
  description: string
  icon: string
  recurrence: MissionRecurrence | string
  progress: number
  total: number
  rewardXp: number
  completed: boolean
}

export interface AchievementDto {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  total: number
  unlocked: boolean
  rewardXp: number
}

export interface UpdateProgressPayload {
  progressDelta?: number
}

const buildMissionQuery = (recurrence?: MissionRecurrence) => {
  if (!recurrence) return ''
  return `?recurrence=${recurrence}`
}

export const gamificationService = {
  listMissions(recurrence?: MissionRecurrence) {
    return httpClient.get<MissionDto[]>(`/api-gateway/missions${buildMissionQuery(recurrence)}`)
  },
  updateMissionProgress(missionId: string, payload?: UpdateProgressPayload) {
    return httpClient.post<MissionDto>(`/api-gateway/missions/${missionId}/progress`, payload)
  },
  listAchievements() {
    return httpClient.get<AchievementDto[]>(`/api-gateway/achievements`)
  },
  updateAchievementProgress(achievementId: string, payload?: UpdateProgressPayload) {
    return httpClient.post<AchievementDto>(`/api-gateway/achievements/${achievementId}/progress`, payload)
  },
}
