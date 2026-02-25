import { useMemo } from 'react'
import { useTasks } from '@/services/tasks-queries'
import { useShopOrders } from '@/services/shop-queries'
import { 
  computeTaskXp, 
  calculateTaskStreak, 
  computeTaskPointsWithBonuses,
  getStreakMultiplier,
  calculateRewardProgress,
  type RewardProgress
} from '@/lib/task-metrics'

export interface ChildProgressStats {
  xp: number
  level: number
  points: number
  streak: number
  streakMultiplier: number
  tasksCompleted: number
  rewardsPurchased: number
  totalPointsSpent: number
  totalPointsEarned: number
  averagePointsPerTask: number
  rewardProgress: RewardProgress
}

const DEFAULT_STATS: ChildProgressStats = {
  xp: 0,
  level: 1,
  points: 0,
  streak: 0,
  streakMultiplier: 1.0,
  tasksCompleted: 0,
  rewardsPurchased: 0,
  totalPointsSpent: 0,
  totalPointsEarned: 0,
  averagePointsPerTask: 0,
  rewardProgress: {
    instantReward: { pointsNeeded: 30, tasksNeeded: 3, description: "Стикеры, доп. сказка" },
    mediumReward: { pointsNeeded: 120, daysNeeded: 8, description: "Игрушка, вечер кино" },
    bigReward: { pointsNeeded: 350, weeksNeeded: 4, description: "Поездка, большой подарок" },
  },
}

export const useChildProgressStats = () => {
  const tasksQuery = useTasks()
  const ordersQuery = useShopOrders()

  const stats = useMemo<ChildProgressStats>(() => {
    const tasks = tasksQuery.data ?? []
    const completedTasks = tasks.filter((task) => task.completed)
    const streak = calculateTaskStreak(completedTasks)
    const streakMultiplier = getStreakMultiplier(streak)
    
    // Рассчитываем XP
    const xp = completedTasks.reduce((total, task) => total + computeTaskXp(task), 0)
    const level = Math.max(1, Math.floor(xp / 500) + 1)

    // Рассчитываем очки с бонусами за серию
    const totalPointsEarned = completedTasks.reduce((total, task) => {
      const { totalPoints } = computeTaskPointsWithBonuses(task, streak)
      return total + totalPoints
    }, 0)
    
    const averagePointsPerTask = completedTasks.length > 0 
      ? Math.round(totalPointsEarned / completedTasks.length) 
      : 0

    const orders = ordersQuery.data ?? []
    const totalPointsSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const points = Math.max(0, totalPointsEarned - totalPointsSpent)
    const rewardsPurchased = orders.length

    // Рассчитываем прогресс до наград
    const averagePointsPerDay = completedTasks.length > 0 
      ? Math.round(totalPointsEarned / Math.max(1, streak || 7) * 7 / 7) // Примерно за неделю
      : 15 // По умолчанию
    const rewardProgress = calculateRewardProgress(points, averagePointsPerDay)

    return {
      xp,
      level,
      points,
      streak,
      streakMultiplier,
      tasksCompleted: completedTasks.length,
      rewardsPurchased,
      totalPointsSpent,
      totalPointsEarned,
      averagePointsPerTask,
      rewardProgress,
    }
  }, [tasksQuery.data, ordersQuery.data])

  return {
    stats: stats ?? DEFAULT_STATS,
    isLoading: tasksQuery.isLoading || ordersQuery.isLoading,
    isError: tasksQuery.isError || ordersQuery.isError,
    refetch: () => Promise.all([tasksQuery.refetch(), ordersQuery.refetch()]),
  }
}
