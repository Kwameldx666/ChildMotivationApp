import type { TaskDto } from '@/services/tasks-service'

const MILLISECONDS_IN_DAY = 86_400_000

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const startOfDay = (value: Date) => {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const formatDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const computeTaskDifficulty = (task: TaskDto) => {
  const titleLength = task.title?.length ?? 6
  const base = titleLength % 5
  return Math.min(5, Math.max(1, base + 1))
}

export const computeTaskXp = (task: TaskDto) => 60 + computeTaskDifficulty(task) * 20

export const DIFFICULTY_POINTS: Record<number, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 20,
  5: 50,
}

export const computeTaskPoints = (task: TaskDto) => DIFFICULTY_POINTS[computeTaskDifficulty(task)] ?? 0

export const calculateTaskStreak = (tasks: TaskDto[], now: Date = new Date()) => {
  if (!tasks.length) return 0

  const completionDays = new Set(
    tasks
      .filter((task) => task.completed && task.completedAt)
      .map((task) => toDate(task.completedAt))
      .filter((date): date is Date => Boolean(date))
      .map((date) => formatDateKey(startOfDay(date))),
  )

  if (completionDays.size === 0) {
    return 0
  }

  let streak = 0
  let cursor = startOfDay(now)

  while (completionDays.has(formatDateKey(cursor))) {
    streak += 1
    cursor = startOfDay(new Date(cursor.getTime() - MILLISECONDS_IN_DAY))
  }

  return streak
}
