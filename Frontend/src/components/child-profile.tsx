"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { authApi } from "@/features/auth/api/authApi"
import {
  Award, Flame, Crown, Zap, Trophy, Star, Target,
  Moon, Sun, Palette, Camera, Upload, Sparkles,
  TrendingUp, Gift, CheckCircle2, Shield, ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAchievements } from "@/services/gamification-queries"
import type { AchievementDto } from "@/services/gamification-service"
import type { ChildProgressStats } from "@/hooks/use-child-progress-stats"
import type { ChildStats } from "@/hooks/use-child-stats"
import { useTheme } from "next-themes"
import { useColorTheme } from "@/hooks/use-color-theme"
import ChildTaskPlanner from "./child-task-planner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useTranslation } from "@/i18n/provider"

interface ChildProfileProps {
  childId: string
  name: string
  avatarSymbol: string
  avatarImageUrl?: string | null
  familyCode?: string
  stats?: ChildProgressStats | ChildStats
  statsLoading?: boolean
}

const achievementIconMap: Record<string, LucideIcon> = {
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  crown: Crown,
  trophy: Trophy,
}

const defaultStats: ChildProgressStats = {
  xp: 0,
  level: 1,
  points: 0,
  streak: 0,
  streakMultiplier: 1.0,
  tasksCompleted: 0,
  rewardsPurchased: 0,
  totalPointsSpent: 0,
  totalPointsEarned: 0,
  averagePointsPerTask: 0,
  rewardProgress: {
    instantReward: { pointsNeeded: 30, tasksNeeded: 3, description: "Стикеры" },
    mediumReward: { pointsNeeded: 120, daysNeeded: 8, description: "Игрушка" },
    bigReward: { pointsNeeded: 350, weeksNeeded: 4, description: "Большой подарок" },
  },
}

const rankLadder: Array<{ threshold: number; key: string; emoji: string }> = [
  { threshold: 1, key: "childProfile.rank.novice", emoji: "🌱" },
  { threshold: 4, key: "childProfile.rank.seeker", emoji: "⚡" },
  { threshold: 7, key: "childProfile.rank.master", emoji: "🔥" },
  { threshold: 12, key: "childProfile.rank.legend", emoji: "👑" },
]

const resolveRank = (level: number) => {
  for (let index = rankLadder.length - 1; index >= 0; index -= 1) {
    if (level >= rankLadder[index].threshold) {
      return rankLadder[index]
    }
  }
  return rankLadder[0]
}

const getAchievementIcon = (icon: string) => achievementIconMap[icon] ?? Trophy

/* XP progress to next level (simple formula) */
const xpForLevel = (lvl: number) => lvl * 100
const xpProgress = (xp: number, level: number) => {
  const needed = xpForLevel(level)
  return needed > 0 ? Math.min((xp / needed) * 100, 100) : 0
}

