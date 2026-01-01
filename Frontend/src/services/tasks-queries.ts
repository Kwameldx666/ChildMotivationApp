import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksService, TaskDto, CreateTaskPayload, UpdateTaskPayload } from './tasks-service'

export function useTasks() {
  return useQuery<TaskDto[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksService.list(),
    staleTime: 60_000, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => tasksService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
