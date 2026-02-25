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

// ============================================
// 🎯 МОТИВАЦИОННАЯ СИСТЕМА НАЧИСЛЕНИЯ ОЧКОВ
// ============================================

// Базовые очки за сложность задачи
// Рассчитаны так, чтобы за неделю средней активности можно было получить еженедельную награду (100-150 очков)
// При 2-3 задачах в день средней сложности = ~70-90 очков в неделю базовых
// + бонусы за серию = достижение цели
export const DIFFICULTY_POINTS: Record<number, number> = {
  1: 5,   // Очень легкая (заправить кровать) - 5 очков
  2: 10,  // Легкая (убрать игрушки) - 10 очков
  3: 15,  // Средняя (помыть посуду) - 15 очков
  4: 25,  // Сложная (убрать комнату) - 25 очков  
  5: 40,  // Очень сложная (большой проект) - 40 очков
}

// XP за уровни (не влияет на награды, только на прогресс)
export const DIFFICULTY_XP: Record<number, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 100,
  5: 150,
}

// Бонусы за серию выполнения (streak)
// Мотивирует выполнять задачи каждый день
export const STREAK_BONUS_MULTIPLIERS: Record<number, number> = {
  0: 1.0,   // Без серии - обычные очки
  3: 1.1,   // 3 дня подряд - +10%
  5: 1.2,   // 5 дней подряд - +20%
  7: 1.3,   // Неделя! - +30%
  14: 1.5,  // 2 недели! - +50%
  30: 2.0,  // Месяц! - x2 очки!
}

// Бонусы за время суток (мотивация делать задачи утром)
export const TIME_BONUS: Record<string, number> = {
  morning: 1.1,   // 6:00-12:00 - +10% (ранние пташки)
  afternoon: 1.0, // 12:00-18:00 - обычно
  evening: 0.9,   // 18:00-22:00 - -10% (лучше делать раньше)
}

// Бонусы за быстрое выполнение (относительно дедлайна)
export const EARLY_COMPLETION_BONUS: Record<string, number> = {
  veryEarly: 1.25,  // За день+ до дедлайна - +25%
  early: 1.1,       // Несколько часов раньше - +10%
  onTime: 1.0,      // Вовремя
  late: 0.75,       // После дедлайна - только 75%
}

// Получить бонус за серию
export const getStreakMultiplier = (streakDays: number): number => {
  const thresholds = Object.keys(STREAK_BONUS_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a)
  
  for (const threshold of thresholds) {
    if (streakDays >= threshold) {
      return STREAK_BONUS_MULTIPLIERS[threshold]
    }
  }
  return 1.0
}

// Получить бонус за время суток
export const getTimeBonus = (completedAt?: string | Date | null): number => {
  const date = toDate(completedAt)
  if (!date) return 1.0
  
  const hour = date.getHours()
  if (hour >= 6 && hour < 12) return TIME_BONUS.morning
  if (hour >= 12 && hour < 18) return TIME_BONUS.afternoon
  return TIME_BONUS.evening
}

// Получить бонус за раннее выполнение
export const getEarlyCompletionBonus = (
  completedAt?: string | Date | null,
  dueDate?: string | Date | null
): number => {
  const completed = toDate(completedAt)
  const due = toDate(dueDate)
  
  if (!completed || !due) return 1.0
  
  const hoursBeforeDue = (due.getTime() - completed.getTime()) / (1000 * 60 * 60)
  
  if (hoursBeforeDue >= 24) return EARLY_COMPLETION_BONUS.veryEarly
  if (hoursBeforeDue >= 2) return EARLY_COMPLETION_BONUS.early
  if (hoursBeforeDue >= 0) return EARLY_COMPLETION_BONUS.onTime
  return EARLY_COMPLETION_BONUS.late
}

export const computeTaskDifficulty = (task: TaskDto) => {
  // Если задача имеет явную сложность - используем её
  if (task.difficulty && task.difficulty >= 1 && task.difficulty <= 5) {
    return task.difficulty
  }
  // Иначе оцениваем по длине названия
  const titleLength = task.title?.length ?? 6
  const base = titleLength % 5
  return Math.min(5, Math.max(1, base + 1))
}