export default function ChildProfile({
  childId,
  name,
  avatarSymbol,
  avatarImageUrl,
  familyCode,
  stats,
  statsLoading,
}: ChildProfileProps) {
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false)
  const [localAvatarImageUrl, setLocalAvatarImageUrl] = useState<string | null | undefined>(avatarImageUrl)
  const [localAvatarSymbol, setLocalAvatarSymbol] = useState(avatarSymbol)
  const [dragActive, setDragActive] = useState(false)
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme, themes } = useColorTheme()
  const { t } = useTranslation()
  const { data: achievementsData, isLoading: achievementsLoading, isError: achievementsError } = useAchievements()
  const metrics = stats ?? defaultStats
  const currentRank = resolveRank(metrics.level)
  const rank = t(currentRank.key)
  const levelProgress = xpProgress(metrics.xp, metrics.level)

  const achievementShowcase = useMemo(() => {
    if (!achievementsData) return [] as AchievementDto[]
    return [...achievementsData]
      .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
      .slice(0, 6)
  }, [achievementsData])

  const unlockedCount = useMemo(() => {
    if (!achievementsData) return 0
    return achievementsData.filter((a) => a.unlocked).length
  }, [achievementsData])

  // Sync local avatar state with props when they change
  useEffect(() => {
    setLocalAvatarImageUrl(avatarImageUrl)
    setLocalAvatarSymbol(avatarSymbol)
  }, [avatarImageUrl, avatarSymbol])

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      setPhotoUploadLoading(true)

      // Convert file to Data URL for immediate preview
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setLocalAvatarImageUrl(dataUrl)
        setLocalAvatarSymbol("")
      }
      reader.readAsDataURL(file)

      // Upload to server
      const { authService } = await import("@/services/auth-service")
      await authService.uploadAvatar(childId, file)

      setShowPhotoDialog(false)
      setPhotoUploadLoading(false)
    } catch (err) {
      console.error("Photo upload error:", err)
      setPhotoUploadLoading(false)
      setLocalAvatarImageUrl(avatarImageUrl)
      setLocalAvatarSymbol(avatarSymbol)
      alert(t("childProfile.photoUploadError"))
    }
  }, [childId, avatarImageUrl, avatarSymbol, t])

  const handlePhotoEmoji = useCallback(async (emoji: string) => {
    try {
      setLocalAvatarSymbol(emoji)
      setLocalAvatarImageUrl(null)
      setShowPhotoDialog(false)
      setPhotoUploadLoading(true)

      await authApi.updateProfile(childId, { name, avatar: emoji })
      setPhotoUploadLoading(false)
    } catch (err) {
      console.error("Emoji change error:", err)
      setLocalAvatarSymbol(avatarSymbol)
      setPhotoUploadLoading(false)
      alert(t("childProfile.photoUploadError"))
    }
  }, [childId, avatarSymbol, t])

  /* Drag-and-drop handlers for photo dialog */
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(true) }, [])
  const onDragLeave = useCallback(() => setDragActive(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) handlePhotoUpload(file)
  }, [handlePhotoUpload])

  /* ─── RENDER ─── */
  return (
    <div className="space-y-6">

      {/* ════════════════════ HERO BANNER ════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 via-primary/80 to-fuchsia-600/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.12),transparent_60%)]" />
        {/* Decorative shapes */}
        <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute bottom-4 left-12 w-32 h-32 rounded-full bg-white/5 blur-3xl animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-yellow-400/15 blur-xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />

        {/* Floating sparkle particles */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {["✨", "⭐", "💫", "🌟"].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-lg opacity-20 animate-float-gentle select-none"
              style={{ left: `${15 + i * 20}%`, top: "-20px", animationDelay: `${i * 1.5}s`, animationDuration: `${4 + i}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="relative z-10 px-6 pt-10 pb-8 flex flex-col items-center gap-5">
          {/* Avatar with animated ring */}
          <div className="relative group">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-500 opacity-90" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-background flex items-center justify-center overflow-hidden ring-4 ring-white/20 shadow-2xl">
              {localAvatarImageUrl ? (
                <img src={localAvatarImageUrl} alt={t("childProfile.avatar")} className="h-full w-full object-cover" />
              ) : (
                <span className="text-7xl sm:text-8xl select-none">{localAvatarSymbol}</span>
              )}
            </div>
            <button
              onClick={() => setShowPhotoDialog(true)}
              className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-white text-violet-600 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          {/* Name + rank */}
          <div className="text-center space-y-1.5">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">{name}</h2>
            {statsLoading ? (
              <Skeleton className="h-6 w-36 mx-auto bg-white/20" />
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-sm font-semibold">
                <span>{currentRank.emoji}</span>
                <span>{rank}</span>
                <span className="text-white/50">•</span>
                <span className="text-yellow-300">Lvl {metrics.level}</span>
              </div>
            )}
          </div>

          {/* XP progress bar */}
          {!statsLoading && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-white/70 mb-1.5 font-medium">
                <span>{metrics.xp} XP</span>
                <span>{xpForLevel(metrics.level)} XP</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Family code */}
          {familyCode && (
            <p className="text-xs text-white/60 font-medium">
              {t("childProfile.familyCode")} <span className="text-white/90 font-bold">{familyCode}</span>
            </p>
          )}

          {/* Rank ladder preview */}
          <div className="flex items-center gap-1 mt-1">
            {rankLadder.map((r, i) => {
              const isActive = metrics.level >= r.threshold
              const isCurrent = r === currentRank
              return (
                <div
                  key={r.key}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all ${
                    isCurrent
                      ? "bg-white/30 ring-2 ring-yellow-400 scale-110 shadow-lg"
                      : isActive
                        ? "bg-white/20"
                        : "bg-white/5 opacity-50"
                  }`}
                  title={t(r.key)}
                >
                  {r.emoji}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════ QUICK STATS ROW ════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp className="w-5 h-5" />, value: metrics.level, label: t("childProfile.stats.level"), gradient: "from-blue-500 to-cyan-400", bg: "from-blue-500/15 to-cyan-400/5" },
          { icon: <Flame className="w-5 h-5" />, value: `${metrics.streak}d`, label: t("childProfile.stats.currentStreak"), gradient: "from-orange-500 to-red-400", bg: "from-orange-500/15 to-red-400/5" },
          { icon: <Star className="w-5 h-5" />, value: metrics.points, label: t("childProfile.stats.pointsBalance"), gradient: "from-amber-500 to-yellow-400", bg: "from-amber-500/15 to-yellow-400/5" },
          { icon: <Sparkles className="w-5 h-5" />, value: metrics.xp, label: t("childProfile.stats.xpEarned"), gradient: "from-violet-500 to-purple-400", bg: "from-violet-500/15 to-purple-400/5" },
        ].map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br ${stat.bg} p-4 hover:shadow-lg transition-all duration-300 group`}>
            <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-lg group-hover:opacity-40 transition-opacity`} />
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} text-white mb-2 shadow-md`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {statsLoading ? <Skeleton className="h-7 w-14" /> : stat.value}
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ════════════════════ DETAILED PROGRESS ════════════════════ */}
      <Card className="border-border/40 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <Zap className="w-4 h-4" />
            </div>
            {t("childProfile.stats.progressTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <Star className="w-4 h-4" />, label: t("childProfile.stats.pointsBalance"), value: metrics.points, color: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
              { icon: <Sparkles className="w-4 h-4" />, label: t("childProfile.stats.xpEarned"), value: metrics.xp, color: "text-violet-500", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
              { icon: <CheckCircle2 className="w-4 h-4" />, label: t("childProfile.stats.tasksCompleted"), value: metrics.tasksCompleted, color: "text-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
              { icon: <Gift className="w-4 h-4" />, label: t("childProfile.stats.pointsSpent"), value: metrics.totalPointsSpent, color: "text-pink-500", bg: "bg-pink-500/10", ring: "ring-pink-500/20" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.bg} ring-1 ${item.ring} text-center hover:shadow-sm transition-all`}>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${item.bg} ${item.color} mb-2`}>
                  {item.icon}
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-14 mx-auto mb-1" />
                ) : (
                  <div className={`text-xl font-extrabold ${item.color}`}>{item.value}</div>
                )}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Additional stats row */}
          {!statsLoading && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Gift className="w-4 h-4 text-pink-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("childProfile.stats.purchasedRewards")}</p>
                  <p className="text-sm font-bold">{metrics.rewardsPurchased}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Crown className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("childProfile.stats.rank")}</p>
                  <p className="text-sm font-bold">{rank}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{t("childProfile.achievements.title")}</p>
                  <p className="text-sm font-bold">{unlockedCount}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════ APPEARANCE ════════════════════ */}
      <Card className="border-border/40 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-fuchsia-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white">
              <Palette className="w-4 h-4" />
            </div>
            {t("childProfile.appearance.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {/* Theme toggle card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-500/8 to-slate-500/3 border border-border/30 hover:border-border/60 transition-all group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                theme === "dark" ? "bg-indigo-500/15 text-indigo-400" : "bg-amber-500/15 text-amber-500"
              }`}>
                {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold">{t("childProfile.appearance.mode")}</p>
                <p className="text-xs text-muted-foreground">{theme === "dark" ? t("childProfile.appearance.dark") : t("childProfile.appearance.light")}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl gap-2 font-semibold hover:bg-primary/10 hover:text-primary transition-all"
            >
              {theme === "dark" ? (
                <><Sun className="h-4 w-4" /> {t("childProfile.appearance.light")}</>
              ) : (
                <><Moon className="h-4 w-4" /> {t("childProfile.appearance.dark")}</>
              )}
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </Button>
          </div>

          {/* Color theme card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/8 to-purple-500/3 border border-border/30 hover:border-border/60 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-primary shadow-sm">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{t("childProfile.appearance.colorTheme")}</p>
                <p className="text-xs text-muted-foreground">{t("childProfile.appearance.chooseColor")}</p>
              </div>
            </div>
            <Select value={colorTheme} onValueChange={(value: any) => setColorTheme(value)}>
              <SelectTrigger className="w-full rounded-xl bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((thm) => (
                  <SelectItem key={thm.value} value={thm.value}>
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 border-border shadow-sm ${thm.color}`} />
                      <span className="font-medium">{thm.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════ TASK PLANNER ════════════════════ */}
      <ChildTaskPlanner streak={metrics.streak} isLoading={statsLoading} />

      {/* ════════════════════ ACHIEVEMENTS ════════════════════ */}
      <Card className="border-border/40 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-yellow-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-white">
              <Award className="w-4 h-4" />
            </div>
            {t("childProfile.achievements.title")}
            {!achievementsLoading && achievementsData && (
              <Badge variant="secondary" className="ml-auto text-xs font-bold">
                {unlockedCount} / {achievementsData.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {achievementsLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`ach-skel-${i}`} className="rounded-2xl bg-muted/30 p-4 space-y-3">
                  <Skeleton className="w-11 h-11 rounded-xl mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}

          {!achievementsLoading && achievementsError && (
            <p className="text-sm text-destructive text-center py-10">{t("childProfile.achievements.loadError")}</p>
          )}

          {!achievementsLoading && !achievementsError && achievementShowcase.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <div className="text-4xl">🎯</div>
              <p className="text-sm text-muted-foreground">{t("childProfile.achievements.empty")}</p>
            </div>
          )}

          {!achievementsLoading && !achievementsError && achievementShowcase.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievementShowcase.map((ach) => {
                const Icon = getAchievementIcon(ach.icon)
                const isUnlocked = ach.unlocked
                const progress = ach.total > 0 ? (ach.progress / ach.total) * 100 : 0
                return (
                  <div
                    key={ach.id}
                    className={`relative rounded-2xl p-4 text-center transition-all duration-300 hover:shadow-md group ${
                      isUnlocked
                        ? "bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/5 border border-yellow-500/25 shadow-sm"
                        : "bg-muted/30 border border-border/30"
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    <div className={`mx-auto mb-2.5 w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110 ${
                      isUnlocked
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/25"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isUnlocked ? <Trophy className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <p className="text-sm font-bold mb-1 line-clamp-1">{ach.title}</p>
                    <p className="text-[11px] text-muted-foreground mb-2.5 line-clamp-2 leading-tight">{ach.description}</p>
                    {isUnlocked ? (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold text-[10px] border-0 shadow-sm">
                        {t("childProfile.achievements.unlocked")}
                      </Badge>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">{ach.progress} / {ach.total}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════ PHOTO DIALOG ════════════════════ */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="w-full max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              {t("childProfile.changePhoto")}
            </DialogTitle>
            <DialogDescription>{t("childProfile.photoDialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Emoji picker with categories */}
            <div>
              <p className="text-sm font-bold mb-3">{t("childProfile.chooseEmoji")}</p>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {["👦", "👧", "🧒", "👨‍🦱", "👩‍🦱", "🧑", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️", "👩‍⚕️", "🧑‍🍳", "🧑‍🌾", "🧑‍🎓"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handlePhotoEmoji(emoji)}
                    className="text-3xl sm:text-4xl p-2 rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/30 hover:scale-110 active:scale-95 hover:shadow-md"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag-and-drop file upload */}
            <div>
              <p className="text-sm font-bold mb-3">{t("childProfile.uploadPhotoFile")}</p>
              <label
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border hover:bg-primary/5 hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{t("childProfile.uploadPrompt")}</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoUploadLoading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    await handlePhotoUpload(file)
                  }}
                />
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPhotoDialog(false)}
              disabled={photoUploadLoading}
              className="rounded-xl"
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
