import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { selectAuthSession } from '@/features/auth/store/authSlice'
import { tasksService, TaskDto, CreateTaskPayload, UpdateTaskPayload } from './tasks-service'

export function useTasks() {
  const session = useAppSelector(selectAuthSession)
  const scopedKey: [string, string] = session
    ? [session.profile.role, session.user.id]
    : ['public', 'anonymous']

  return useQuery<TaskDto[]>({
    queryKey: ['tasks', ...scopedKey],
    queryFn: () => tasksService.list(),
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 5, // 5 minutes - данные остаются свежими дольше
    gcTime: 1000 * 60 * 10, // 10 minutes - хранятся в памяти дольше
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

export function useSubmitTaskEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => tasksService.submitEvidence(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDownloadTaskEvidence() {
  return useMutation({
    mutationFn: (id: string) => tasksService.downloadEvidence(id),
  })
}
