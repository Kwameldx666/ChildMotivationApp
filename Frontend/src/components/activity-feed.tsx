"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Gift, Trophy, Star, Zap, MessageSquare } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

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

export default function ActivityFeed() {
  const { t } = useTranslation()

  const ACTIVITIES: Activity[] = [
    {
      id: 1,
      type: "task_completed",
      user: { name: t("activityFeed.sampleName.masha"), avatar: "👧" },
      message: t("activityFeed.message.completedTaskFemale"),
      detail: t("activityFeed.detail.cleanRoom"),
      time: t("activityFeed.time.5min"),
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      id: 2,
      type: "reward_created",
      user: { name: t("activityFeed.sampleName.papa"), avatar: "👨" },
      message: t("activityFeed.message.createdReward"),
      detail: t("activityFeed.detail.parkTrip"),
      time: t("activityFeed.time.15min"),
      icon: Gift,
      color: "text-secondary",
    },
    {
      id: 3,
      type: "level_up",
      user: { name: t("activityFeed.sampleName.kirill"), avatar: "👦" },
      message: t("activityFeed.message.gotLevel"),
      detail: t("activityFeed.detail.level5"),
      time: t("activityFeed.time.1hour"),
      icon: Zap,
      color: "text-accent",
    },
    {
      id: 4,
      type: "achievement",
      user: { name: t("activityFeed.sampleName.masha"), avatar: "👧" },
      message: t("activityFeed.message.unlockedAchievement"),
      detail: t("activityFeed.detail.fastRocket"),
      time: t("activityFeed.time.2hours"),
      icon: Trophy,
      color: "text-accent",
    },
    {
      id: 5,
      type: "task_completed",
      user: { name: t("activityFeed.sampleName.kirill"), avatar: "👦" },
      message: t("activityFeed.message.completedTaskMale"),
      detail: t("activityFeed.detail.washDishes"),
      time: t("activityFeed.time.3hours"),
      icon: CheckCircle2,
      color: "text-primary",
    },
    {
      id: 6,
      type: "comment",
      user: { name: t("activityFeed.sampleName.mama"), avatar: "👩" },
      message: t("activityFeed.message.leftComment"),
      detail: t("activityFeed.detail.greatThanks"),
      time: t("activityFeed.time.4hours"),
      icon: MessageSquare,
      color: "text-primary",
    },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          {t("activity.title")}
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
