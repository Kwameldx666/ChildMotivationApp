"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Trophy, TrendingUp, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { useFamilyMembers } from "@/services/family-queries"
import { getTaskAnalytics } from "@/services/analytics-service"

const PODIUM_THEMES = [
  { grad: "from-amber-400 to-yellow-500", bg: "bg-amber-500/8 dark:bg-amber-500/12", border: "border-amber-400/30", ring: "ring-amber-400/30", medal: "🥇", crown: true },
  { grad: "from-slate-300 to-slate-400", bg: "bg-slate-500/5 dark:bg-slate-500/10", border: "border-slate-300/30", ring: "ring-slate-300/30", medal: "🥈", crown: false },
  { grad: "from-amber-600 to-orange-700", bg: "bg-orange-500/5 dark:bg-orange-500/10", border: "border-orange-400/20", ring: "ring-orange-400/20", medal: "🥉", crown: false },
] as const

interface LeaderboardEntry {
  userId: string
  name: string
  avatar?: string | null
  points: number
  level: number
  tasksCompleted: number
  isCurrentUser: boolean
}

const normalizeUserId = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ""

const resolveAvatarSymbol = (avatar: string | null | undefined, name: string) => {
  const value = avatar?.trim()
  if (value && !value.startsWith("http") && !value.startsWith("data:") && !value.includes("/avatars/")) {
    const normalized = value.replace(/[?\uFFFD]/g, "").trim()
    if (normalized) {
      return Array.from(normalized)[0] ?? normalized
    }
  }

  const normalizedName = name.trim()
  if (!normalizedName) return "🙂"
  return normalizedName.charAt(0).toUpperCase()
}

export default function Leaderboard() {
  const { t } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const { stats } = useChildProgressStats()
  const { data: familyMembers = [] } = useFamilyMembers({ enabled: Boolean(session) })
  const { data: analyticsData } = useQuery({
    queryKey: ["task-analytics", "leaderboard", 30],
    queryFn: () => getTaskAnalytics(30),
    enabled: Boolean(session),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  const currentUserId = normalizeUserId(session?.user.id)

  const entries = useMemo<LeaderboardEntry[]>(() => {
    const familyById = new Map(
      familyMembers.map((member) => [normalizeUserId(member.id), member] as const),
    )

    const fromAnalytics = (analyticsData?.childrenStats ?? [])
      .map((child) => {
        const normalizedChildId = normalizeUserId(child.childId)
        const familyMember = familyById.get(normalizedChildId)
        const points = Math.max(child.totalPoints ?? 0, 0)

        return {
          userId: child.childId,
          name: child.childName || familyMember?.name || t("leaderboard.unknown"),
          avatar: familyMember?.avatar ?? null,
          points,
          level: Math.max(1, Math.floor(points / 500) + 1),
          tasksCompleted: Math.max(child.completedTasks ?? 0, 0),
          isCurrentUser: normalizedChildId === currentUserId,
        }
      })
      .filter((child) => child.userId)

    if (fromAnalytics.length > 0) {
      return fromAnalytics
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
    }

    if (!session) {
      return []
    }

    const fallbackPoints = Math.max(stats?.totalPointsEarned ?? stats?.points ?? 0, 0)
    return [
      {
        userId: session.user.id,
        name: session.user.name?.trim() || t("leaderboard.unknown"),
        avatar: session.profile.avatar,
        points: fallbackPoints,
        level: Math.max(1, stats?.level ?? 1),
        tasksCompleted: Math.max(stats?.tasksCompleted ?? 0, 0),
        isCurrentUser: true,
      },
    ]
  }, [analyticsData?.childrenStats, currentUserId, familyMembers, session, stats?.level, stats?.points, stats?.tasksCompleted, stats?.totalPointsEarned, t])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black">{t("leaderboard.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("leaderboard.subtitle")}</p>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
          {t("leaderboard.empty")}
        </div>
      )}

      {/* Leaderboard cards */}
      <div className="space-y-3">
        {entries.map((member, index) => {
          const theme = PODIUM_THEMES[index] ?? PODIUM_THEMES[2]
          const isFirst = index === 0
          const avatarUrl = resolveAvatarUrl(member.avatar)
          const avatarImage = avatarUrl && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("data:"))
          return (
            <div
              key={`${member.userId}-${index}`}
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
                <Avatar
                  className={cn(
                    "w-12 h-12 rounded-2xl shrink-0",
                    "border-2 shadow-md group-hover:scale-110 transition-transform",
                    theme.border,
                  )}
                >
                  {avatarImage ? <AvatarImage src={avatarUrl} alt={member.name} /> : null}
                  <AvatarFallback
                    className={cn(
                      "text-lg font-bold",
                      "bg-gradient-to-br from-white/60 to-white/20 dark:from-white/10 dark:to-white/5",
                    )}
                  >
                    {resolveAvatarSymbol(member.avatar, member.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-black truncate", isFirst && "text-amber-700 dark:text-amber-300")}>
                      {member.name}
                    </p>
                    {member.isCurrentUser && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                        {t("leaderboard.you")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("leaderboard.level", { level: member.level })}
                  </p>
                </div>

                {/* XP & Trend */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center gap-1 justify-end">
                    <Zap className={cn("w-3.5 h-3.5", isFirst ? "text-amber-500" : "text-violet-500")} />
                    <span className={cn("text-base font-black tabular-nums", isFirst ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                      {member.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold justify-end">
                    <TrendingUp className="w-3 h-3" />
                    <span>{t("leaderboard.tasks", { count: member.tasksCompleted })}</span>
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
