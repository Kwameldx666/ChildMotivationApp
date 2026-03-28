"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { authApi } from "@/features/auth/api/authApi"
import {
  Award, Flame, Crown, Trophy, Star, Target,
  Moon, Sun, Palette, Camera, Upload, Sparkles,
  Gift, CheckCircle2,
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
import { cn } from "@/lib/utils"

interface ChildProfileProps {
  childId: string
  name: string
  avatarSymbol: string
  avatarImageUrl?: string | null
  stats?: ChildProgressStats | ChildStats
  statsLoading?: boolean
}

const achievementIconMap: Record<string, LucideIcon> = {
  star: Star,
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
    if (level >= rankLadder[index].threshold) return rankLadder[index]
  }
  return rankLadder[0]
}

const getAchievementIcon = (icon: string) => achievementIconMap[icon] ?? Trophy

const xpForLevel = (lvl: number) => lvl * 100
const xpProgress = (xp: number, level: number) => {
  const needed = xpForLevel(level)
  return needed > 0 ? Math.min((xp / needed) * 100, 100) : 0
}

/* ── Sub-tabs ── */
const PROFILE_TABS = [
  { id: "overview",     labelKey: "childProfile.tabs.overview",     Icon: Star },
  { id: "achievements", labelKey: "childProfile.tabs.achievements", Icon: Trophy },
  { id: "planner",      labelKey: "childProfile.tabs.planner",      Icon: Target },
  { id: "appearance",   labelKey: "childProfile.tabs.appearance",   Icon: Palette },
] as const

type ProfileTab = typeof PROFILE_TABS[number]["id"]

