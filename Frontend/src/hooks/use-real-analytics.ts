/**
 * Computes AnalyticsData client-side from real task + order + family data.
 * No mock data, no subscription-gated backend endpoint.
 */
import { useMemo } from 'react'
import { useTasks } from '@/services/tasks-queries'
import { useShopOrders } from '@/services/shop-queries'
import { useFamilyMembers } from '@/services/family-queries'
import { computeTaskDifficulty, computeTaskPoints } from '@/lib/task-metrics'
import type { TaskDto } from '@/services/tasks-service'
import type { AnalyticsData, DailyActivity, ChildStats, CategoryData, WeeklyProgress, PointsTrend, ChildBreakdown } from '@/services/analytics-service'

/* ── color palettes ── */
const CHILD_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6']

const DIFFICULTY_LABELS: Record<number, { name: string; color: string }> = {
  1: { name: 'Очень легко', color: '#22c55e' },
  2: { name: 'Легко', color: '#84cc16' },
  3: { name: 'Средне', color: '#eab308' },
  4: { name: 'Сложно', color: '#f97316' },
  5: { name: 'Очень сложно', color: '#ef4444' },
}

/* ── date helpers ── */
const fmtDate = (d: Date) =>
  `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`

const startOfDay = (d: Date) => {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

const dayKey = (d: Date) => startOfDay(d).getTime()

const parseTimestamp = (value?: string | null): number | null => {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? null : ts
}

const normalizeUserId = (value?: string | null): string | null => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

const getTaskCompletionTimestamp = (task: TaskDto): number | null => {
  if (!task.completed) return null
  return parseTimestamp(task.completedAt) ?? parseTimestamp(task.updatedAt) ?? parseTimestamp(task.createdAt)
}

const getTaskActivityTimestamp = (task: TaskDto): number => {
  return getTaskCompletionTimestamp(task) ?? parseTimestamp(task.updatedAt) ?? parseTimestamp(task.createdAt) ?? 0
}

/* ── build helpers ── */

function buildWeeklyActivity(tasks: TaskDto[], windowDays: number): DailyActivity[] {
  const now = new Date()
  const useDailyGranularity = windowDays <= 14

  if (useDailyGranularity) {
    return Array.from({ length: windowDays }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (windowDays - 1 - i))
      const dateStart = startOfDay(date).getTime()
      const dateEnd = dateStart + 86_400_000

      const dayTasks = tasks.filter(t => {
        const ts = getTaskCompletionTimestamp(t)
        if (ts === null) return false
        return ts >= dateStart && ts < dateEnd
      })

      return {
        day: fmtDate(date),
        tasksCompleted: dayTasks.length,
        pointsEarned: dayTasks.reduce((s, t) => s + computeTaskPoints(t), 0),
      }
    })
  }

  // Weekly buckets
  const buckets = Math.ceil(windowDays / 7)
  return Array.from({ length: buckets }, (_, i) => {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - (buckets - 1 - i) * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)

    const ws = startOfDay(weekStart).getTime()
    const we = startOfDay(weekEnd).getTime() + 86_400_000

    const weekTasks = tasks.filter(t => {
      const ts = getTaskCompletionTimestamp(t)
      if (ts === null) return false
      return ts >= ws && ts < we
    })

    return {
      day: `${fmtDate(weekStart)}–${fmtDate(weekEnd)}`,
      tasksCompleted: weekTasks.length,
      pointsEarned: weekTasks.reduce((s, t) => s + computeTaskPoints(t), 0),
    }
  })
}

function buildDifficultyDistribution(tasks: TaskDto[]): CategoryData[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const t of tasks) {
    const diff = computeTaskDifficulty(t)
    counts[diff] = (counts[diff] || 0) + 1
  }
  return Object.entries(counts).map(([key, value]) => {
    const d = Number(key)
    const meta = DIFFICULTY_LABELS[d] || { name: `Ур. ${d}`, color: '#94a3b8' }
    return { name: meta.name, value, color: meta.color }
  })
}

