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

export interface AiChatResponsePayload {
  conversationId: string
  reply: string
  followUpSuggestions: string[]
  generatedAt: string
}

export const aiService = {
  sendChatMessage(payload: AiChatRequestPayload) {
    return httpClient.post<AiChatResponsePayload>('/api-gateway/ai/chat', payload)
  },
}
