"use client"

import { Trophy, Medal, Award, TrendingUp, Crown, Sparkles, Zap } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"

const PODIUM_THEMES = [
  { grad: "from-amber-400 to-yellow-500", bg: "bg-amber-500/8 dark:bg-amber-500/12", border: "border-amber-400/30", ring: "ring-amber-400/30", medal: "🥇", crown: true },
  { grad: "from-slate-300 to-slate-400", bg: "bg-slate-500/5 dark:bg-slate-500/10", border: "border-slate-300/30", ring: "ring-slate-300/30", medal: "🥈", crown: false },
  { grad: "from-amber-600 to-orange-700", bg: "bg-orange-500/5 dark:bg-orange-500/10", border: "border-orange-400/20", ring: "ring-orange-400/20", medal: "🥉", crown: false },
] as const

export default function Leaderboard() {
  const { t } = useTranslation()

  const MOCK_LEADERBOARD = [
    { name: t("leaderboard.mockName1"), avatar: "👧", xp: 2450, level: 8, trend: "+200" },
    { name: t("leaderboard.mockName2"), avatar: "👦", xp: 1980, level: 7, trend: "+150" },
    { name: t("leaderboard.mockName3"), avatar: "👶", xp: 1650, level: 6, trend: "+180" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black">{t("leaderboard.title")}</h2>
          <p className="text-xs text-muted-foreground">🏆 Top heroes</p>
        </div>
      </div>

      {/* Leaderboard cards */}
      <div className="space-y-3">
        {MOCK_LEADERBOARD.map((member, index) => {
          const theme = PODIUM_THEMES[index] ?? PODIUM_THEMES[2]
          const isFirst = index === 0
          return (
            <div
              key={index}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 p-4 transition-all child-card-hover animate-card-appear",
                theme.bg,
                theme.border,
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Crown for #1 */}
              {isFirst && (
                <div className="absolute top-1 right-3 text-lg animate-star-twinkle">👑</div>
              )}
              {/* Sparkles for #1 */}
              {isFirst && (
                <div className="absolute bottom-2 right-8 text-xs animate-star-twinkle" style={{ animationDelay: '0.8s' }}>✨</div>
              )}

              <div className="flex items-center gap-4">
                {/* Medal & Position */}
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-2xl",
                    isFirst && "animate-treasure-glow",
                  )}>
                    {theme.medal}
                  </div>
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shrink-0",
                  "bg-gradient-to-br from-white/60 to-white/20 dark:from-white/10 dark:to-white/5",
                  "border-2", theme.border,
                  "shadow-md group-hover:scale-110 transition-transform",
                )}>
                  {member.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-black truncate", isFirst && "text-amber-700 dark:text-amber-300")}>
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("leaderboard.level", { level: member.level })}
                  </p>
                </div>

                {/* XP & Trend */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center gap-1 justify-end">
                    <Zap className={cn("w-3.5 h-3.5", isFirst ? "text-amber-500" : "text-violet-500")} />
                    <span className={cn("text-base font-black tabular-nums", isFirst ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                      {member.xp.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold justify-end">
                    <TrendingUp className="w-3 h-3" />
                    <span>{member.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
