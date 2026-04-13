"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lock, Star } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"
import { useAchievements } from "@/services/gamification-queries"

const STICKER_SERIES = {
  animals: [
    { id: 1, emoji: "🦁", name: "stickerCollection.lion", achievementIndex: 0 },
    { id: 2, emoji: "🐼", name: "stickerCollection.panda", achievementIndex: 1 },
    { id: 3, emoji: "🦊", name: "stickerCollection.fox", achievementIndex: 2 },
    { id: 4, emoji: "🐨", name: "stickerCollection.koala", achievementIndex: 3 },
    { id: 5, emoji: "🦉", name: "stickerCollection.owl", achievementIndex: 4 },
    { id: 6, emoji: "🐸", name: "stickerCollection.frog", achievementIndex: 5 },
  ],
  robots: [
    { id: 7, emoji: "🤖", name: "stickerCollection.robot", achievementIndex: 6 },
    { id: 8, emoji: "👾", name: "stickerCollection.alien", achievementIndex: 7 },
    { id: 9, emoji: "🚀", name: "stickerCollection.rocket", achievementIndex: 8 },
    { id: 10, emoji: "⚙️", name: "stickerCollection.mechanism", achievementIndex: 9 },
    { id: 11, emoji: "🔋", name: "stickerCollection.battery", achievementIndex: 10 },
    { id: 12, emoji: "💻", name: "stickerCollection.computer", achievementIndex: 11 },
  ],
  fantasy: [
    { id: 13, emoji: "🦄", name: "stickerCollection.unicorn", achievementIndex: 12 },
    { id: 14, emoji: "🐉", name: "stickerCollection.dragon", achievementIndex: 13 },
    { id: 15, emoji: "🧙", name: "stickerCollection.wizard", achievementIndex: 14 },
    { id: 16, emoji: "👑", name: "stickerCollection.crown", achievementIndex: 15 },
    { id: 17, emoji: "⚔️", name: "stickerCollection.sword", achievementIndex: 16 },
    { id: 18, emoji: "🏰", name: "stickerCollection.castle", achievementIndex: 17 },
  ],
}

const SERIES_KEYS = Object.keys(STICKER_SERIES) as Array<keyof typeof STICKER_SERIES>

type StickerViewModel = {
  id: number
  emoji: string
  name: string
  unlocked: boolean
  achievementTitle?: string
  progress: number
  total: number
}

const SERIES_THEMES = {
  animals: { emoji: "🐾", grad: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/6 dark:bg-emerald-500/10", border: "border-emerald-400/20" },
  robots: { emoji: "🤖", grad: "from-sky-400 to-blue-500", bg: "bg-sky-500/6 dark:bg-sky-500/10", border: "border-sky-400/20" },
  fantasy: { emoji: "🦄", grad: "from-violet-400 to-purple-500", bg: "bg-violet-500/6 dark:bg-violet-500/10", border: "border-violet-400/20" },
} as const

export default function StickerCollection() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<keyof typeof STICKER_SERIES>("animals")
  const { data: achievements = [] } = useAchievements()

  const stickerSeries = useMemo(() => {
    const mapped = {} as Record<keyof typeof STICKER_SERIES, StickerViewModel[]>

    SERIES_KEYS.forEach((seriesKey) => {
      mapped[seriesKey] = STICKER_SERIES[seriesKey].map((sticker) => {
        const achievement = achievements[sticker.achievementIndex]
        const total = Math.max(achievement?.total ?? 1, 1)
        const progress = Math.min(Math.max(achievement?.progress ?? 0, 0), total)

        return {
          id: sticker.id,
          emoji: sticker.emoji,
          name: sticker.name,
          unlocked: Boolean(achievement?.unlocked),
          achievementTitle: achievement?.title,
          progress,
          total,
        }
      })
    })

    return mapped
  }, [achievements])

  const calculateProgress = (series: StickerViewModel[]) => {
    const unlocked = series.filter((s) => s.unlocked).length
    return { unlocked, total: series.length, percent: Math.round((unlocked / series.length) * 100) }
  }

  const allTotal = SERIES_KEYS.flatMap((seriesKey) => stickerSeries[seriesKey])
  const totalUnlocked = allTotal.filter(s => s.unlocked).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black">{t("stickers.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("stickers.description")}</p>
            <p className="text-[11px] text-muted-foreground">{t("stickerCollection.rulesHint")}</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-pink-400 to-rose-500 text-white border-0 text-xs font-bold rounded-full px-3 py-1 shadow-sm gap-1">
          <Star className="w-3 h-3 fill-white" />
          {totalUnlocked}/{allTotal.length}
        </Badge>
      </div>

      {/* Series tabs — fun pill style */}
      <nav className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/30 border border-border/20">
        {SERIES_KEYS.map((key) => {
          const theme = SERIES_THEMES[key]
          const progress = calculateProgress(stickerSeries[key])
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all btn-bounce",
                active
                  ? "bg-background shadow-md text-foreground ring-1 ring-border/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <span className="text-base">{theme.emoji}</span>
              <span className="hidden sm:inline">
                {t(`stickers.${key}`)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                ({progress.unlocked}/{progress.total})
              </span>
            </button>
          )
        })}
      </nav>

      {/* Collection progress bar */}
      {(() => {
        const progress = calculateProgress(stickerSeries[activeTab])
        const theme = SERIES_THEMES[activeTab]
        return (
          <div className={cn("rounded-2xl border-2 p-4", theme.bg, theme.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">
                {t("stickerCollection.seriesPercent", { percent: progress.percent })}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {t("stickerCollection.outOf", { unlocked: progress.unlocked, total: progress.total })}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden shadow-inner ring-1 ring-inset ring-border/70">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700 progress-stripes", theme.grad)}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )
      })()}

      {/* Sticker grid — collectible card style */}
      <div className="grid grid-cols-3 gap-3">
        {stickerSeries[activeTab].map((sticker, idx) => {
          const theme = SERIES_THEMES[activeTab]
          return (
            <div
              key={sticker.id}
              className={cn(
                "group relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all child-card-hover animate-card-appear overflow-hidden",
                sticker.unlocked
                  ? [theme.bg, theme.border, "shadow-md"]
                  : "bg-muted/20 border-border/20 dark:bg-muted/10",
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Sparkle decoration for unlocked */}
              {sticker.unlocked && (
                <>
                  <div className="absolute top-1 right-2 text-xs animate-star-twinkle" style={{ animationDelay: `${idx * 0.3}s` }}>✨</div>
                  <div className={cn("absolute inset-0 opacity-[0.03] bg-gradient-to-br pointer-events-none", theme.grad)} />
                </>
              )}

              {sticker.unlocked ? (
                <>
                  <span className="text-4xl sm:text-5xl group-hover:scale-125 transition-transform duration-300 drop-shadow-sm">
                    {sticker.emoji}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-center leading-tight px-1 line-clamp-1">
                    {t(sticker.name)}
                  </span>
                  {sticker.achievementTitle && (
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight px-1 line-clamp-2">
                      {t("stickerCollection.unlockFor", { title: sticker.achievementTitle })}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/70 font-bold text-center px-1 line-clamp-2">
                    {sticker.achievementTitle
                      ? t("stickerCollection.unlockFor", { title: sticker.achievementTitle })
                      : t("stickerCollection.locked")}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 font-semibold text-center">
                    {t("stickerCollection.progress", { progress: sticker.progress, total: sticker.total })}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
