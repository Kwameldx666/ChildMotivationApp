"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

// Генерируем 365 дней для конкретного года
const generateYearDays = (year: number): Date[] => {
  const days: Date[] = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
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
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  
  const yearDays = useMemo(() => generateYearDays(selectedYear), [selectedYear])
  
  // Создаем карту даты -> количество задач
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(day => {
      const dateStr = day.date.split('T')[0] // Берем только дату без времени
      const dayDate = new Date(dateStr)
      // Фильтруем данные только для выбранного года
      if (dayDate.getFullYear() === selectedYear) {
        map.set(dateStr, day.count)
      }
    })
    return map
  }, [data, selectedYear])

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
    const labels: { label: string; weekIndex: number; month: number }[] = []
    let lastMonth = -1
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d.getTime() !== 0)
      if (firstValidDay) {
        const month = firstValidDay.getMonth()
        // Добавляем метку только если месяц изменился
        if (month !== lastMonth) {
          labels.push({ 
            label: MONTHS[month], 
            weekIndex,
            month 
          })
          lastMonth = month
        }
      }
    })
    
    return labels
  }, [weeks])
  
  const totalTasks = useMemo(() => {
    return data
      .filter(day => new Date(day.date).getFullYear() === selectedYear)
      .reduce((sum, day) => sum + day.count, 0)
  }, [data, selectedYear])
  
  const activeDays = useMemo(() => {
    return data
      .filter(day => new Date(day.date).getFullYear() === selectedYear && day.count > 0)
      .length
  }, [data, selectedYear])

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

  // Форматирование даты для тултипа
  const formatTooltipDate = (date: Date): string => {
    const day = date.getDate()
    const month = MONTHS[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            <span>{title}</span>
            <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
              <span>{totalTasks} задач</span>
              <span>{activeDays} активных дней</span>
            </div>
          </CardTitle>
          
          {/* Переключатель годов */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(prev => prev + 1)}
              disabled={selectedYear >= currentYear}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Месяцы */}
            <div className="flex gap-[3px] mb-2 ml-8">
              {monthLabels.map(({ label, weekIndex }, idx) => {
                const nextWeekIndex = idx < monthLabels.length - 1 ? monthLabels[idx + 1].weekIndex : weeks.length
                const width = (nextWeekIndex - weekIndex) * 13 - 3
                
                return (
                  <div 
                    key={`${label}-${weekIndex}`}
                    className="text-xs text-muted-foreground"
                    style={{ 
                      width: `${width}px`,
                      minWidth: `${width}px`
                    }}
                  >
                    {label}
                  </div>
                )
              })}
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
                      const tooltipText = `${formatTooltipDate(day)}: ${count} ${count === 1 ? 'задача' : count > 1 && count < 5 ? 'задачи' : 'задач'}`
                      
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "w-[10px] h-[10px] rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer",
                            intensityClass
                          )}
                          title={tooltipText}
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
