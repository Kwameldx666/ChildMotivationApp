import { httpClient } from '@/services/api/http-client'

export type TaskEvidenceRequirement = 'none' | 'photo' | 'video' | 'document'

export interface TaskEvidenceDto {
  requirement: TaskEvidenceRequirement
  isSubmitted: boolean
  fileName?: string | null
  contentType?: string | null
  fileSize?: number | null
  uploadedAt?: string | null
  uploadedByUserId?: string | null
}

export interface TaskDto {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  completedAt?: string | null
  createdByUserId: string
  evidence: TaskEvidenceDto
}

export interface CreateTaskPayload {
  title: string
  description?: string
  confirmationType?: TaskEvidenceRequirement
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  completed?: boolean
}

export const tasksService = {
  list() {
    return httpClient.get<TaskDto[]>('/api-gateway/tasks')
  },
  create(payload: CreateTaskPayload) {
    return httpClient.post<TaskDto>('/api-gateway/tasks', payload)
  },
  update(taskId: string, payload: UpdateTaskPayload) {
    return httpClient.put<TaskDto>(`/api-gateway/tasks/${taskId}`, payload)
  },
  remove(taskId: string) {
    return httpClient.delete<void>(`/api-gateway/tasks/${taskId}`)
  },
  complete(taskId: string) {
    return httpClient.post<void>(`/api-gateway/tasks/${taskId}/complete`)
  },
  submitEvidence(taskId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return httpClient.post<TaskDto>(`/api-gateway/tasks/${taskId}/evidence`, formData)
  },
  downloadEvidence(taskId: string) {
    return httpClient.get<Blob>(`/api-gateway/tasks/${taskId}/evidence`, { responseType: 'blob' })
  },
}
