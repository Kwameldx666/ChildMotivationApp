import { httpClient } from '@/services/api/http-client'

export interface TaskDto {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  createdByUserId: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
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
}
