"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Star, Flame, CheckCircle2, Sparkles, Crown,
  Trophy, Gift, Target, TrendingUp,
} from "lucide-react"
import type { ChildStats } from "@/hooks/use-child-stats"
import { useAchievements } from "@/services/gamification-queries"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"

/* ── Types ── */

interface ChildProfileCardProps {
  childId: string
  name: string
  avatarSymbol: string
  avatarImageUrl?: string | null
  stats?: ChildStats
  statsLoading?: boolean
}

/* ── Rank system (same as child-profile) ── */

const rankLadder = [
  { threshold: 1,  key: "childProfile.rank.novice",  emoji: "🌱" },
  { threshold: 4,  key: "childProfile.rank.seeker",  emoji: "⚡" },
  { threshold: 7,  key: "childProfile.rank.master",  emoji: "🔥" },
  { threshold: 12, key: "childProfile.rank.legend",  emoji: "👑" },
]

const resolveRank = (level: number) => {
  for (let i = rankLadder.length - 1; i >= 0; i--) {
    if (level >= rankLadder[i].threshold) return rankLadder[i]
  }
  return rankLadder[0]
}

const xpForLevel = (lvl: number) => lvl * 100
const xpProgress = (xp: number, level: number) => {
  const needed = xpForLevel(level)
  return needed > 0 ? Math.min((xp / needed) * 100, 100) : 0
}

/* ── Component ── */

export default function ChildProfileCard({
  childId,
  name,
  avatarSymbol,
  avatarImageUrl,
  stats,
  statsLoading,
}: ChildProfileCardProps) {
  const { t } = useTranslation()
  const { data: achievementsData, isLoading: achievementsLoading } = useAchievements()

  const level  = stats?.level ?? 1
  const xp     = stats?.xp ?? 0
  const points = stats?.points ?? 0
  const streak = stats?.streak ?? 0
  const done   = stats?.tasksCompleted ?? 0
  const rank   = resolveRank(level)
  const rankName = t(rank.key)
  const progress = xpProgress(xp, level)

  const unlockedCount = useMemo(() => {
    if (!achievementsData) return 0
    return achievementsData.filter((a) => a.unlocked).length
  }, [achievementsData])

  const totalAchievements = achievementsData?.length ?? 0

  const completionRate = stats && "completionRate" in stats
    ? (stats as ChildStats).completionRate ?? 0
    : 0

  const pendingTasks = stats && "pendingTasks" in stats
    ? (stats as ChildStats).pendingTasks ?? 0
    : 0

  return (
    <div className="space-y-5">

      {/* ── Profile Header Card ── */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Subtle accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-primary/10 ring-offset-2 ring-offset-background shadow-md overflow-hidden">
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl select-none">{avatarSymbol}</span>
                )}
              </div>
            </div>

            {/* Name + Rank + Level */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-lg sm:text-xl font-bold truncate">{name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">{rank.emoji}</span>
                <span className="text-sm font-medium text-muted-foreground">{rankName}</span>
                <span className="text-muted-foreground/30">·</span>
                <Badge variant="secondary" className="text-xs font-semibold rounded-full px-2.5">
                  Lvl {level}
                </Badge>
              </div>

              {/* XP Progress */}
              {!statsLoading && (
                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">XP</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {xp}/{xpForLevel(level)}
                  </span>
                </div>
              )}
              {statsLoading && <Skeleton className="h-2 w-full mt-3 rounded-full" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCell
          icon={<Star className="h-4 w-4" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label={t("childProfile.stats.pointsBalance")}
          value={statsLoading ? null : points.toLocaleString()}
        />
        <StatCell
          icon={<Flame className="h-4 w-4" />}
          iconBg="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          label={t("childProfile.stats.currentStreak")}
          value={statsLoading ? null : `${streak}d`}
        />
        <StatCell
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label={t("childProfile.stats.tasksCompleted")}
          value={statsLoading ? null : done}
        />
        <StatCell
          icon={<Sparkles className="h-4 w-4" />}
          iconBg="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          label={t("childProfile.stats.xpEarned")}
          value={statsLoading ? null : xp}
        />
      </div>

      {/* ── Detailed Overview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Progress Card */}
        <div className="rounded-2xl border bg-card shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t("childProfile.stats.progressTitle")}</span>
          </div>
          <div className="space-y-2.5">
            <ProgressRow
              label={t("childProfile.stats.rank")}
              value={`${rankName} ${rank.emoji}`}
              loading={statsLoading}
            />
            <ProgressRow
              label={t("childProfile.stats.level")}
              value={`${level}`}
              loading={statsLoading}
            />
            {completionRate > 0 && (
              <ProgressRow
                label="Completion rate"
                value={`${Math.round(completionRate)}%`}
                loading={statsLoading}
              />
            )}
            {pendingTasks > 0 && (
              <ProgressRow
                label="Pending tasks"
                value={`${pendingTasks}`}
                loading={statsLoading}
              />
            )}
          </div>
        </div>

        {/* Rewards & Achievements Card */}
        <div className="rounded-2xl border bg-card shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">{t("childProfile.achievements.title")}</span>
          </div>
          <div className="space-y-2.5">
            <ProgressRow
              label={t("childProfile.achievements.unlocked")}
              value={achievementsLoading ? null : `${unlockedCount} / ${totalAchievements}`}
              loading={achievementsLoading}
            />
            <ProgressRow
              label={t("childProfile.stats.pointsSpent")}
              value={statsLoading ? null : `${stats?.totalPointsSpent ?? 0}`}
              loading={statsLoading}
            />
            <ProgressRow
              label={t("childProfile.stats.purchasedRewards")}
              value={statsLoading ? null : `${stats?.rewardsPurchased ?? 0}`}
              loading={statsLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Rank Ladder ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Rank Progression</span>
        </div>
        <div className="flex items-center gap-3">
          {rankLadder.map((r, i) => {
            const isActive = level >= r.threshold
            const isCurrent = r === resolveRank(level)
            return (
              <div key={r.key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all",
                    isCurrent
                      ? "bg-primary/15 ring-2 ring-primary/30 shadow-md scale-110"
                      : isActive
                        ? "bg-muted/60"
                        : "bg-muted/20 opacity-40 grayscale",
                  )}
                >
                  {r.emoji}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold text-center",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                )}>
                  {t(r.key)}
                </span>
                {i < rankLadder.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function StatCell({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string | number | null
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-3.5 sm:p-4">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", iconBg)}>
        {icon}
      </div>
      <div className="text-lg font-bold tabular-nums">
        {value === null ? <Skeleton className="h-5 w-12" /> : value}
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">
        {label}
      </p>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  loading,
}: {
  label: string
  value?: string | number | null
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {loading || value === null ? (
        <Skeleton className="h-4 w-12" />
      ) : (
        <span className="text-xs font-semibold">{value}</span>
      )}
    </div>
  )
}
