"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Users, Plus } from "lucide-react"

const FAMILY_GOALS = [
  {
    id: 1,
    icon: Target,
    title: "Выполнить 50 задач в месяц",
    description: "Работайте вместе, чтобы достичь цели",
    progress: 32,
    total: 50,
    reward: "Семейный поход в кино",
    daysLeft: 8,
    difficulty: "Средняя",
  },
  {
    id: 2,
    icon: Trophy,
    title: "7 дней без просрочек",
    description: "Все задачи выполняются вовремя",
    progress: 4,
    total: 7,
    reward: "+500 XP каждому",
    daysLeft: 3,
    difficulty: "Сложная",
  },
  {
    id: 3,
    icon: Users,
    title: "Командные задания",
    description: "Выполнить 10 совместных заданий",
    progress: 6,
    total: 10,
    reward: "Пицца на выходных",
    daysLeft: 15,
    difficulty: "Средняя",
  },
]

export default function FamilyGoals() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Цели семьи</h2>
          <p className="text-sm text-muted-foreground">Работайте вместе для достижения общих целей</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Новая цель
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FAMILY_GOALS.map((goal) => {
          const Icon = goal.icon
          const progressPercent = (goal.progress / goal.total) * 100

          return (
            <Card key={goal.id} className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <span className="text-xs">{goal.daysLeft} дней</span>
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">{goal.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{goal.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {goal.progress} / {goal.total}
                    </span>
                    <span className="font-semibold">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Награда:</p>
                    <p className="text-sm font-semibold text-accent">{goal.reward}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Сложность:</p>
                    <p className="text-sm font-semibold">{goal.difficulty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