// Базовый XP за задачу
export const computeTaskXp = (task: TaskDto) => {
  const difficulty = computeTaskDifficulty(task)
  return DIFFICULTY_XP[difficulty] ?? 40
}

// Базовые очки за задачу
export const computeTaskBasePoints = (task: TaskDto) => {
  const difficulty = computeTaskDifficulty(task)
  return DIFFICULTY_POINTS[difficulty] ?? 10
}

// Полный расчёт очков с бонусами
export interface PointsBreakdown {
  basePoints: number
  streakBonus: number
  timeBonus: number
  earlyBonus: number
  totalPoints: number
  multiplierDescription: string[]
}

export const computeTaskPointsWithBonuses = (
  task: TaskDto,
  streakDays: number = 0,
  dueDate?: string | Date | null
): PointsBreakdown => {
  const basePoints = computeTaskBasePoints(task)
  
  const streakMultiplier = getStreakMultiplier(streakDays)
  const timeMultiplier = getTimeBonus(task.completedAt)
  const earlyMultiplier = getEarlyCompletionBonus(task.completedAt, dueDate)
  
  const totalMultiplier = streakMultiplier * timeMultiplier * earlyMultiplier
  const totalPoints = Math.round(basePoints * totalMultiplier)
  
  const multiplierDescription: string[] = []
  
  if (streakMultiplier > 1) {
    multiplierDescription.push(`🔥 Серия: +${Math.round((streakMultiplier - 1) * 100)}%`)
  }
  if (timeMultiplier > 1) {
    multiplierDescription.push(`🌅 Утро: +${Math.round((timeMultiplier - 1) * 100)}%`)
  }
  if (earlyMultiplier > 1) {
    multiplierDescription.push(`⚡ Раньше срока: +${Math.round((earlyMultiplier - 1) * 100)}%`)
  }
  if (earlyMultiplier < 1) {
    multiplierDescription.push(`⏰ После срока: ${Math.round((earlyMultiplier - 1) * 100)}%`)
  }
  if (timeMultiplier < 1) {
    multiplierDescription.push(`🌙 Вечер: ${Math.round((timeMultiplier - 1) * 100)}%`)
  }
  
  return {
    basePoints,
    streakBonus: Math.round(basePoints * (streakMultiplier - 1)),
    timeBonus: Math.round(basePoints * (timeMultiplier - 1)),
    earlyBonus: Math.round(basePoints * (earlyMultiplier - 1)),
    totalPoints,
    multiplierDescription,
  }
}

// Старая функция для обратной совместимости
export const computeTaskPoints = (task: TaskDto) => computeTaskBasePoints(task)

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

// ============================================
// 📊 РАСЧЁТ ПРОГРЕССА ДО НАГРАД
// ============================================

export interface RewardProgress {
  instantReward: { pointsNeeded: number; tasksNeeded: number; description: string }
  mediumReward: { pointsNeeded: number; daysNeeded: number; description: string }
  bigReward: { pointsNeeded: number; weeksNeeded: number; description: string }
}

export const calculateRewardProgress = (currentPoints: number, averagePointsPerDay: number = 15): RewardProgress => {
  const instantTarget = 30  // Мгновенная награда
  const mediumTarget = 120  // Еженедельная награда
  const bigTarget = 350     // Большая награда
  
  return {
    instantReward: {
      pointsNeeded: Math.max(0, instantTarget - currentPoints),
      tasksNeeded: Math.ceil(Math.max(0, instantTarget - currentPoints) / 10), // ~10 очков за задачу
      description: "Стикеры, доп. сказка",
    },
    mediumReward: {
      pointsNeeded: Math.max(0, mediumTarget - currentPoints),
      daysNeeded: Math.ceil(Math.max(0, mediumTarget - currentPoints) / averagePointsPerDay),
      description: "Игрушка, вечер кино",
    },
    bigReward: {
      pointsNeeded: Math.max(0, bigTarget - currentPoints),
      weeksNeeded: Math.ceil(Math.max(0, bigTarget - currentPoints) / (averagePointsPerDay * 7)),
      description: "Поездка, большой подарок",
    },
  }
}
