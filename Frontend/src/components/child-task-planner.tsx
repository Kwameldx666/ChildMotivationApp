"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame, CalendarDays, Plus, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"

interface PlannedTaskDefinition {
  id: string
  titleKey: string
  categoryKey: string
  points: number
  durationKey: string
  icon: string
}

interface ChildTaskPlannerProps {
  streak: number
  isLoading?: boolean
}

const TASK_DEFINITIONS: PlannedTaskDefinition[] = [
  {
    id: "plan-1",
    titleKey: "childTaskPlanner.tasks.cleanToys.title",
    categoryKey: "childTaskPlanner.tasks.cleanToys.category",
    points: 5,
    durationKey: "childTaskPlanner.tasks.cleanToys.duration",
    icon: "🧸",
  },
  {
    id: "plan-2",
    titleKey: "childTaskPlanner.tasks.readPages.title",
    categoryKey: "childTaskPlanner.tasks.readPages.category",
    points: 8,
    durationKey: "childTaskPlanner.tasks.readPages.duration",
    icon: "📘",
  },
  {
    id: "plan-3",
    titleKey: "childTaskPlanner.tasks.exercise.title",
    categoryKey: "childTaskPlanner.tasks.exercise.category",
    points: 6,
    durationKey: "childTaskPlanner.tasks.exercise.duration",
    icon: "🏃",
  },
  {
    id: "plan-4",
    titleKey: "childTaskPlanner.tasks.waterPlants.title",
    categoryKey: "childTaskPlanner.tasks.waterPlants.category",
    points: 4,
    durationKey: "childTaskPlanner.tasks.waterPlants.duration",
    icon: "🪴",
  },
  {
    id: "plan-5",
    titleKey: "childTaskPlanner.tasks.helpKitchen.title",
    categoryKey: "childTaskPlanner.tasks.helpKitchen.category",
    points: 7,
    durationKey: "childTaskPlanner.tasks.helpKitchen.duration",
    icon: "🍳",
  },
]

const TASKS_BY_ID = TASK_DEFINITIONS.reduce<Record<string, PlannedTaskDefinition>>((acc, task) => {
  acc[task.id] = task
  return acc
}, {})

const INITIAL_PLANS: Record<string, string[]> = {
  "2026-02-04": ["plan-1", "plan-3"],
  "2026-02-05": ["plan-2"],
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const resolveIntlLocale = (locale: string) => {
  if (locale === "ru") return "ru-RU"
  if (locale === "ro") return "ro-RO"
  return "en-US"
}

const formatDateLabel = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date)

export default function ChildTaskPlanner({ streak, isLoading = false }: ChildTaskPlannerProps) {
  const { t, locale } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [plans, setPlans] = useState<Record<string, string[]>>(INITIAL_PLANS)

  const selectedKey = useMemo(() => formatDateKey(selectedDate), [selectedDate])
  const plannedTaskIds = plans[selectedKey] ?? []
  const plannedTasks = useMemo(
    () => plannedTaskIds.map((id) => TASKS_BY_ID[id]).filter((task): task is PlannedTaskDefinition => Boolean(task)),
    [plannedTaskIds]
  )
  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate, locale), [selectedDate, locale])

  const totalPoints = plannedTasks.reduce((sum, task) => sum + task.points, 0)

  const addTask = (taskId: string) => {
    setPlans((prev) => {
      const existing = prev[selectedKey] ?? []
      if (existing.includes(taskId)) return prev
      return {
        ...prev,
        [selectedKey]: [...existing, taskId],
      }
    })
  }

  const removeTask = (taskId: string) => {
    setPlans((prev) => {
      const existing = prev[selectedKey] ?? []
      const next = existing.filter((id) => id !== taskId)
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
            {t("childTaskPlanner.title")}
          </CardTitle>
          <div className="flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50 px-4 py-1 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
            <Flame className="h-4 w-4" />
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <span>
                {t("childTaskPlanner.streakLabel", { count: streak })}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t("childTaskPlanner.subtitle")}</p>
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("childTaskPlanner.selectedDate")}
            </p>
            <p className="text-base font-semibold capitalize">{selectedDateLabel}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full">
                {t("childTaskPlanner.taskCount", { count: plannedTasks.length })}
              </Badge>
              <span>•</span>
              <Badge className="rounded-full bg-primary/10 text-primary">
                {t("childTaskPlanner.pointsCount", { count: totalPoints })}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t("childTaskPlanner.dayPlan.title")}</h3>
                <p className="text-xs text-muted-foreground">{t("childTaskPlanner.dayPlan.subtitle")}</p>
              </div>
              <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                {plannedTasks.length
                  ? t("childTaskPlanner.status.inProgress")
                  : t("childTaskPlanner.status.free")}
              </Badge>
            </div>

            {plannedTasks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                {t("childTaskPlanner.emptyState")}
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
                        <p className="text-sm font-medium">{t(task.titleKey)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(task.categoryKey)} • {t(task.durationKey)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary">
                        {t("childTaskPlanner.pointsBadge", { count: task.points })}
                      </Badge>
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
              <h3 className="text-sm font-semibold">{t("childTaskPlanner.possibleTasks.title")}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("childTaskPlanner.possibleTasks.subtitle")}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TASK_DEFINITIONS.map((task) => {
                const alreadyPlanned = plannedTaskIds.includes(task.id)
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
                          <p className="text-sm font-semibold">{t(task.titleKey)}</p>
                          <p className="text-xs text-muted-foreground">{t(task.categoryKey)}</p>
                        </div>
                      </div>
                      <Badge className="rounded-full bg-secondary/80 text-secondary-foreground">
                        {t(task.durationKey)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("childTaskPlanner.pointsInline", { count: task.points })}
                      </span>
                      <Button
                        size="sm"
                        variant={alreadyPlanned ? "secondary" : "outline"}
                        className="h-8 gap-1"
                        onClick={() => addTask(task.id)}
                        disabled={alreadyPlanned}
                      >
                        <Plus className="h-3 w-3" />
                        {alreadyPlanned
                          ? t("childTaskPlanner.buttons.planned")
                          : t("childTaskPlanner.buttons.schedule")}
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
