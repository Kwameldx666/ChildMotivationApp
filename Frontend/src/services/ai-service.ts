import { httpClient } from '@/services/api/http-client'

export type AiChatRole = 'user' | 'assistant'

export interface AiChatHistoryEntry {
  role: AiChatRole
  content: string
  timestamp?: string
}

export interface AiChatRequestPayload {
  message: string
  conversationId?: string | null
  history?: AiChatHistoryEntry[]
  context?: Record<string, string>
}

// AI Action types
export type AiActionType =
  | 'CreateTask'
  | 'CreateTasks'
  | 'CreateReward'
  | 'CreateRewards'
  | 'UpdateTask'
  | 'CompleteTask'
  | 'SendFamilyMessage'
  | 'ShowAnalytics'
  | 'Navigate'

export type AiActionVariant = 'primary' | 'secondary' | 'destructive'

export interface CreateTaskPayload {
  title: string
  description?: string
  difficulty?: number
  rewardXp?: number
  rewardPoints?: number
  category?: string
  tags?: string[]
}

export interface CreateTasksPayload {
  tasks: CreateTaskPayload[]
}

export interface CreateRewardPayload {
  title: string
  description?: string
  cost: number
  category?: string
  icon?: string
}

export interface CreateRewardsPayload {
  rewards: CreateRewardPayload[]
}

export interface NavigatePayload {
  route: string
  queryParams?: Record<string, string>
}

export interface SendFamilyMessagePayload {
  message: string
}

export type AiActionPayload =
  | CreateTaskPayload
  | CreateTasksPayload
  | CreateRewardPayload
  | CreateRewardsPayload
  | NavigatePayload
  | SendFamilyMessagePayload
  | Record<string, unknown>

export interface AiAction {
  type: AiActionType
  label: string
  description?: string
  variant: AiActionVariant
  priority: number
  payload?: AiActionPayload
}

export interface AiChatResponsePayload {
  conversationId: string
  reply: string
  followUpSuggestions: string[]
  actions: AiAction[]
  generatedAt: string
}

export interface ExecuteActionRequest {
  action: AiAction
  userId: string
  familyId?: string
}

export interface ExecuteActionResponse {
  success: boolean
  message?: string
  data?: unknown
}

export const aiService = {
  sendChatMessage(payload: AiChatRequestPayload) {
    return httpClient.post<AiChatResponsePayload>('/api-gateway/ai/chat', payload)
  },

  executeAction(payload: ExecuteActionRequest) {
    return httpClient.post<ExecuteActionResponse>('/api-gateway/ai/execute-action', payload)
  },
}
