"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ActivityDay {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  data?: ActivityDay[]
  isLoading?: boolean
  title?: string
}

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

// Генерируем последние 365 дней
const generateYearDays = (): Date[] => {
  const days: Date[] = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(date)
  }
  return days
}

// Получаем интенсивность цвета на основе количества выполненных задач
const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-muted/30 dark:bg-muted/20"
  if (count === 1) return "bg-green-200 dark:bg-green-900/40"
  if (count === 2) return "bg-green-300 dark:bg-green-800/60"
  if (count === 3) return "bg-green-400 dark:bg-green-700/80"
  return "bg-green-500 dark:bg-green-600"
}

export default function ActivityHeatmap({ data = [], isLoading = false, title = "Активность за год" }: ActivityHeatmapProps) {
  const yearDays = useMemo(() => generateYearDays(), [])
  
  // Создаем карту даты -> количество задач
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(day => {
      const dateStr = day.date.split('T')[0] // Берем только дату без времени
      map.set(dateStr, day.count)
    })
    return map
  }, [data])

  // Группируем дни по неделям
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let currentWeek: Date[] = []
    
    yearDays.forEach((day, index) => {
      if (currentWeek.length === 0 && day.getDay() !== 1) {
        // Заполняем пустыми днями до первого понедельника
        const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push(new Date(0)) // Пустой день
        }
      }
      
      currentWeek.push(day)
      
      if (currentWeek.length === 7 || index === yearDays.length - 1) {
        // Заполняем неделю до конца если нужно
        while (currentWeek.length < 7) {
          currentWeek.push(new Date(0))
        }
        result.push(currentWeek)
        currentWeek = []
      }
    })
    
    return result
  }, [yearDays])

  // Определяем какие месяцы показывать
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = []
    let currentMonth = -1
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find(d => d.getTime() !== 0)
      if (firstDay) {
        const month = firstDay.getMonth()
        if (month !== currentMonth && weekIndex % 4 === 0) {
          currentMonth = month
          labels.push({ label: MONTHS[month], weekIndex })
        }
      }
    })
    
    return labels
  }, [weeks])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const totalTasks = data.reduce((sum, day) => sum + day.count, 0)
  const activeDays = data.filter(day => day.count > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
            <span>{totalTasks} задач</span>
            <span>{activeDays} активных дней</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Месяцы */}
            <div className="flex gap-[3px] mb-2 ml-8">
              {monthLabels.map(({ label, weekIndex }) => (
                <div 
                  key={`${label}-${weekIndex}`}
                  className="text-xs text-muted-foreground"
                  style={{ 
                    marginLeft: weekIndex === 0 ? 0 : `${(weekIndex - (monthLabels.findIndex(m => m.weekIndex === weekIndex) === 0 ? 0 : monthLabels[monthLabels.findIndex(m => m.weekIndex === weekIndex) - 1].weekIndex + 1)) * 13}px` 
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1">
              {/* Дни недели */}
              <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-2">
                {DAYS.map((day, index) => (
                  <div key={day} className={cn("h-[10px] leading-[10px]", index % 2 === 1 && "opacity-0")}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Сетка активности */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => {
                      if (day.getTime() === 0) {
                        return <div key={dayIndex} className="w-[10px] h-[10px]" />
                      }
                      
                      const dateStr = day.toISOString().split('T')[0]
                      const count = activityMap.get(dateStr) || 0
                      const intensityClass = getIntensityClass(count)
                      
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "w-[10px] h-[10px] rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer",
                            intensityClass
                          )}
                          title={`${dateStr}: ${count} ${count === 1 ? 'задача' : count > 1 && count < 5 ? 'задачи' : 'задач'}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Легенда */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Меньше</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={cn("w-[10px] h-[10px] rounded-sm", getIntensityClass(level))}
                  />
                ))}
              </div>
              <span>Больше</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
