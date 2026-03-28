"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MissionDto, MissionRecurrence } from "@/services/gamification-service"
import { useMissions } from "@/services/gamification-queries"
import { CheckCircle2, Flame, LucideIcon, Target, Zap, Award, Sparkles } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"

const missionIconMap: Record<string, LucideIcon> = {
  "check-circle-2": CheckCircle2,
  zap: Zap,
  flame: Flame,
  target: Target,
  award: Award,
}

const MISSION_THEMES = [
  { grad: "from-violet-400 to-purple-500", bg: "bg-violet-500/5 dark:bg-violet-500/10", emoji: "💜" },
  { grad: "from-pink-400 to-rose-500", bg: "bg-pink-500/5 dark:bg-pink-500/10", emoji: "🌸" },
  { grad: "from-amber-400 to-orange-500", bg: "bg-amber-500/5 dark:bg-amber-500/10", emoji: "🌟" },
  { grad: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/5 dark:bg-emerald-500/10", emoji: "🍀" },
  { grad: "from-sky-400 to-blue-500", bg: "bg-sky-500/5 dark:bg-sky-500/10", emoji: "💎" },
  { grad: "from-orange-400 to-red-500", bg: "bg-orange-500/5 dark:bg-orange-500/10", emoji: "🔥" },
] as const

const getMissionIcon = (icon: string) => missionIconMap[icon] ?? Target

const MissionSkeleton = () => (
  <div className="rounded-2xl border-2 border-border/20 bg-card/80 p-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted/50" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-1/2 bg-muted/50 rounded-lg" />
        <div className="h-3 w-3/4 bg-muted/40 rounded-lg" />
        <div className="h-3 w-full bg-muted/30 rounded-full" />
      </div>
    </div>
  </div>
)

const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-3xl border-2 border-dashed border-border/30 py-14 text-center">
    <div className="text-5xl mb-4 animate-kid-bounce">🎯</div>
    <p className="text-sm text-muted-foreground font-medium">{label}</p>
  </div>
)

export default function DailyMissions() {
  const { t } = useTranslation()
  const [missionType, setMissionType] = useState<MissionRecurrence>("daily")
  const { data, isLoading, isError } = useMissions(missionType)
  const missions = data ?? []
  const heading = missionType === "daily" ? t("dailyMissions.dailyHeading") : t("dailyMissions.weeklyHeading")

  const renderMissionCard = (mission: MissionDto, index: number) => {
    const Icon = getMissionIcon(mission.icon)
    const progressPercent = mission.total > 0 ? (mission.progress / mission.total) * 100 : 0
    const theme = MISSION_THEMES[index % MISSION_THEMES.length]
    const isCompleted = mission.completed

    return (
      <div
        key={mission.id}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 p-4 transition-all child-card-hover animate-card-appear",
          isCompleted
            ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-400/30"
            : [theme.bg, "border-border/20 hover:border-border/40"],
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Sparkle for completed */}
        {isCompleted && (
          <div className="absolute top-2 right-3 text-sm animate-star-twinkle">✨</div>
        )}

        <div className="flex items-start gap-3.5">
          {/* Icon */}
          <div className={cn(
            "relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform group-hover:scale-110",
            isCompleted
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
              : ["bg-gradient-to-br text-white", theme.grad],
          )}>
            <Icon className="w-6 h-6" />
            {isCompleted && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md animate-badge-unlock">
                <CheckCircle2 className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("text-sm font-bold line-clamp-1", isCompleted && "text-emerald-700 dark:text-emerald-300")}>
                {mission.title}
              </h3>
              {isCompleted && (
                <Badge className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white border-0 text-[9px] font-bold rounded-full px-2 shadow-sm">
                  ✅ {t("dailyMissions.completed")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{mission.description}</p>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {mission.progress} / {mission.total}
                </span>
                <span className={cn(
                  "flex items-center gap-1 font-bold",
                  isCompleted ? "text-emerald-500" : "text-violet-500",
                )}>
                  <Zap className="w-3 h-3" />
                  +{mission.rewardXp} XP
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden shadow-inner ring-1 ring-inset ring-border/70">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400 progress-stripes"
                      : ["bg-gradient-to-r", theme.grad],
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header — fun game style */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black">{heading}</h2>
            <p className="text-xs text-muted-foreground">{t("dailyMissions.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/20">
          <button
            onClick={() => setMissionType("daily")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-bounce",
              missionType === "daily"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            ⚡ {t("dailyMissions.daily")}
          </button>
          <button
            onClick={() => setMissionType("weekly")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-bounce",
              missionType === "weekly"
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            🗓️ {t("dailyMissions.weekly")}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading && [0, 1, 2].map((value) => <MissionSkeleton key={`mission-skeleton-${value}`} />)}
        {!isLoading && isError && <EmptyState label={t("dailyMissions.loadError")} />}
        {!isLoading && !isError && missions.length === 0 && (
          <EmptyState label={t("dailyMissions.emptyState")} />
        )}
        {!isLoading && !isError && missions.map((m, i) => renderMissionCard(m, i))}
      </div>
    </div>
  )
}
