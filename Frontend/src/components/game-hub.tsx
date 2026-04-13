"use client"

import { useTranslation } from "@/i18n/provider"
import DailyMissions from "./daily-missions"
import Leaderboard from "./leaderboard"
import StickerCollection from "./sticker-collection"
import { Flame, Target, Zap, Swords } from "lucide-react"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { cn } from "@/lib/utils"

export default function GameHub() {
  const { t } = useTranslation()
  const { stats } = useChildProgressStats()
  const streak = stats?.streak ?? 0
  const multiplier = stats?.streakMultiplier ?? 1

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">{t("gameHub.title")}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("gameHub.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-muted/40 text-xs font-medium">
              <Flame className={cn("h-4 w-4 text-orange-500", streak >= 7 && "animate-streak-flame")} />
              <span>{t("gameHub.dayStreak")}: {streak}</span>
            </div>
            {multiplier > 1 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-muted/40 text-xs font-medium text-violet-600 dark:text-violet-300">
                <Zap className="h-4 w-4" />
                <span>×{multiplier.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <DailyMissions />
      <Leaderboard />
      <StickerCollection />
    </div>
  )
}
