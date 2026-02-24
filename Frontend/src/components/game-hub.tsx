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
      {/* Hero — fun game-style with more personality */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/6 to-yellow-500/10 dark:from-orange-500/15 dark:via-amber-500/10 dark:to-yellow-500/15 border-2 border-orange-500/15 p-6">
        {/* Fun decorative elements */}
        <div className="absolute -top-6 -right-6 text-7xl opacity-[0.06] select-none pointer-events-none animate-hero-float">🎮</div>
        <div className="absolute bottom-1 right-20 text-3xl opacity-[0.08] select-none pointer-events-none animate-star-twinkle">⚡</div>
        <div className="absolute top-3 right-32 text-2xl opacity-[0.06] select-none pointer-events-none animate-star-twinkle" style={{ animationDelay: '1s' }}>🌟</div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-xl shadow-orange-500/25 shrink-0 group-hover:scale-110 transition-transform">
            <Swords className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black">{t("gameHub.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("gameHub.subtitle")}</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-400/20 shadow-sm">
                <Flame className={cn("h-5 w-5 text-orange-500", streak >= 7 && "animate-streak-flame")} />
                <span className="text-base font-black text-orange-600 dark:text-orange-400">{streak}</span>
                <span className="text-[10px] font-bold text-orange-500/60 uppercase">days</span>
              </div>
              {multiplier > 1 && (
                <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-violet-500/10 border border-violet-400/20 shadow-sm animate-treasure-glow">
                  <Zap className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-black text-violet-600 dark:text-violet-400">×{multiplier}</span>
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
