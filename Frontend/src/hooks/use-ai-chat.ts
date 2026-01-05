"use client"

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { aiService, type AiChatRequestPayload, type AiChatResponsePayload } from '@/services/ai-service'

export type ChatAuthor = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatAuthor
  content: string
  timestamp: Date
}

interface UseAiChatOptions {
  greeting?: string
  context?: Record<string, string>
  maxHistory?: number
}

interface UseAiChatResult {
  messages: ChatMessage[]
  conversationId: string | null
  followUps: string[]
  lastReplyAt: Date | null
  isThinking: boolean
  sendMessage: (message: string) => Promise<void>
  reset: () => void
}

const generateMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const sanitizeContext = (context?: Record<string, string>) => {
  if (!context) return undefined
  return Object.entries(context).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      acc[key] = value.trim()
    }
    return acc
  }, {})
}

const buildHistoryPayload = (messages: ChatMessage[], maxHistory: number): AiChatRequestPayload['history'] => {
  return messages
    .filter(message => message.role !== 'system')
    .slice(-maxHistory)
    .map(message => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    }))
}

export function useAiChat(options?: UseAiChatOptions): UseAiChatResult {
  const greeting = options?.greeting?.trim()
  const maxHistory = options?.maxHistory ?? 12
  const preparedContext = useMemo(() => sanitizeContext(options?.context), [options?.context])

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    greeting
      ? [
          {
            id: 'greeting',
            role: 'assistant',
            content: greeting,
            timestamp: new Date(),
          },
        ]
      : [],
  )
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<string[]>([])
  const [lastReplyAt, setLastReplyAt] = useState<Date | null>(greeting ? new Date() : null)
  const [isThinking, setIsThinking] = useState(false)

  const reset = useCallback(() => {
    setMessages(greeting ? [{ id: 'greeting', role: 'assistant', content: greeting, timestamp: new Date() }] : [])
    setConversationId(null)
    setFollowUps([])
    setLastReplyAt(greeting ? new Date() : null)
  }, [greeting])

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const trimmed = rawMessage.trim()
      if (!trimmed || isThinking) {
        return
      }

      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMessage])
      setIsThinking(true)

      const history = buildHistoryPayload([...messages, userMessage], maxHistory)
      const payload: AiChatRequestPayload = {
        message: trimmed,
        conversationId,
        history,
        context: preparedContext,
      }

      try {
        const response: AiChatResponsePayload = await aiService.sendChatMessage(payload)
        const assistantMessage: ChatMessage = {
          id: response.conversationId ? `${response.conversationId}-${Date.now()}` : generateMessageId(),
          role: 'assistant',
          content: response.reply?.trim() || 'Уточните запрос, пожалуйста, я потерял контекст.',
          timestamp: response.generatedAt ? new Date(response.generatedAt) : new Date(),
        }

        setConversationId(response.conversationId ?? null)
        setMessages(prev => [...prev, assistantMessage])
        setFollowUps(response.followUpSuggestions?.filter(Boolean) ?? [])
        setLastReplyAt(assistantMessage.timestamp)
      } catch (error) {
        console.error('[ai-chat] Failed to fetch reply', error)
        toast.error('Не удалось получить ответ ИИ. Попробуйте ещё раз.')
      } finally {
        setIsThinking(false)
      }
    },
    [conversationId, isThinking, maxHistory, messages, preparedContext],
  )

  return { messages, conversationId, followUps, lastReplyAt, isThinking, sendMessage, reset }
}
