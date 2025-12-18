"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Gift, Trophy, Star, Zap, MessageSquare } from "lucide-react"

interface Activity {
  id: number
  type: string
  user: { name: string; avatar: string }
  message: string
  detail: string
  time: string
  icon: any
  color: string
}

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: "task_completed",
    user: { name: "Маша", avatar: "👧" },
    message: "выполнила задачу",
    detail: "Убрать комнату",
    time: "5 минут назад",
    icon: CheckCircle2,
    color: "text-primary",
  },
  {
    id: 2,
    type: "reward_created",
    user: { name: "Папа", avatar: "👨" },
    message: "создал новую награду",
    detail: "Поход в парк развлечений",
    time: "15 минут назад",
    icon: Gift,
    color: "text-secondary",
  },
  {
    id: 3,
    type: "level_up",
    user: { name: "Кирилл", avatar: "👦" },
    message: "получил уровень",
    detail: "Уровень 5",
    time: "1 час назад",
    icon: Zap,
    color: "text-accent",
  },
  {
    id: 4,
    type: "achievement",
    user: { name: "Маша", avatar: "👧" },
    message: "разблокировала достижение",
    detail: "Быстрая ракета",
    time: "2 часа назад",
    icon: Trophy,
    color: "text-accent",
  },
  {
    id: 5,
    type: "task_completed",
    user: { name: "Кирилл", avatar: "👦" },
    message: "выполнил задачу",
    detail: "Помыть посуду",
    time: "3 часа назад",
    icon: CheckCircle2,
    color: "text-primary",
  },
  {
    id: 6,
    type: "comment",
    user: { name: "Мама", avatar: "👩" },
    message: "оставила комментарий",
    detail: "Отлично! Спасибо!",
    time: "4 часа назад",
    icon: MessageSquare,
    color: "text-primary",
  },
]

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Лента активности семьи
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ACTIVITIES.map((activity, index) => {
            const Icon = activity.icon

            return (
              <div
                key={activity.id}
                className={`flex items-start gap-3 pb-4 ${index !== ACTIVITIES.length - 1 ? "border-b" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-xl flex-shrink-0">
                  {activity.user.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{activity.user.name}</span>{" "}
                        <span className="text-muted-foreground">{activity.message}</span>
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {activity.detail}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
