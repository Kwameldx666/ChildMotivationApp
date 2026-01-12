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
}

export const familyChatService = {
  getMessages(familyId: string, limit: number = 50, before?: Date) {
    let url = `/api-gateway/family-chat/${familyId}?limit=${limit}`
    if (before) {
      url += `&before=${before.toISOString()}`
    }
    return httpClient.get<FamilyMessageDto[]>(url)
  },

  sendMessage(familyId: string, request: SendMessageRequest) {
    return httpClient.post<FamilyMessageDto>(`/api-gateway/family-chat/${familyId}/messages`, request)
  },
}
