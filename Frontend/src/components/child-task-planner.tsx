"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame, CalendarDays, Plus, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlannedTask {
  id: string
  title: string
  category: string
  points: number
  duration: string
  icon: string
}

interface ChildTaskPlannerProps {
  streak: number
  isLoading?: boolean
}

const POSSIBLE_TASKS: PlannedTask[] = [
  { id: "plan-1", title: "Убрать игрушки", category: "Дом", points: 5, duration: "10 мин", icon: "🧸" },
  { id: "plan-2", title: "Прочитать 10 страниц", category: "Учёба", points: 8, duration: "20 мин", icon: "📘" },
  { id: "plan-3", title: "Сделать зарядку", category: "Активность", points: 6, duration: "15 мин", icon: "🏃" },
  { id: "plan-4", title: "Полить цветы", category: "Забота", points: 4, duration: "8 мин", icon: "🪴" },
  { id: "plan-5", title: "Помочь на кухне", category: "Семья", points: 7, duration: "15 мин", icon: "🍳" },
]

const INITIAL_PLANS: Record<string, PlannedTask[]> = {
  "2026-02-04": [
    { id: "plan-1", title: "Убрать игрушки", category: "Дом", points: 5, duration: "10 мин", icon: "🧸" },
    { id: "plan-3", title: "Сделать зарядку", category: "Активность", points: 6, duration: "15 мин", icon: "🏃" },
  ],
  "2026-02-05": [
    { id: "plan-2", title: "Прочитать 10 страниц", category: "Учёба", points: 8, duration: "20 мин", icon: "📘" },
  ],
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateLabel = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date)

export default function ChildTaskPlanner({ streak, isLoading = false }: ChildTaskPlannerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [plans, setPlans] = useState<Record<string, PlannedTask[]>>(INITIAL_PLANS)

  const selectedKey = useMemo(() => formatDateKey(selectedDate), [selectedDate])
  const plannedTasks = plans[selectedKey] ?? []

  const totalPoints = plannedTasks.reduce((sum, task) => sum + task.points, 0)

  const addTask = (task: PlannedTask) => {
    setPlans((prev) => {
      const existing = prev[selectedKey] ?? []
      if (existing.some((item) => item.id === task.id)) return prev
      return {
        ...prev,
        [selectedKey]: [...existing, task],
      }
    })
  }

  const removeTask = (taskId: string) => {
    setPlans((prev) => {
      const existing = prev[selectedKey] ?? []
      const next = existing.filter((task) => task.id !== taskId)
      if (next.length === existing.length) return prev
      return { ...prev, [selectedKey]: next }
    })
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Календарь и планирование
          </CardTitle>
          <div className="flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50 px-4 py-1 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
            <Flame className="h-4 w-4" />
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span>
                Серия: <span className="font-semibold">{streak}</span> дней
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Выбирай день и планируй задания — так легче держать серию и зарабатывать очки.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="mx-auto"
            />
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 p-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Выбранная дата</p>
            <p className="text-base font-semibold capitalize">{formatDateLabel(selectedDate)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full">
                {plannedTasks.length} задач
              </Badge>
              <span>•</span>
              <Badge className="rounded-full bg-primary/10 text-primary">
                {totalPoints} очков
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">План на день</h3>
                <p className="text-xs text-muted-foreground">Что нужно выполнить</p>
              </div>
              <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                {plannedTasks.length ? "В работе" : "Свободно"}
              </Badge>
            </div>

            {plannedTasks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                Пока нет запланированных задач. Добавь идеи из списка ниже.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {plannedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-lg">{task.icon}</div>
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.category} • {task.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary">+{task.points}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Возможные задания</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Идеи, которые можно добавить в план.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {POSSIBLE_TASKS.map((task) => {
                const alreadyPlanned = plannedTasks.some((item) => item.id === task.id)
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "rounded-lg border border-border/60 bg-background px-3 py-3 flex flex-col gap-2",
                      alreadyPlanned && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{task.icon}</span>
                        <div>
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.category}</p>
                        </div>
                      </div>
                      <Badge className="rounded-full bg-secondary/80 text-secondary-foreground">{task.duration}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">+{task.points} очков</span>
                      <Button
                        size="sm"
                        variant={alreadyPlanned ? "secondary" : "outline"}
                        className="h-8 gap-1"
                        onClick={() => addTask(task)}
                        disabled={alreadyPlanned}
                      >
                        <Plus className="h-3 w-3" />
                        {alreadyPlanned ? "В плане" : "Запланировать"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
