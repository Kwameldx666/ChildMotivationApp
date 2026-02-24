"use client"

import { useTranslation } from "@/i18n/provider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAchievements } from "@/services/gamification-queries"
import { AchievementDto } from "@/services/gamification-service"
import { Crown, Flame, LucideIcon, Star, Target, Trophy, Zap, Sparkles, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const achievementIconMap: Record<string, LucideIcon> = {
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  crown: Crown,
  trophy: Trophy,
}

const CARD_THEMES = [
  { grad: "from-violet-400 to-purple-500", bg: "bg-violet-500/5 dark:bg-violet-500/10", ring: "ring-violet-300/40 dark:ring-violet-600/30", emoji: "💜" },
  { grad: "from-pink-400 to-rose-500", bg: "bg-pink-500/5 dark:bg-pink-500/10", ring: "ring-pink-300/40 dark:ring-pink-600/30", emoji: "🌸" },
  { grad: "from-amber-400 to-orange-500", bg: "bg-amber-500/5 dark:bg-amber-500/10", ring: "ring-amber-300/40 dark:ring-amber-600/30", emoji: "🌟" },
  { grad: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/5 dark:bg-emerald-500/10", ring: "ring-emerald-300/40 dark:ring-emerald-600/30", emoji: "🍀" },
  { grad: "from-sky-400 to-blue-500", bg: "bg-sky-500/5 dark:bg-sky-500/10", ring: "ring-sky-300/40 dark:ring-sky-600/30", emoji: "💎" },
  { grad: "from-orange-400 to-red-500", bg: "bg-orange-500/5 dark:bg-orange-500/10", ring: "ring-orange-300/40 dark:ring-orange-600/30", emoji: "🔥" },
] as const

const getAchievementIcon = (icon: string) => achievementIconMap[icon] ?? Trophy

const AchievementSkeleton = () => (
  <div className="rounded-3xl border border-border/20 bg-gradient-to-br from-muted/30 via-card to-muted/20 p-5 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-muted/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 bg-muted/50 rounded-lg" />
        <div className="h-3 w-1/2 bg-muted/40 rounded-lg" />
      </div>
    </div>
    <div className="h-3 w-full bg-muted/30 rounded-full" />
  </div>
)

export default function AchievementTree() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useAchievements()
  const achievements = data ?? []
  const unlockedCount = achievements.filter(a => a.unlocked).length

  const renderCard = (achievement: AchievementDto, index: number) => {
    const Icon = getAchievementIcon(achievement.icon)
    const progressPercent = achievement.total > 0 ? (achievement.progress / achievement.total) * 100 : 0
    const theme = CARD_THEMES[index % CARD_THEMES.length]
    const isUnlocked = achievement.unlocked

    return (
      <div
        key={achievement.id}
        className={cn(
          "group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 child-card-hover animate-card-appear",
          isUnlocked
            ? [theme.bg, "border-transparent shadow-lg", theme.ring, "ring-2"]
            : "bg-card/80 border-border/20 hover:border-border/40",
        )}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Sparkle overlay for unlocked */}
        {isUnlocked && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-2 right-3 text-lg animate-star-twinkle" style={{ animationDelay: '0.3s' }}>✨</div>
            <div className="absolute bottom-3 left-4 text-sm animate-star-twinkle" style={{ animationDelay: '1.2s' }}>⭐</div>
            <div className={cn("absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl", theme.grad)} />
          </div>
        )}

        {/* Locked overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
        )}

        <div className="relative p-5">
          {/* Header row */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
              isUnlocked
                ? ["bg-gradient-to-br text-white", theme.grad]
                : "bg-muted/60 text-muted-foreground",
            )}>
              <Icon className="w-7 h-7" />
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md animate-badge-unlock">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              )}
              {!isUnlocked && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-[15px] leading-snug line-clamp-2",
                isUnlocked ? "text-foreground" : "text-muted-foreground",
              )}>
                {achievement.title}
              </h3>
              {isUnlocked && (
                <Badge className="mt-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  🏆 {t("achievementTree.unlocked")}
                </Badge>
              )}
            </div>

            {/* XP reward */}
            <div className={cn(
              "shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1",
              isUnlocked
                ? "bg-violet-500/15 dark:bg-violet-500/20"
                : "bg-muted/40",
            )}>
              <Zap className={cn("h-3.5 w-3.5", isUnlocked ? "text-violet-500" : "text-muted-foreground/50")} />
              <span className={cn("text-xs font-bold", isUnlocked ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground/50")}>
                +{achievement.rewardXp}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className={cn(
            "text-[13px] leading-relaxed mb-4",
            isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60",
          )}>
            {achievement.description}
          </p>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                {achievement.progress} / {achievement.total}
              </span>
              <span className="font-bold tabular-nums">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-muted/40 overflow-hidden shadow-inner">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                  isUnlocked
                    ? ["bg-gradient-to-r", theme.grad, "progress-stripes"]
                    : "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500",
                )}
                style={{ width: `${progressPercent}%` }}
              />
              {isUnlocked && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px]">🎉</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Fun header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/8 via-orange-500/5 to-rose-500/8 dark:from-amber-500/12 dark:via-orange-500/8 dark:to-rose-500/12 border border-amber-500/15 p-5">
        <div className="absolute -top-4 -right-4 text-6xl opacity-[0.06] select-none pointer-events-none animate-hero-float">🏆</div>
        <div className="absolute bottom-2 right-12 text-3xl opacity-[0.08] select-none pointer-events-none animate-star-twinkle">⭐</div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black">{t("achievementTree.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("achievementTree.subtitle")}</p>
          </div>
          {achievements.length > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-400/20">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                {unlockedCount}/{achievements.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [0, 1, 2, 3, 4, 5].map((value) => <AchievementSkeleton key={`achievement-skeleton-${value}`} />)}
        {!isLoading && isError && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border-2 border-dashed border-destructive/20 p-8 text-center">
            <div className="text-4xl mb-3">😿</div>
            <p className="text-sm text-muted-foreground font-medium">
              {t("achievementTree.loadError")}
            </p>
          </div>
        )}
        {!isLoading && !isError && achievements.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border-2 border-dashed border-border/30 py-16 text-center">
            <div className="text-5xl mb-4 animate-kid-bounce">🎯</div>
            <h3 className="text-lg font-bold mb-1">{t("achievementTree.comingSoon")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Скоро здесь появятся крутые достижения!
            </p>
          </div>
        )}
        {!isLoading && !isError && achievements.map((ach, i) => renderCard(ach, i))}
      </div>
    </div>
  )
}
