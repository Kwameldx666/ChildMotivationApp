"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MissionDto, MissionRecurrence } from "@/services/gamification-service"
import { useMissions } from "@/services/gamification-queries"
import { CheckCircle2, Flame, LucideIcon, Target, Zap, Award } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

const missionIconMap: Record<string, LucideIcon> = {
  "check-circle-2": CheckCircle2,
  zap: Zap,
  flame: Flame,
  target: Target,
  award: Award,
}

const getMissionIcon = (icon: string) => missionIconMap[icon] ?? Target

const MissionSkeleton = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const EmptyState = ({ label }: { label: string }) => (
  <Card>
    <CardContent className="pt-6 text-center text-sm text-muted-foreground">
      {label}
    </CardContent>
  </Card>
)

export default function DailyMissions() {
  const { t } = useTranslation()
  const [missionType, setMissionType] = useState<MissionRecurrence>("daily")
  const { data, isLoading, isError } = useMissions(missionType)
  const missions = data ?? []
  const heading = missionType === "daily" ? t("dailyMissions.dailyHeading") : t("dailyMissions.weeklyHeading")

  const renderMissionCard = (mission: MissionDto) => {
    const Icon = getMissionIcon(mission.icon)
    const progressPercent = mission.total > 0 ? (mission.progress / mission.total) * 100 : 0

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
                {mission.completed && <Badge className="bg-accent">{t("dailyMissions.completed")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("dailyMissions.progress")}: {mission.progress} / {mission.total}
                  </span>
                  <span className="font-semibold text-accent">+{mission.rewardXp} XP</span>
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1">{heading}</h2>
          <p className="text-sm text-muted-foreground">{t("dailyMissions.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={missionType === "daily" ? "default" : "outline"} size="sm" onClick={() => setMissionType("daily")}>
            {t("dailyMissions.daily")}
          </Button>
          <Button variant={missionType === "weekly" ? "default" : "outline"} size="sm" onClick={() => setMissionType("weekly")}>
            {t("dailyMissions.weekly")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading && [0, 1, 2].map((value) => <MissionSkeleton key={`mission-skeleton-${value}`} />)}
        {!isLoading && isError && <EmptyState label={t("dailyMissions.loadError")} />}
        {!isLoading && !isError && missions.length === 0 && (
          <EmptyState label={t("dailyMissions.emptyState")} />
        )}
        {!isLoading && !isError && missions.map(renderMissionCard)}
      </div>
    </div>
  )
}
