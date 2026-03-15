import { httpClient } from './api/http-client'

export interface FamilyMessageDto {
  id: string
  familyId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  createdAt: string
  isRead: boolean
  mentionedTaskId?: string | null
  mentionedTaskTitle?: string | null
  replyToMessageId?: string | null
}

export interface SendMessageRequest {
  content: string
  mentionedTaskId?: string | null
  replyToMessageId?: string | null
  senderId?: string
  senderName?: string
  senderAvatar?: string
}

const MOCK_CHAT_STORAGE_KEY = 'familyquest:mock-chat:v1'

type MockChatStore = Record<string, FamilyMessageDto[]>

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const loadMockStore = (): MockChatStore => {
  if (!canUseStorage()) return {}

  try {
    const raw = window.localStorage.getItem(MOCK_CHAT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MockChatStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const saveMockStore = (store: MockChatStore) => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(MOCK_CHAT_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore storage errors in demo mode
  }
}

const getMockMessages = (chatId: string): FamilyMessageDto[] => {
  const store = loadMockStore()
  return store[chatId] ?? []
}

const addMockMessage = (chatId: string, request: SendMessageRequest): FamilyMessageDto => {
  const store = loadMockStore()
  const existing = store[chatId] ?? []
  const nowIso = new Date().toISOString()

  const message: FamilyMessageDto = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    familyId: chatId,
    senderId: request.senderId ?? 'current-user',
    senderName: request.senderName ?? 'You',
    senderAvatar: request.senderAvatar ?? '',
    content: request.content,
    createdAt: nowIso,
    isRead: true,
    mentionedTaskId: request.mentionedTaskId ?? null,
    replyToMessageId: request.replyToMessageId ?? null,
  }

  store[chatId] = [...existing, message]
  saveMockStore(store)

  return message
}

export const familyChatService = {
  async getMessages(familyId: string, limit: number = 50, before?: Date) {
    let url = `/api-gateway/family-chat/${familyId}?limit=${limit}`
    if (before) {
      url += `&before=${before.toISOString()}`
    }

    try {
      return await httpClient.get<FamilyMessageDto[]>(url)
    } catch {
      let messages = getMockMessages(familyId)
      if (before) {
        messages = messages.filter(message => new Date(message.createdAt) < before)
      }
      return messages.slice(-limit)
    }
  },

  async sendMessage(familyId: string, request: SendMessageRequest) {
    const apiRequest = {
      content: request.content,
      mentionedTaskId: request.mentionedTaskId,
      replyToMessageId: request.replyToMessageId,
    }

    try {
      return await httpClient.post<FamilyMessageDto>(`/api-gateway/family-chat/${familyId}/messages`, apiRequest)
    } catch {
      return addMockMessage(familyId, request)
    }
  },
}
