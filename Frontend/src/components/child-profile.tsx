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
  familyCode?: string
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
  familyCode,
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
    <div className="space-y-5">

      {/* ═══ COMPACT PROFILE HEADER ═══ */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <button onClick={() => setShowPhotoDialog(true)} className="relative shrink-0 group">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary/40 transition-colors">
            {localAvatarImageUrl ? (
              <img src={localAvatarImageUrl} alt={t("childProfile.avatar")} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl select-none">{localAvatarSymbol}</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Camera className="h-3 w-3" />
          </div>
        </button>

        {/* Name + rank + XP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold truncate">{name}</h2>
            <span className="text-sm">{currentRank.emoji}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {statsLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                <span className="text-xs font-semibold text-muted-foreground">{rank}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs font-bold text-primary">Lvl {metrics.level}</span>
              </>
            )}
          </div>
          {/* XP bar */}
          {!statsLoading && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
                {metrics.xp}/{xpForLevel(metrics.level)}
              </span>
            </div>
          )}
        </div>

        {/* Rank ladder */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {rankLadder.map((r) => {
            const isActive = metrics.level >= r.threshold
            const isCurrent = r === currentRank
            return (
              <div
                key={r.key}
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg text-sm transition-all",
                  isCurrent ? "bg-primary/15 ring-1 ring-primary/30 scale-110" : isActive ? "bg-muted" : "bg-muted/30 opacity-40",
                )}
                title={t(r.key)}
              >
                {r.emoji}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ STAT PILLS (inline, compact) ═══ */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Star className="w-3.5 h-3.5" />, value: metrics.points, label: t("childProfile.stats.pointsBalance"), color: "text-amber-500" },
          { icon: <Flame className="w-3.5 h-3.5" />, value: `${metrics.streak}d`, label: t("childProfile.stats.currentStreak"), color: "text-orange-500" },
          { icon: <CheckCircle2 className="w-3.5 h-3.5" />, value: metrics.tasksCompleted, label: t("childProfile.stats.tasksCompleted"), color: "text-emerald-500" },
          { icon: <Sparkles className="w-3.5 h-3.5" />, value: metrics.xp, label: t("childProfile.stats.xpEarned"), color: "text-violet-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-3 text-center">
            <div className={cn("inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted mb-1.5", stat.color)}>
              {stat.icon}
            </div>
            <div className="text-base font-bold">
              {statsLoading ? <Skeleton className="h-5 w-10 mx-auto" /> : stat.value}
            </div>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ SUB-TAB NAVIGATION ═══ */}
      <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/30">
        {PROFILE_TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                active
                  ? "bg-background shadow-sm text-foreground"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: <Star className="w-4 h-4 text-amber-500" />, label: t("childProfile.stats.pointsBalance"), value: metrics.points },
            { icon: <Sparkles className="w-4 h-4 text-violet-500" />, label: t("childProfile.stats.xpEarned"), value: metrics.xp },
            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: t("childProfile.stats.tasksCompleted"), value: metrics.tasksCompleted },
            { icon: <Gift className="w-4 h-4 text-pink-500" />, label: t("childProfile.stats.pointsSpent"), value: metrics.totalPointsSpent },
            { icon: <Gift className="w-4 h-4 text-rose-400" />, label: t("childProfile.stats.purchasedRewards"), value: metrics.rewardsPurchased },
            { icon: <Crown className="w-4 h-4 text-primary" />, label: t("childProfile.stats.rank"), value: rank },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card p-3">
              <div className="shrink-0">{item.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                {statsLoading ? <Skeleton className="h-5 w-12 mt-0.5" /> : <p className="text-sm font-bold">{item.value}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Family code */}
        {familyCode && (
          <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-card px-4 py-3">
            <span className="text-xs text-muted-foreground">{t("childProfile.familyCode")}</span>
            <span className="text-sm font-bold font-mono">{familyCode}</span>
          </div>
        )}
      </div>

      {/* ═══ TAB: ACHIEVEMENTS ═══ */}
      <div className={cn(activeTab === "achievements" ? "block" : "hidden", "space-y-3")}>
        {!achievementsLoading && achievementsData && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("childProfile.achievements.title")}</p>
            <Badge variant="secondary" className="text-xs font-bold">{unlockedCount} / {achievementsData.length}</Badge>
          </div>
        )}

        {achievementsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`ach-skel-${i}`} className="rounded-xl bg-muted/30 p-4 space-y-2">
                <Skeleton className="w-10 h-10 rounded-lg mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {!achievementsLoading && achievementsError && (
          <p className="text-sm text-destructive text-center py-8">{t("childProfile.achievements.loadError")}</p>
        )}

        {!achievementsLoading && !achievementsError && achievementShowcase.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">🎯</p>
            <p className="text-sm text-muted-foreground">{t("childProfile.achievements.empty")}</p>
          </div>
        )}

        {!achievementsLoading && !achievementsError && achievementShowcase.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {achievementShowcase.map((ach) => {
              const Icon = getAchievementIcon(ach.icon)
              const isUnlocked = ach.unlocked
              const progress = ach.total > 0 ? (ach.progress / ach.total) * 100 : 0
              return (
                <div
                  key={ach.id}
                  className={cn(
                    "relative rounded-xl p-3.5 text-center transition-all border",
                    isUnlocked
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-card border-border/30",
                  )}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                  <div className={cn(
                    "mx-auto mb-2 w-10 h-10 rounded-lg flex items-center justify-center",
                    isUnlocked ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground",
                  )}>
                    {isUnlocked ? <Trophy className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <p className="text-xs font-bold mb-0.5 line-clamp-1">{ach.title}</p>
                  <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2 leading-tight">{ach.description}</p>
                  {isUnlocked ? (
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {t("childProfile.achievements.unlocked")}
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground font-semibold">{ach.progress} / {ach.total}</p>
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
      <div className={cn(activeTab === "appearance" ? "block" : "hidden", "space-y-3")}>
        {/* Theme toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              {theme === "dark" ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{t("childProfile.appearance.mode")}</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? t("childProfile.appearance.dark") : t("childProfile.appearance.light")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg gap-1.5 text-xs font-semibold"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? t("childProfile.appearance.light") : t("childProfile.appearance.dark")}
          </Button>
        </div>

        {/* Color theme */}
        <div className="rounded-xl border border-border/30 bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-primary">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("childProfile.appearance.colorTheme")}</p>
              <p className="text-xs text-muted-foreground">{t("childProfile.appearance.chooseColor")}</p>
            </div>
          </div>
          <Select value={colorTheme} onValueChange={(value: any) => setColorTheme(value)}>
            <SelectTrigger className="w-full rounded-lg border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((thm) => (
                <SelectItem key={thm.value} value={thm.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-4 w-4 rounded-full border border-border", thm.color)} />
                    <span className="text-sm">{thm.label}</span>
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
