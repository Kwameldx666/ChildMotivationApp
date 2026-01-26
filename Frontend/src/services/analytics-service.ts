import { httpClient } from '@/services/api/http-client'

export interface DailyActivity {
  day: string
  tasksCompleted: number
  pointsEarned: number
}

export interface ChildStats {
  childId: string
  childName: string
  totalPoints: number
  completedTasks: number
  pendingTasks: number
  color: string
}

export interface CategoryData {
  name: string
  value: number
  color: string
}

export interface WeeklyProgress {
  week: string
  completed: number
  total: number
}

export interface TaskStatus {
  completed: number
  inProgress: number
  overdue: number
}

export interface PointsTrend {
  date: string
  points: number
}

export interface AnalyticsData {
  totalPoints: number
  completedTasks: number
  totalTasks: number
  activeChildren: number
  completionRate: number
  weeklyActivity: DailyActivity[]
  childrenStats: ChildStats[]
  difficultyDistribution: CategoryData[]
  weeklyProgress: WeeklyProgress[]
  taskStatus: TaskStatus
  pointsTrend: PointsTrend[]
}

export async function getTaskAnalytics(windowDays: number = 30): Promise<AnalyticsData> {
  return httpClient.request<AnalyticsData>(
    `/api-gateway/analytics/tasks?windowDays=${windowDays}`,
    { auth: true }
  )
}