function buildWeeklyProgress(tasks: TaskDto[], windowDays: number): WeeklyProgress[] {
  const now = new Date()
  const useDailyGranularity = windowDays <= 14
  const buckets = useDailyGranularity ? windowDays : Math.min(Math.ceil(windowDays / 7), 8)

  return Array.from({ length: buckets }, (_, i) => {
    const end = new Date(now)
    if (useDailyGranularity) {
      end.setDate(end.getDate() - (buckets - 1 - i))
    } else {
      end.setDate(end.getDate() - (buckets - 1 - i) * 7)
    }

    const start = new Date(end)
    if (!useDailyGranularity) start.setDate(start.getDate() - 6)

    const ws = startOfDay(start).getTime()
    const we = startOfDay(end).getTime() + 86_400_000

    const periodTasks = tasks.filter(t => {
      const created = new Date(t.createdAt).getTime()
      return created >= ws && created < we
    })

    const completed = periodTasks.filter(t => t.completed).length
    const total = periodTasks.length

    const label = useDailyGranularity
      ? fmtDate(end)
      : `${fmtDate(start)}–${fmtDate(end)}`

    return { week: label, completed, total }
  })
}

function buildPointsTrend(tasks: TaskDto[], windowDays: number): PointsTrend[] {
  const now = new Date()
  const useDailyGranularity = windowDays <= 14
  const buckets = useDailyGranularity ? windowDays : Math.ceil(windowDays / 7)

  return Array.from({ length: buckets }, (_, i) => {
    const end = new Date(now)
    if (useDailyGranularity) {
      end.setDate(end.getDate() - (buckets - 1 - i))
    } else {
      end.setDate(end.getDate() - (buckets - 1 - i) * 7)
    }

    const start = new Date(end)
    if (!useDailyGranularity) start.setDate(start.getDate() - 6)

    const we = startOfDay(end).getTime() + 86_400_000

    const cumulative = tasks.reduce((sum, t) => {
      const ts = getTaskCompletionTimestamp(t)
      if (ts !== null && ts < we) {
        return sum + computeTaskPoints(t)
      }
      return sum
    }, 0)

    const label = useDailyGranularity ? fmtDate(end) : `${fmtDate(start)}–${fmtDate(end)}`
    return { date: label, points: cumulative }
  })
}

/* ── Main hook ── */

