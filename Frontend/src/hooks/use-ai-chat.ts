"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { aiService, type AiAction, type AiChatRequestPayload, type AiChatResponsePayload } from '@/services/ai-service'

export type ChatAuthor = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatAuthor
  content: string
  timestamp: Date
  actions?: AiAction[]
}

interface UseAiChatOptions {
  greeting?: string
  context?: Record<string, string>
  maxHistory?: number
  storageKey?: string
  /** Translation function for error messages, fallbacks, etc. */
  t?: (key: string, params?: Record<string, string>) => string
}

interface UseAiChatResult {
  messages: ChatMessage[]
  conversationId: string | null
  followUps: string[]
  pendingActions: AiAction[]
  lastReplyAt: Date | null
  isThinking: boolean
  sendMessage: (message: string) => Promise<void>
  executeAction: (action: AiAction) => Promise<void>
  dismissAction: (action: AiAction) => void
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

interface PersistedChatState {
  messages: Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>
  conversationId: string | null
  followUps: string[]
  pendingActions: AiAction[]
  lastReplyAt: string | null
}

const loadPersistedState = (storageKey?: string): PersistedChatState | null => {
  if (!storageKey || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedChatState
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const savePersistedState = (storageKey: string, state: PersistedChatState) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // ignore persistence errors
  }
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
  const storageKey = options?.storageKey
  const preparedContext = useMemo(() => sanitizeContext(options?.context), [options?.context])
  const t = options?.t ?? ((key: string) => key)

  const persisted = useMemo(() => loadPersistedState(storageKey), [storageKey])
  const initialMessages: ChatMessage[] = useMemo(() => {
    if (persisted?.messages?.length) {
      return persisted.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }))
    }

    if (!greeting) return []
    return [{ id: 'greeting', role: 'assistant', content: greeting, timestamp: new Date() }]
  }, [greeting, persisted?.messages])

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [conversationId, setConversationId] = useState<string | null>(persisted?.conversationId ?? null)
  const [followUps, setFollowUps] = useState<string[]>(persisted?.followUps ?? [])
  const [pendingActions, setPendingActions] = useState<AiAction[]>(persisted?.pendingActions ?? [])
  const [lastReplyAt, setLastReplyAt] = useState<Date | null>(persisted?.lastReplyAt ? new Date(persisted.lastReplyAt) : greeting ? new Date() : null)
  const [isThinking, setIsThinking] = useState(false)

  const reset = useCallback(() => {
    const resetMessages = greeting ? [{ id: 'greeting', role: 'assistant' as const, content: greeting, timestamp: new Date() }] : []
    setMessages(resetMessages)
    setConversationId(null)
    setFollowUps([])
    setPendingActions([])
    setLastReplyAt(greeting ? new Date() : null)

    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }, [greeting, storageKey])

  useEffect(() => {
    if (!storageKey) return

    savePersistedState(storageKey, {
      messages: messages.map(message => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
      conversationId,
      followUps,
      pendingActions,
      lastReplyAt: lastReplyAt ? lastReplyAt.toISOString() : null,
    })
  }, [storageKey, messages, conversationId, followUps, pendingActions, lastReplyAt])

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
          content: response.reply?.trim() || t('aiChat.fallbackReply'),
          timestamp: response.generatedAt ? new Date(response.generatedAt) : new Date(),
          actions: response.actions ?? [],
        }

        setConversationId(response.conversationId ?? null)
        setMessages(prev => [...prev, assistantMessage])
        setFollowUps(response.followUpSuggestions?.filter(Boolean) ?? [])
        setPendingActions(response.actions ?? [])
        setLastReplyAt(assistantMessage.timestamp)
      } catch (error) {
        console.error('[ai-chat] Failed to fetch reply', error)
        toast.error(t('aiChat.fetchError'))
      } finally {
        setIsThinking(false)
      }
    },
    [conversationId, isThinking, maxHistory, messages, preparedContext, t],
  )

  const executeAction = useCallback(async (action: AiAction) => {
    try {
      const result = await aiService.executeAction({
        action,
        userId: preparedContext?.displayName ?? 'unknown',
        familyId: preparedContext?.familyName,
      })

      if (result.success) {
        toast.success(result.message ?? t('aiChat.actionSuccess'))
        setPendingActions(prev => prev.filter(a => a !== action))
      } else {
        toast.error(result.message ?? t('aiChat.actionFailed'))
      }
    } catch (error) {
      console.error('[ai-chat] Failed to execute action', error)
      toast.error(t('aiChat.actionError'))
    }
  }, [preparedContext, t])

  const dismissAction = useCallback((action: AiAction) => {
    setPendingActions(prev => prev.filter(a => a !== action))
  }, [])

  return { messages, conversationId, followUps, pendingActions, lastReplyAt, isThinking, sendMessage, executeAction, dismissAction, reset }
}
