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

// Task Suggestions types
export interface TaskSuggestion {
  title: string
  description: string
  difficulty: number
  tags: string[]
  category: string
  impactSummary?: string
}

export interface TaskSuggestionsResponse {
  suggestions: TaskSuggestion[]
  strategySummary: string
  tips: string[]
}

export interface TaskSuggestionsRequest {
  childId?: string
  childAge?: number
  tone?: string
  language?: string
  taskDescription?: string
  suggestionCount?: number
}

// Task Description types
export interface AiTaskDescriptionRequest {
  taskDescription?: string       // Описание задачи для расширения AI (чтобы ребёнку было понятно)
  language?: string              // Язык ответа (по умолчанию 'ru')
}

export interface AiTaskDescription {
  description: string  // Только улучшенное описание задачи
}

export interface AiTaskDescriptionResponse {
  descriptions: AiTaskDescription[]
}

export const aiService = {
  sendChatMessage(payload: AiChatRequestPayload) {
    return httpClient.post<AiChatResponsePayload>('/api-gateway/ai/chat', payload)
  },

  executeAction(payload: ExecuteActionRequest) {
    return httpClient.post<ExecuteActionResponse>('/api-gateway/ai/execute-action', payload)
  },

  async getTaskDescription(payload: AiTaskDescriptionRequest): Promise<string> {
    // Call the Gateway endpoint for task-description
    const response = await httpClient.post<any>('/api-gateway/ai/task-description', payload)

    // Defensive extraction for different shapes the backend may return.
    // Supported shapes:
    // - { description: string }
    // - { descriptions: string } or { descriptions: "string" }
    // - { descriptions: [{ description: string }] }
    // - { suggestions: [{ description: string, ... }] }
    // - direct string response
    const extractFromObject = (obj: any) => {
      if (!obj) return undefined
      if (typeof obj === 'string') return obj
      if (typeof obj.description === 'string') return obj.description
      return undefined
    }

    let result: string | undefined

    // direct string
    if (typeof response === 'string') {
      result = response
    }

    // top-level description
    result = result ?? (typeof response?.description === 'string' ? response.description : undefined)

    // descriptions can be string or array
    if (result == null && response?.descriptions != null) {
      if (typeof response.descriptions === 'string') result = response.descriptions
      else if (Array.isArray(response.descriptions)) result = extractFromObject(response.descriptions[0])
      else result = extractFromObject(response.descriptions)
    }

    // suggestions array
    if (result == null && Array.isArray(response?.suggestions)) {
      result = extractFromObject(response.suggestions[0])
    }

    if (!result) throw new Error('AI response did not contain a description')

    return result
  },

  async getTaskSuggestions(payload: TaskSuggestionsRequest): Promise<TaskSuggestionsResponse> {
    // Call the Gateway endpoint for task suggestions
    const response = await httpClient.post<TaskSuggestionsResponse>('/api-gateway/ai/task-suggestions', payload)
    return response
  },

  async getRewardSuggestions(payload?: { 
    childId?: string; 
    interests?: string[]; 
    availablePoints?: number; 
    occasion?: string; 
    maxSuggestions?: number;
    recentlyPurchasedRewards?: string[];
  }): Promise<{ suggestions: Array<{ title: string; description: string; cost: number; icon: string }> }> {
    // Call the Gateway endpoint for reward suggestions
    try {
      // Создаем контроллер для отмены запроса с таймаутом 60 секунд (вместо стандартных 30)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      
      const response = await httpClient.post<any>('/api-gateway/ai/reward-suggestions', {
        childId: payload?.childId,
        interests: payload?.interests ?? [],
        availablePoints: payload?.availablePoints,
        occasion: payload?.occasion,
        maxSuggestions: payload?.maxSuggestions ?? 1,
        recentlyPurchasedRewards: payload?.recentlyPurchasedRewards ?? [],
      }, { signal: controller.signal })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      console.error('[aiService] Failed to get reward suggestions', error)
      throw error
    }
  },
}
