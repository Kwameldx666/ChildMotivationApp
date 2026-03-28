/**
 * Mock analytics data generator for development.
 * Produces rich, realistic-looking data so every chart is populated.
 *
 * Usage:  import { generateMockAnalytics } from '@/services/analytics-mock'
 *         const data = generateMockAnalytics(windowDays)
 */
import type { AnalyticsData } from './analytics-service'

/* ── helpers ── */
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]

const fmtDate = (d: Date) =>
  `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`

const CHILD_NAMES = ['Алиса', 'Максим', 'София', 'Артём', 'Мария']
const CHILD_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981']

const DIFFICULTY_LEVELS = [
  { name: 'Очень легко', color: '#22c55e' },
  { name: 'Легко',       color: '#84cc16' },
  { name: 'Средне',      color: '#eab308' },
  { name: 'Сложно',      color: '#f97316' },
  { name: 'Очень сложно', color: '#ef4444' },
]

/* ── generator ── */
export function generateMockAnalytics(windowDays: number = 30): AnalyticsData {
  const numChildren = rand(2, 4)

  // ── Children stats ──
  const childrenStats = Array.from({ length: numChildren }, (_, i) => {
    const completed = rand(5, 35)
    const pending = rand(1, 10)
    return {
      childId: `child-${i + 1}`,
      childName: CHILD_NAMES[i],
      totalPoints: rand(80, 600),
      completedTasks: completed,
      pendingTasks: pending,
      color: CHILD_COLORS[i],
    }
  })

  const totalCompleted = childrenStats.reduce((s, c) => s + c.completedTasks, 0)
  const totalPending = childrenStats.reduce((s, c) => s + c.pendingTasks, 0)
  const totalTasks = totalCompleted + totalPending + rand(0, 8)
  const totalPoints = childrenStats.reduce((s, c) => s + c.totalPoints, 0)

  // ── Daily / weekly activity ──
  const useDailyGranularity = windowDays <= 14
  const buckets = useDailyGranularity
    ? windowDays
    : Math.ceil(windowDays / 7)

  const now = new Date()
  const weeklyActivity = Array.from({ length: buckets }, (_, i) => {
    const d = new Date(now)
    if (useDailyGranularity) {
      d.setDate(d.getDate() - (buckets - 1 - i))
      return {
        day: fmtDate(d),
        tasksCompleted: rand(0, 8),
        pointsEarned: rand(0, 50),
      }
    } else {
      d.setDate(d.getDate() - (buckets - 1 - i) * 7)
      const end = new Date(d)
      end.setDate(end.getDate() + 6)
      return {
        day: `${fmtDate(d)}–${fmtDate(end)}`,
        tasksCompleted: rand(3, 25),
        pointsEarned: rand(20, 180),
      }
    }
  })

  // ── Difficulty distribution ──
  const difficultyDistribution = DIFFICULTY_LEVELS.map((lvl) => ({
    name: lvl.name,
    value: rand(2, 20),
    color: lvl.color,
  }))

  // ── Weekly progress ──
  const progressBuckets = Math.min(buckets, 8)
  const weeklyProgress = Array.from({ length: progressBuckets }, (_, i) => {
    const total = rand(8, 25)
    const completed = rand(Math.floor(total * 0.3), total)
    const d = new Date(now)
    if (useDailyGranularity) {
      d.setDate(d.getDate() - (progressBuckets - 1 - i))
      return { week: fmtDate(d), completed, total }
    } else {
      d.setDate(d.getDate() - (progressBuckets - 1 - i) * 7)
      const end = new Date(d)
      end.setDate(end.getDate() + 6)
      return { week: `${fmtDate(d)}–${fmtDate(end)}`, completed, total }
    }
  })

  // ── Task status ──
  const overdue = rand(0, 5)
  const taskStatus = {
    completed: totalCompleted,
    inProgress: totalPending,
    overdue,
  }

  // ── Points trend ──
  const trendBuckets = useDailyGranularity ? windowDays : Math.ceil(windowDays / 7)
  let cumulativePoints = rand(10, 60)
  const pointsTrend = Array.from({ length: trendBuckets }, (_, i) => {
    cumulativePoints += rand(5, 40)
    const d = new Date(now)
    if (useDailyGranularity) {
      d.setDate(d.getDate() - (trendBuckets - 1 - i))
    } else {
      d.setDate(d.getDate() - (trendBuckets - 1 - i) * 7)
    }
    return { date: fmtDate(d), points: cumulativePoints }
  })

  const completionRate = totalTasks > 0
    ? (totalCompleted / totalTasks) * 100
    : 0

  // ── Per-child breakdowns ──
  const perChildActivity = childrenStats.map((child) => ({
    childId: child.childId,
    data: weeklyActivity.map((bucket) => {
      const tasksCompleted = Math.max(0, Math.round(bucket.tasksCompleted * (0.45 + Math.random() * 0.35)))
      const pointsEarned = Math.max(0, Math.round(bucket.pointsEarned * (0.4 + Math.random() * 0.4)))
      return {
        day: bucket.day,
        tasksCompleted,
        pointsEarned,
      }
    }),
  }))

  const perChildDifficulty = childrenStats.map((child) => ({
    childId: child.childId,
    data: difficultyDistribution.map((difficulty) => ({
      ...difficulty,
      value: Math.max(0, Math.round(difficulty.value * (0.35 + Math.random() * 0.6))),
    })),
  }))

  const perChildProgress = childrenStats.map((child) => ({
    childId: child.childId,
    data: weeklyProgress.map((item) => {
      const total = Math.max(1, Math.round(item.total * (0.4 + Math.random() * 0.5)))
      const completed = Math.min(total, Math.max(0, Math.round(item.completed * (0.35 + Math.random() * 0.6))))
      return {
        week: item.week,
        completed,
        total,
      }
    }),
  }))

  const perChildPointsTrend = childrenStats.map((child) => {
    let cumulative = rand(0, 40)
    return {
      childId: child.childId,
      data: pointsTrend.map((point) => {
        cumulative += rand(5, 35)
        return {
          date: point.date,
          points: cumulative,
        }
      }),
    }
  })

  return {
    totalPoints,
    completedTasks: totalCompleted,
    totalTasks,
    activeChildren: numChildren,
    completionRate,
    weeklyActivity,
    childrenStats,
    difficultyDistribution,
    weeklyProgress,
    taskStatus,
    pointsTrend,
    perChildActivity,
    perChildDifficulty,
    perChildProgress,
    perChildPointsTrend,
  }
}
