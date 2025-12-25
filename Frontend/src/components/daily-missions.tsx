"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Flame, Target, Zap } from "lucide-react"

interface Mission {
  id: string
  title: string
  description: string
  icon: any
  progress: number
  total: number
  reward: number
  completed: boolean
  recurring: "daily" | "weekly"
}

const DAILY_MISSIONS: Mission[] = [
  {
    id: "1",
    title: "Выполни 3 задания",
    description: "Выполни 3 любых задания до конца дня",
    icon: CheckCircle2,
    progress: 2,
    total: 3,
    reward: 50,
    completed: false,
    recurring: "daily",
  },
  {
    id: "2",
    title: "Заработай 20 очков",
    description: "Получи 20 очков за выполнение задач",
    icon: Zap,
    progress: 15,
    total: 20,
    reward: 75,
    completed: false,
    recurring: "daily",
  },
  {
    id: "3",
    title: "登录 7 дней подряд",
    description: "Заходи в приложение каждый день",
    icon: Flame,
    progress: 5,
    total: 7,
    reward: 100,
    completed: false,
    recurring: "daily",
  },
  {
    id: "4",
    title: "Выполни сложное задание",
    description: "Выполни задание со сложностью 4+ звёзды",
    icon: Target,
    progress: 0,
    total: 1,
    reward: 60,
    completed: false,
    recurring: "daily",
  },
]

const WEEKLY_MISSIONS: Mission[] = [
  {
    id: "w1",
    title: "Выполни 20 заданий",
    description: "Выполни 20 заданий за неделю",
    icon: CheckCircle2,
    progress: 14,
    total: 20,
    reward: 250,
    completed: false,
    recurring: "weekly",
  },
  {
    id: "w2",
    title: "Получи 3 бейджа",
    description: "Разблокируй 3 достижения на этой неделе",
    icon: Target,
    progress: 1,
    total: 3,
    reward: 300,
    completed: false,
    recurring: "weekly",
  },
]

export default function DailyMissions() {
  const [selectedMissions, setSelectedMissions] = useState<Mission[]>(DAILY_MISSIONS)
  const [missionType, setMissionType] = useState<"daily" | "weekly">("daily")

  const handleMissionTypeChange = (type: "daily" | "weekly") => {
    setMissionType(type)
    setSelectedMissions(type === "daily" ? DAILY_MISSIONS : WEEKLY_MISSIONS)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Ежедневные миссии</h2>
          <p className="text-sm text-muted-foreground">Выполняй миссии для дополнительных наград</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={missionType === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => handleMissionTypeChange("daily")}
          >
            Дневные
          </Button>
          <Button
            variant={missionType === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => handleMissionTypeChange("weekly")}
          >
            Недельные
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedMissions.map((mission) => {
          const Icon = mission.icon
          const progressPercent = (mission.progress / mission.total) * 100

          return (
            <Card key={mission.id} className={mission.completed ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{mission.title}</h3>
                      {mission.completed && <Badge className="bg-accent">Выполнено</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Прогресс: {mission.progress} / {mission.total}
                        </span>
                        <span className="font-semibold text-accent">+{mission.reward} XP</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>

                  {mission.completed && (
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-accent" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
