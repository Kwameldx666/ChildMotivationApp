"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Zap, Target, Crown, Flame } from "lucide-react"

const ACHIEVEMENTS = [
  {
    id: 1,
    icon: Star,
    title: "Юный помощник",
    description: "Выполнить 10 заданий",
    progress: 7,
    total: 10,
    unlocked: false,
    reward: "+100 XP",
  },
  {
    id: 2,
    icon: Zap,
    title: "Быстрая ракета",
    description: "Выполнить 3 задания за день",
    progress: 3,
    total: 3,
    unlocked: true,
    reward: "+50 XP",
  },
  {
    id: 3,
    icon: Flame,
    title: "Ни дня без дела!",
    description: "Streak 7 дней подряд",
    progress: 5,
    total: 7,
    unlocked: false,
    reward: "+200 XP",
  },
  {
    id: 4,
    icon: Target,
    title: "Точный стрелок",
    description: "Выполнить 5 сложных заданий",
    progress: 2,
    total: 5,
    unlocked: false,
    reward: "+150 XP",
  },
  {
    id: 5,
    icon: Crown,
    title: "Король недели",
    description: "Стать первым в рейтинге недели",
    progress: 0,
    total: 1,
    unlocked: false,
    reward: "+300 XP",
  },
  {
    id: 6,
    icon: Trophy,
    title: "Мастер задач",
    description: "Выполнить 50 заданий",
    progress: 23,
    total: 50,
    unlocked: false,
    reward: "+500 XP",
  },
]

export default function AchievementTree() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Дерево достижений</h2>
        <p className="text-sm text-muted-foreground">Выполняйте достижения и получайте награды</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((achievement) => {
          const Icon = achievement.icon
          const progressPercent = (achievement.progress / achievement.total) * 100

          return (
            <Card
              key={achievement.id}
              className={`relative overflow-hidden transition-all ${
                achievement.unlocked
                  ? "border-accent shadow-md shadow-accent/20"
                  : "hover:shadow-md hover:border-primary/50"
              }`}
            >
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
              )}

              <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  {achievement.unlocked && <Badge className="bg-accent text-accent-foreground">Разблокировано!</Badge>}
                </div>
                <CardTitle className="text-base mt-2">{achievement.title}</CardTitle>
              </CardHeader>

              <CardContent className="relative">
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {achievement.progress} / {achievement.total}
                    </span>
                    <span className="font-semibold text-primary">{achievement.reward}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
