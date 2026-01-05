import { useMemo } from 'react'
import { useTasks } from '@/services/tasks-queries'
import { useShopOrders } from '@/services/shop-queries'
import { computeTaskXp, calculateTaskStreak } from '@/lib/task-metrics'

export interface ChildProgressStats {
  xp: number
  level: number
  points: number
  streak: number
  tasksCompleted: number
  rewardsPurchased: number
  totalPointsSpent: number
}

const DEFAULT_STATS: ChildProgressStats = {
  xp: 0,
  level: 1,
  points: 0,
  streak: 0,
  tasksCompleted: 0,
  rewardsPurchased: 0,
  totalPointsSpent: 0,
}

export const useChildProgressStats = () => {
  const tasksQuery = useTasks()
  const ordersQuery = useShopOrders()

  const stats = useMemo<ChildProgressStats>(() => {
    const tasks = tasksQuery.data ?? []
    const completedTasks = tasks.filter((task) => task.completed)
    const xp = completedTasks.reduce((total, task) => total + computeTaskXp(task), 0)
    const streak = calculateTaskStreak(completedTasks)
    const level = Math.max(1, Math.floor(xp / 500) + 1)

    const orders = ordersQuery.data ?? []
    const totalPointsSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const points = Math.max(0, xp - totalPointsSpent)
    const rewardsPurchased = orders.length

    return {
      xp,
      level,
      points,
      streak,
      tasksCompleted: completedTasks.length,
      rewardsPurchased,
      totalPointsSpent,
    }
  }, [tasksQuery.data, ordersQuery.data])

  return {
    stats: stats ?? DEFAULT_STATS,
    isLoading: tasksQuery.isLoading || ordersQuery.isLoading,
    isError: tasksQuery.isError || ordersQuery.isError,
    refetch: () => Promise.all([tasksQuery.refetch(), ordersQuery.refetch()]),
  }
}
