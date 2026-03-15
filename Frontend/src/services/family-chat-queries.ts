import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { familyChatService, type SendMessageRequest } from './family-chat-service'

export function useFamilyMessages(familyId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['family-messages', familyId],
    queryFn: () => familyId ? familyChatService.getMessages(familyId) : Promise.resolve([]),
    enabled: enabled && !!familyId,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  })
}

interface SendMessageMeta {
  senderId: string
  senderName: string
  senderAvatar?: string
}

export function useSendFamilyMessage(familyId: string | undefined, senderMeta?: SendMessageMeta) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: SendMessageRequest) => {
      if (!familyId) throw new Error('Family ID is required')
      return familyChatService.sendMessage(familyId, {
        ...request,
        senderId: request.senderId ?? senderMeta?.senderId,
        senderName: request.senderName ?? senderMeta?.senderName,
        senderAvatar: request.senderAvatar ?? senderMeta?.senderAvatar,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-messages', familyId] })
    },
  })
}
