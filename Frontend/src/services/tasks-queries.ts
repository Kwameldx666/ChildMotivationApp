import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import { selectAuthSession } from '@/features/auth/store/authSlice'
import { tasksService, TaskDto, CreateTaskPayload, UpdateTaskPayload } from './tasks-service'

function buildMockChildTasks(childId: string): TaskDto[] {
  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  const toIso = (offsetDays: number) => new Date(now.getTime() - offsetDays * day).toISOString()

  return [
    {
      id: `mock-child-task-${childId}-1`,
      title: 'Заправить кровать',
      description: 'Утренний порядок в комнате',
      completed: true,
      pendingApproval: false,
      createdAt: toIso(4),
      completedAt: toIso(0),
      updatedAt: toIso(0),
      createdByUserId: 'mock-parent',
      assignedToUserId: childId,
      difficulty: 2,
      rewardPoints: 10,
      evidence: {
        requirement: 'none',
        isSubmitted: false,
      },
    },
    {
      id: `mock-child-task-${childId}-2`,
      title: 'Сделать домашнее задание',
      description: 'Математика и чтение',
      completed: true,
      pendingApproval: false,
      createdAt: toIso(3),
      completedAt: toIso(1),
      updatedAt: toIso(1),
      createdByUserId: 'mock-parent',
      assignedToUserId: childId,
      difficulty: 4,
      rewardPoints: 25,
      evidence: {
        requirement: 'photo',
        isSubmitted: true,
        fileName: 'homework.jpg',
        contentType: 'image/jpeg',
      },
    },
    {
      id: `mock-child-task-${childId}-3`,
      title: 'Помочь накрыть на стол',
      description: 'Подготовить посуду к ужину',
      completed: false,
      pendingApproval: false,
      createdAt: toIso(1),
      updatedAt: toIso(1),
      createdByUserId: 'mock-parent',
      assignedToUserId: childId,
      difficulty: 3,
      rewardPoints: 15,
      evidence: {
        requirement: 'photo',
        isSubmitted: false,
      },
    },
    {
      id: `mock-child-task-${childId}-4`,
      title: 'Прочитать 20 минут',
      description: 'Книга перед сном',
      completed: false,
      pendingApproval: false,
      createdAt: toIso(0),
      updatedAt: toIso(0),
      createdByUserId: 'mock-parent',
      assignedToUserId: childId,
      difficulty: 2,
      rewardPoints: 10,
      evidence: {
        requirement: 'none',
        isSubmitted: false,
      },
    },
  ]
}

export function useTasks() {
  const session = useAppSelector(selectAuthSession)
  const scopedKey: [string, string] = session
    ? [session.profile.role, session.user.id]
    : ['public', 'anonymous']

  return useQuery<TaskDto[]>({
    queryKey: ['tasks', ...scopedKey],
    queryFn: async () => {
      const tasks = await tasksService.list()

      const isChild = session?.profile.role === 'child'
      const hasNoTasks = !Array.isArray(tasks) || tasks.length === 0

      if (isChild && hasNoTasks && session?.user.id) {
        return buildMockChildTasks(session.user.id)
      }

      return tasks
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

export function useRequestApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.requestApproval(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useApproveTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useRejectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksService.reject(id),
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
