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
    <div className="space-y-6 animate-slide-up">
      {/* Hero — compact, game-style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/8 via-amber-500/5 to-yellow-500/3 dark:from-orange-500/12 dark:via-amber-500/8 dark:to-yellow-500/5 border border-orange-500/15 p-4">
        <div className="absolute -top-2 -right-2 text-5xl opacity-[0.06] select-none pointer-events-none">🎮</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black">{t("gameHub.title")}</h2>
            <p className="text-xs text-muted-foreground truncate">{t("gameHub.subtitle")}</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-400/20">
                <Flame className={cn("h-4 w-4 text-orange-500", streak >= 7 && "animate-streak-flame")} />
                <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
              </div>
              {multiplier > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 border border-violet-400/20">
                  <Zap className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400">×{multiplier}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DailyMissions />
      <Leaderboard />
      <StickerCollection />
    </div>
  )
}
