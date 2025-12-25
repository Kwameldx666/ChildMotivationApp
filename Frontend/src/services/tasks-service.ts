import { httpClient } from '@/services/api/http-client'

export interface TaskDto {
  id: string
  title: string
  description?: string
  points: number
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: string
  assigneeIds?: string[]
}

export interface CreateTaskPayload {
  title: string
  description?: string
  points?: number
  dueDate?: string
  assigneeIds?: string[]
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskDto['status']
}

export const tasksService = {
  list() {
    return httpClient.get<TaskDto[]>('/api/tasks')
  },
  create(payload: CreateTaskPayload) {
    return httpClient.post<TaskDto>('/api/tasks', payload)
  },
  update(taskId: string, payload: UpdateTaskPayload) {
    return httpClient.put<TaskDto>(`/api/tasks/${taskId}`, payload)
  },
  remove(taskId: string) {
    return httpClient.delete<void>(`/api/tasks/${taskId}`)
  },
  complete(taskId: string) {
    return httpClient.post<TaskDto>(`/api/tasks/${taskId}/complete`)
  },
}