interface UseRealAnalyticsResult {
  analytics: AnalyticsData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useRealAnalytics(windowDays: number = 30): UseRealAnalyticsResult {
  const tasksQuery = useTasks()
  const ordersQuery = useShopOrders()
  const familyQuery = useFamilyMembers()

  const isLoading = tasksQuery.isLoading || ordersQuery.isLoading || familyQuery.isLoading
  const isError = tasksQuery.isError
  const error = tasksQuery.error as Error | null

  const analytics = useMemo<AnalyticsData | null>(() => {
    const allTasks = tasksQuery.data
    if (!allTasks) return null

    const cutoff = Date.now() - windowDays * 86_400_000
    const recentTasks = allTasks.filter(t => getTaskActivityTimestamp(t) >= cutoff)

    const completedTasks = recentTasks.filter(t => {
      const completedTs = getTaskCompletionTimestamp(t)
      return completedTs !== null && completedTs >= cutoff
    })
    const totalPoints = completedTasks.reduce((s, t) => s + computeTaskPoints(t), 0)
    const completionRate = recentTasks.length > 0
      ? (completedTasks.length / recentTasks.length) * 100
      : 0

    // Children from family members (role=child) or from task assignees
    const familyMembers = familyQuery.data ?? []
    const normalizeRole = (role?: string | null) => role?.trim().toLowerCase() ?? ''
    const normalizedFamilyMembers = familyMembers
      .map(member => {
        const normalizedId = normalizeUserId(member.id)
        if (!normalizedId) return null
        return { ...member, normalizedId }
      })
      .filter((member): member is NonNullable<typeof member> => member !== null)

    const childMembersByRole = normalizedFamilyMembers.filter(m => normalizeRole(m.role) === 'child')
    const parentMembers = normalizedFamilyMembers.filter(m => normalizeRole(m.role) === 'parent')
    const childMembers = childMembersByRole.length > 0
      ? childMembersByRole
      : normalizedFamilyMembers.filter(m => !parentMembers.some(parent => parent.normalizedId === m.normalizedId))

    const childMembersById = new Map(childMembers.map(member => [member.normalizedId, member]))
    const resolveTaskChildId = (task: TaskDto): string | null => {
      const assignedTo = normalizeUserId(task.assignedToUserId)
      if (assignedTo) return assignedTo

      const createdBy = normalizeUserId(task.createdByUserId)
      if (!createdBy) return null

      return childMembersById.has(createdBy) ? createdBy : null
    }

    const childTasksById = new Map<string, TaskDto[]>()
    const allChildTasksById = new Map<string, TaskDto[]>()

    for (const task of allTasks) {
      const childId = resolveTaskChildId(task)
      if (!childId) continue

      const existingAll = allChildTasksById.get(childId)
      if (existingAll) {
        existingAll.push(task)
      } else {
        allChildTasksById.set(childId, [task])
      }
    }

    for (const task of recentTasks) {
      const childId = resolveTaskChildId(task)
      if (!childId) continue

      const existing = childTasksById.get(childId)
      if (existing) {
        existing.push(task)
      } else {
        childTasksById.set(childId, [task])
      }
    }

    // Unique child IDs from tasks
    const childIdsFromTasks = [...new Set(
      allTasks
        .map(resolveTaskChildId)
        .filter((id): id is string => !!id)
    )]

    // Merge: prefer family member data for name, fall back to ID
    const childIdSet = new Set([
      ...childMembers.map(m => m.normalizedId),
      ...childIdsFromTasks,
    ])
    const activeChildIds = [...childIdSet]

    const childrenStats: ChildStats[] = activeChildIds.map((childId, idx) => {
      const member = childMembersById.get(childId)
      const childTasks = childTasksById.get(childId) ?? []
      const completed = childTasks.filter(t => {
        const completedTs = getTaskCompletionTimestamp(t)
        return completedTs !== null && completedTs >= cutoff
      })
      const pending = childTasks.filter(t => !t.completed).length

      return {
        childId,
        childName: member?.name || `Ребёнок ${idx + 1}`,
        totalPoints: completed.reduce((s, t) => s + computeTaskPoints(t), 0),
        completedTasks: completed.length,
        pendingTasks: pending,
        color: CHILD_COLORS[idx % CHILD_COLORS.length],
      }
    })

    // Task status
    const overdue = recentTasks.filter(t => {
      if (t.completed) return false
      const created = new Date(t.createdAt).getTime()
      return (Date.now() - created) > 10 * 86_400_000
    }).length

    const inProgress = recentTasks.filter(t => {
      if (t.completed) return false
      const created = new Date(t.createdAt).getTime()
      const days = (Date.now() - created) / 86_400_000
      return days > 2 && days <= 10
    }).length

    const taskStatus = {
      completed: completedTasks.length,
      inProgress,
      overdue,
    }

    // Per-child breakdowns
    const perChildActivity: ChildBreakdown<DailyActivity>[] = activeChildIds.map(childId => ({
      childId,
      data: buildWeeklyActivity(childTasksById.get(childId) ?? [], windowDays),
    }))

    const perChildDifficulty: ChildBreakdown<CategoryData>[] = activeChildIds.map(childId => ({
      childId,
      data: buildDifficultyDistribution(childTasksById.get(childId) ?? []),
    }))

    const perChildProgress: ChildBreakdown<WeeklyProgress>[] = activeChildIds.map(childId => ({
      childId,
      data: buildWeeklyProgress(childTasksById.get(childId) ?? [], windowDays),
    }))

    const perChildPointsTrend: ChildBreakdown<PointsTrend>[] = activeChildIds.map(childId => ({
      childId,
      data: buildPointsTrend(allChildTasksById.get(childId) ?? [], windowDays),
    }))

    return {
      totalPoints,
      completedTasks: completedTasks.length,
      totalTasks: recentTasks.length,
      activeChildren: activeChildIds.length,
      completionRate,
      weeklyActivity: buildWeeklyActivity(recentTasks, windowDays),
      childrenStats,
      difficultyDistribution: buildDifficultyDistribution(recentTasks),
      weeklyProgress: buildWeeklyProgress(recentTasks, windowDays),
      taskStatus,
      pointsTrend: buildPointsTrend(allTasks, windowDays),
      perChildActivity,
      perChildDifficulty,
      perChildProgress,
      perChildPointsTrend,
    }
  }, [tasksQuery.data, familyQuery.data, windowDays])

  return { analytics, isLoading, isError, error }
}
