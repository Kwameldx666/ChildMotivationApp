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

export interface ChildStats {
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
  // Additional metrics
  pendingTasks: number
  totalTasks: number
  completionRate: number
}

const DEFAULT_STATS: ChildStats = {
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
    instantReward: { pointsNeeded: 30, tasksNeeded: 3, description: "Stickers, extra story" },
    mediumReward: { pointsNeeded: 120, daysNeeded: 8, description: "Toy, movie night" },
    bigReward: { pointsNeeded: 350, weeksNeeded: 4, description: "Trip, big gift" },
  },
  pendingTasks: 0,
  totalTasks: 0,
  completionRate: 0,
}

interface UseChildStatsOptions {
  childId: string
  enabled?: boolean
}

export const useChildStats = ({ childId, enabled = true }: UseChildStatsOptions) => {
  const tasksQuery = useTasks()
  const ordersQuery = useShopOrders()

  const stats = useMemo<ChildStats>(() => {
    if (!enabled || !childId) return DEFAULT_STATS

    const allTasks = tasksQuery.data ?? []
    
    // Filter tasks assigned to this child
    const childTasks = allTasks.filter((task) => task.assignedToUserId === childId)
    const completedTasks = childTasks.filter((task) => task.completed)
    const pendingTasks = childTasks.filter((task) => !task.completed).length
    
    const streak = calculateTaskStreak(completedTasks)
    const streakMultiplier = getStreakMultiplier(streak)
    
    // Calculate XP
    const xp = completedTasks.reduce((total, task) => total + computeTaskXp(task), 0)
    const level = Math.max(1, Math.floor(xp / 500) + 1)

    // Calculate points with streak bonuses
    const totalPointsEarned = completedTasks.reduce((total, task) => {
      const { totalPoints } = computeTaskPointsWithBonuses(task, streak)
      return total + totalPoints
    }, 0)
    
    const averagePointsPerTask = completedTasks.length > 0 
      ? Math.round(totalPointsEarned / completedTasks.length) 
      : 0

    // TODO: When API supports filtering orders by child
    const orders = ordersQuery.data ?? []
    const totalPointsSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const points = Math.max(0, totalPointsEarned - totalPointsSpent)
    const rewardsPurchased = orders.length

    // Calculate reward progress
    const averagePointsPerDay = completedTasks.length > 0 
      ? Math.round(totalPointsEarned / Math.max(1, streak || 7) * 7 / 7)
      : 15
    const rewardProgress = calculateRewardProgress(points, averagePointsPerDay)

    // Completion rate
    const completionRate = childTasks.length > 0 
      ? Math.round((completedTasks.length / childTasks.length) * 100)
      : 0

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
      pendingTasks,
      totalTasks: childTasks.length,
      completionRate,
    }
  }, [tasksQuery.data, ordersQuery.data, childId, enabled])

  return {
    stats: stats ?? DEFAULT_STATS,
    isLoading: tasksQuery.isLoading || ordersQuery.isLoading,
    isError: tasksQuery.isError || ordersQuery.isError,
    refetch: () => Promise.all([tasksQuery.refetch(), ordersQuery.refetch()]),
  }
}
