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
    queryFn: async () => {
      const tasks = await tasksService.list()
      const normalizedTasks = Array.isArray(tasks) ? tasks : []

      const isChild = session?.profile.role === 'child'
      const childId = session?.user.id

      if (isChild && childId) {
        const normalizedChildId = childId.trim().toLowerCase()
        const scopedChildTasks = normalizedTasks.filter((task) => {
          const assignedTo = task.assignedToUserId?.trim().toLowerCase()
          const createdBy = task.createdByUserId?.trim().toLowerCase()
          return assignedTo === normalizedChildId || (!assignedTo && createdBy === normalizedChildId)
        })
        return scopedChildTasks
      }

      return normalizedTasks
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,          // 30 seconds before considered stale
    gcTime: 1000 * 60 * 10,        // 10 minutes in cache
    refetchInterval: 1000 * 30,    // poll every 30s when tab is focused
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => tasksService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useRequestApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.requestApproval(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useApproveTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useRejectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useStartTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useSubmitTaskEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => tasksService.submitEvidence(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['missions'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
    },
  })
}

export function useDownloadTaskEvidence() {
  return useMutation({
    mutationFn: (id: string) => tasksService.downloadEvidence(id),
  })
}
