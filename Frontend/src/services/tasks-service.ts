import { httpClient } from '@/services/api/http-client'

export type TaskEvidenceRequirement = 'none' | 'photo' | 'video' | 'document'

// Backend может возвращать как enum-числа (0=None, 1=Photo, 2=Video, 3=Document),
// так и строки после обновления конфигурации
type TaskEvidenceRequirementBackend = 0 | 1 | 2 | 3 | TaskEvidenceRequirement

export interface TaskEvidenceDto {
  requirement: TaskEvidenceRequirementBackend
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
  updatedAt?: string | null
  completedAt?: string | null
  createdByUserId: string
  difficulty?: number
  reward?: number
  rewardPoints?: number
  evidence: TaskEvidenceDto
  assignedToUserId?: string // ID ребёнка, которому назначена задача (опционально)
}

export interface CreateTaskPayload {
  title: string
  description?: string
  confirmationType?: TaskEvidenceRequirement
  difficulty?: number
  dueDate?: string
  assignedToUserId?: string  // ID ребёнка, которому назначена задача (необязательно)
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
