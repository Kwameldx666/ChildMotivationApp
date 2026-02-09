"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Circle } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

export default function TaskCalendar() {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())

  const DAYS = [
    t("taskCalendar.mon"), t("taskCalendar.tue"), t("taskCalendar.wed"),
    t("taskCalendar.thu"), t("taskCalendar.fri"), t("taskCalendar.sat"), t("taskCalendar.sun")
  ]
  const MONTHS = [
    t("taskCalendar.january"), t("taskCalendar.february"), t("taskCalendar.march"),
    t("taskCalendar.april"), t("taskCalendar.may"), t("taskCalendar.june"),
    t("taskCalendar.july"), t("taskCalendar.august"), t("taskCalendar.september"),
    t("taskCalendar.october"), t("taskCalendar.november"), t("taskCalendar.december")
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDateKey = (day: number) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0")
    const dayStr = String(day).padStart(2, "0")
    return `${year}-${month}-${dayStr}`
  }

  const TASK_DATA: Record<string, { completed: number; pending: number; overdue: number }> = {
    "2024-01-15": { completed: 3, pending: 1, overdue: 0 },
    "2024-01-16": { completed: 2, pending: 2, overdue: 0 },
    "2024-01-17": { completed: 4, pending: 0, overdue: 0 },
    "2024-01-18": { completed: 1, pending: 2, overdue: 1 },
    "2024-01-19": { completed: 5, pending: 1, overdue: 0 },
    "2024-01-20": { completed: 0, pending: 3, overdue: 0 },
    "2024-01-21": { completed: 0, pending: 2, overdue: 1 },
  }

  const getStatusColor = (dateKey: string) => {
    const data = TASK_DATA[dateKey]
    if (!data) return "bg-muted/30"
    if (data.overdue > 0) return "bg-destructive"
    if (data.pending > 0) return "bg-accent"
    if (data.completed > 0) return "bg-primary"
    return "bg-muted/30"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("taskCalendar.title")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>{t("taskCalendar.completed")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>{t("taskCalendar.inProgress")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>{t("taskCalendar.overdue")}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = getDateKey(day)
              const data = TASK_DATA[dateKey]
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()

              return (
                <button
                  key={day}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                  {data && (
                    <div className="flex gap-0.5">
                      {data.completed > 0 && <Circle className="w-2 h-2 fill-primary text-primary" />}
                      {data.pending > 0 && <Circle className="w-2 h-2 fill-accent text-accent" />}
                      {data.overdue > 0 && <Circle className="w-2 h-2 fill-destructive text-destructive" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