export default function ChildProfile({
  childId,
  name,
  avatarSymbol,
  avatarImageUrl,
  stats,
  statsLoading,
}: ChildProfileProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview")
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
    return [...achievementsData].sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
  }, [achievementsData])

  const unlockedCount = useMemo(() => {
    if (!achievementsData) return 0
    return achievementsData.filter((a) => a.unlocked).length
  }, [achievementsData])

  useEffect(() => {
    setLocalAvatarImageUrl(avatarImageUrl)
    setLocalAvatarSymbol(avatarSymbol)
  }, [avatarImageUrl, avatarSymbol])

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      setPhotoUploadLoading(true)
      const reader = new FileReader()
      reader.onload = () => {
        setLocalAvatarImageUrl(reader.result as string)
        setLocalAvatarSymbol("")
      }
      reader.readAsDataURL(file)
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
  }, [childId, avatarSymbol, name, t])

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
    <div className="space-y-5 animate-slide-up">

      {/* ═══ COMPACT PROFILE HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500/60 via-indigo-500 to-violet-500/60" />

        <div className="p-5">
          <div className="flex items-center gap-4">
          {/* Avatar */}
          <button onClick={() => setShowPhotoDialog(true)} className="relative shrink-0 group">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/15 group-hover:border-primary/30 transition-all shadow-md group-hover:scale-105">
              {localAvatarImageUrl ? (
                <img src={localAvatarImageUrl} alt={t("childProfile.avatar")} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl md:text-4xl select-none">{localAvatarSymbol}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Camera className="h-3 w-3" />
            </div>
          </button>

          {/* Name + rank + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black truncate">{name}</h2>
              <span className="text-lg">{currentRank.emoji}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {statsLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs font-black text-primary">Lvl {metrics.level}</span>
                </>
              )}
            </div>
            {/* XP bar — clean striped */}
            {!statsLoading && (
              <div className="flex items-center gap-2.5 mt-2.5">
                <span className="text-[10px] font-bold text-muted-foreground">XP</span>
                <div className="relative flex-1 h-3 rounded-full bg-gradient-to-r from-muted/90 via-muted to-muted/90 overflow-hidden shadow-inner ring-1 ring-inset ring-border/70">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0 14px, hsl(var(--border) / 0.35) 14px 15px)',
                    }}
                  />
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 via-amber-400 to-rose-500 transition-all duration-700 shadow-[0_0_14px_hsl(var(--primary)/0.28)]"
                    style={{ width: `${levelProgress}%` }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          'linear-gradient(180deg, hsl(var(--background) / 0.35) 0%, transparent 55%, hsl(var(--foreground) / 0.14) 100%)',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-background/70 bg-background/80 shadow-sm"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
                  {metrics.xp}/{xpForLevel(metrics.level)}
                </span>
              </div>
            )}
          </div>

          {/* Rank ladder */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {rankLadder.map((r) => {
              const isActive = metrics.level >= r.threshold
              const isCurrent = r === currentRank
              return (
                <div
                  key={r.key}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl text-base transition-all",
                    isCurrent
                      ? "bg-primary/15 ring-2 ring-primary/30 scale-110 shadow-md"
                      : isActive
                        ? "bg-muted/60"
                        : "bg-muted/20 opacity-30 grayscale",
                  )}
                  title={t(r.key)}
                >
                  {r.emoji}
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>

      {/* ═══ STAT PILLS ═══ */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { icon: <Star className="w-4 h-4" />, value: metrics.points, label: t("childProfile.stats.pointsBalance"), grad: "from-amber-400 to-yellow-500", emoji: "⭐" },
          { icon: <Flame className="w-4 h-4" />, value: `${metrics.streak}d`, label: t("childProfile.stats.currentStreak"), grad: "from-orange-400 to-red-500", emoji: "🔥" },
          { icon: <CheckCircle2 className="w-4 h-4" />, value: metrics.tasksCompleted, label: t("childProfile.stats.tasksCompleted"), grad: "from-emerald-400 to-teal-500", emoji: "✅" },
          { icon: <Sparkles className="w-4 h-4" />, value: metrics.xp, label: t("childProfile.stats.xpEarned"), grad: "from-violet-400 to-purple-500", emoji: "⚡" },
        ].map((stat, idx) => (
          <div key={stat.label} className="relative group rounded-2xl border bg-card shadow-sm p-3 text-center child-card-hover overflow-hidden animate-card-appear" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className={cn("mx-auto w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shadow-sm mb-2", stat.grad)}>
              {stat.icon}
            </div>
            <div className="text-lg font-bold tabular-nums">
              {statsLoading ? <Skeleton className="h-5 w-10 mx-auto" /> : stat.value}
            </div>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ SUB-TAB NAVIGATION ═══ */}
      <nav className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/30 border border-border/30">
        {PROFILE_TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 btn-bounce",
                active
                  ? "bg-background shadow-md text-foreground ring-1 ring-border/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <tab.Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </nav>

      {/* ═══ TAB: OVERVIEW ═══ */}
      <div className={cn(activeTab === "overview" ? "block" : "hidden", "space-y-4")}>
        {/* Detailed stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: <Star className="w-4 h-4 text-amber-500" />, label: t("childProfile.stats.pointsBalance"), value: metrics.points, emoji: "⭐" },
            { icon: <Sparkles className="w-4 h-4 text-violet-500" />, label: t("childProfile.stats.xpEarned"), value: metrics.xp, emoji: "⚡" },
            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: t("childProfile.stats.tasksCompleted"), value: metrics.tasksCompleted, emoji: "✅" },
            { icon: <Gift className="w-4 h-4 text-pink-500" />, label: t("childProfile.stats.pointsSpent"), value: metrics.totalPointsSpent, emoji: "🎁" },
            { icon: <Gift className="w-4 h-4 text-rose-400" />, label: t("childProfile.stats.purchasedRewards"), value: metrics.rewardsPurchased, emoji: "🛍️" },
            { icon: <Crown className="w-4 h-4 text-primary" />, label: t("childProfile.stats.rank"), value: rank, emoji: "👑" },
          ].map((item, idx) => (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border bg-card shadow-sm p-3.5 child-card-hover animate-card-appear" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="text-xl shrink-0">{item.emoji}</div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{item.label}</p>
                {statsLoading ? <Skeleton className="h-5 w-12 mt-0.5" /> : <p className="text-sm font-bold">{item.value}</p>}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ═══ TAB: ACHIEVEMENTS ═══ */}
      <div className={cn(activeTab === "achievements" ? "block" : "hidden", "space-y-4")}>
        {!achievementsLoading && achievementsData && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold flex items-center gap-2">🏆 {t("childProfile.achievements.title")}</p>
            <Badge variant="secondary" className="text-xs font-semibold rounded-full px-3">{unlockedCount} / {achievementsData.length}</Badge>
          </div>
        )}

        {achievementsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`ach-skel-${i}`} className="rounded-2xl bg-muted/20 p-5 space-y-3 animate-pulse">
                <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {!achievementsLoading && achievementsError && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">😿</div>
            <p className="text-sm text-destructive font-medium">{t("childProfile.achievements.loadError")}</p>
          </div>
        )}

        {!achievementsLoading && !achievementsError && achievementShowcase.length === 0 && (
          <div className="text-center py-14 space-y-3">
            <div className="text-5xl animate-kid-bounce">🎯</div>
            <p className="text-sm text-muted-foreground font-medium">{t("childProfile.achievements.empty")}</p>
          </div>
        )}

        {!achievementsLoading && !achievementsError && achievementShowcase.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievementShowcase.map((ach, idx) => {
              const Icon = getAchievementIcon(ach.icon)
              const isUnlocked = ach.unlocked
              const progress = ach.total > 0 ? (ach.progress / ach.total) * 100 : 0
              return (
                  <div
                  key={ach.id}
                  className={cn(
                    "relative rounded-2xl p-4 text-center transition-all border child-card-hover animate-card-appear overflow-hidden",
                    isUnlocked
                      ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/30 dark:border-amber-600/20 shadow-sm"
                      : "bg-card border-border",
                  )}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {isUnlocked && (
                    <>
                      <div className="absolute top-2 right-2 animate-badge-unlock">
                        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute top-1 left-2 text-xs animate-star-twinkle">✨</div>
                    </>
                  )}
                  <div className={cn(
                    "mx-auto mb-2.5 w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {isUnlocked ? <Trophy className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-bold mb-0.5 line-clamp-1">{ach.title}</p>
                  <p className="text-[10px] text-muted-foreground mb-2.5 line-clamp-2 leading-tight">{ach.description}</p>
                  {isUnlocked ? (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] font-bold rounded-full shadow-sm">
                      🏆 {t("childProfile.achievements.unlocked")}
                    </Badge>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden shadow-inner">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500/70 via-emerald-500/80 to-amber-400/80 transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground font-bold">{ach.progress} / {ach.total}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ TAB: PLANNER ═══ */}
      <div className={cn(activeTab === "planner" ? "block" : "hidden")}>
        <ChildTaskPlanner streak={metrics.streak} isLoading={statsLoading} />
      </div>

      {/* ═══ TAB: APPEARANCE ═══ */}
      <div className={cn(activeTab === "appearance" ? "block" : "hidden", "space-y-4")}>
        {/* Theme toggle */}
        <div className="flex items-center justify-between rounded-2xl border bg-card shadow-sm p-4 child-card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/30 flex items-center justify-center shadow-sm">
              {theme === "dark" ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold">{t("childProfile.appearance.mode")}</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "🌙 " : "☀️ "}
                {theme === "dark" ? t("childProfile.appearance.dark") : t("childProfile.appearance.light")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl gap-1.5 text-xs font-bold border-2 btn-bounce"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? t("childProfile.appearance.light") : t("childProfile.appearance.dark")}
          </Button>
        </div>

        {/* Color theme */}
        <div className="rounded-2xl border bg-card shadow-sm p-4 space-y-3 child-card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/30 flex items-center justify-center shadow-sm text-primary">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{t("childProfile.appearance.colorTheme")}</p>
              <p className="text-xs text-muted-foreground">🎨 {t("childProfile.appearance.chooseColor")}</p>
            </div>
          </div>
          <Select value={colorTheme} onValueChange={(value: any) => setColorTheme(value)}>
            <SelectTrigger className="w-full rounded-xl border border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {themes.map((thm) => (
                <SelectItem key={thm.value} value={thm.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-5 w-5 rounded-full border-2 border-border shadow-sm", thm.color)} />
                    <span className="text-sm font-medium">{thm.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══ PHOTO DIALOG ═══ */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="w-full max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Camera className="w-4 h-4 text-primary" />
              {t("childProfile.changePhoto")}
            </DialogTitle>
            <DialogDescription className="text-xs">{t("childProfile.photoDialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Emoji picker */}
            <div>
              <p className="text-xs font-semibold mb-2">{t("childProfile.chooseEmoji")}</p>
              <div className="grid grid-cols-7 gap-1.5">
                {["👦", "👧", "🧒", "👨‍🦱", "👩‍🦱", "🧑", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️", "👩‍⚕️", "🧑‍🍳", "🧑‍🌾", "🧑‍🎓"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handlePhotoEmoji(emoji)}
                    className="text-2xl p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div>
              <p className="text-xs font-semibold mb-2">{t("childProfile.uploadPhotoFile")}</p>
              <label
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-foreground">{t("childProfile.uploadPrompt")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG — max 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={photoUploadLoading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) await handlePhotoUpload(file)
                  }}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowPhotoDialog(false)} disabled={photoUploadLoading} className="rounded-lg">
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
