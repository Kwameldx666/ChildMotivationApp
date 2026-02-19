"use client"

import { useMemo, useState } from "react"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, LogOut, User,
  Flame, Star, Trophy, Target, Crown, Sparkles,
  Gift, Settings, Image,
} from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { NotificationsPopover } from "@/components/notifications-popover"
import TasksList from "./tasks-list"
import RewardsShop from "./rewards-shop"
import ChildProfile from "./child-profile"
import AchievementTree from "./achievement-tree"
import GameHub from "./game-hub"
import EvidenceGallery from "./evidence-gallery"
import { useTasks } from "@/services/tasks-queries"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

/* ═══════════ Types ═══════════ */

interface ChildDashboardProps {
  userId: string
  userProfile: {
    name: string
    avatar: string
    age?: number
    role: "parent" | "child"
    xp?: number | null
    level?: number | null
    points?: number | null
    streakDays?: number | null
  }
  familyCode: string
  onLogout: () => void
}

/* ═══════════ Game Tabs ═══════════ */

const TABS = [
  { id: "tasks",        labelKey: "childDashboard.nav.tasks",        Icon: CheckCircle2, emoji: "⚡", grad: "from-emerald-400 to-teal-500",  ring: "ring-emerald-400/40", glow: "shadow-emerald-500/25", dot: "bg-emerald-400" },
  { id: "gallery",      labelKey: "childDashboard.nav.gallery",      Icon: Image,        emoji: "📸", grad: "from-pink-400 to-rose-500",     ring: "ring-pink-400/40",    glow: "shadow-pink-500/25",    dot: "bg-pink-400"    },
  { id: "quests",       labelKey: "childDashboard.nav.quests",       Icon: Target,       emoji: "🎯", grad: "from-orange-400 to-red-500",    ring: "ring-orange-400/40",  glow: "shadow-orange-500/25",  dot: "bg-orange-400"  },
  { id: "shop",         labelKey: "childDashboard.nav.shop",         Icon: Gift,         emoji: "🎁", grad: "from-violet-400 to-purple-600", ring: "ring-violet-400/40",  glow: "shadow-violet-500/25",  dot: "bg-violet-400"  },
  { id: "achievements", labelKey: "childDashboard.nav.achievements", Icon: Trophy,       emoji: "🏆", grad: "from-amber-400 to-yellow-500",  ring: "ring-amber-400/40",   glow: "shadow-amber-500/25",   dot: "bg-amber-400"   },
  { id: "profile",      labelKey: "childDashboard.nav.me",           Icon: User,         emoji: "😊", grad: "from-blue-400 to-indigo-500",   ring: "ring-blue-400/40",    glow: "shadow-blue-500/25",    dot: "bg-blue-400"    },
] as const

/* ═══════════ Helpers ═══════════ */

const getRank = (level: number) => {
  if (level >= 20) return { key: "legend", emoji: "👑", grad: "from-yellow-400 to-amber-500" }
  if (level >= 10) return { key: "master", emoji: "⚔️", grad: "from-violet-400 to-purple-500" }
  if (level >= 5)  return { key: "seeker", emoji: "🔍", grad: "from-blue-400 to-cyan-500" }
  return { key: "novice", emoji: "🌱", grad: "from-emerald-400 to-green-500" }
}

const getGreetingKey = () => {
  const h = new Date().getHours()
  if (h < 12) return "childDashboard.greetingMorning"
  if (h < 17) return "childDashboard.greetingAfternoon"
  return "childDashboard.greetingEvening"
}

/* ═══════════ Component ═══════════ */

export default function ChildDashboard({ userId, userProfile, familyCode, onLogout }: ChildDashboardProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("tasks")
  const { stats, isLoading: statsLoading } = useChildProgressStats()
  const { data: tasks = [] } = useTasks()

  const points  = stats?.points ?? 0
  const streak  = stats?.streak ?? 0
  const xp      = stats?.xp ?? 0
  const level   = stats?.level ?? 1
  const done    = stats?.tasksCompleted ?? 0
  const xpIn    = xp % 100
  const xpPct   = Math.min(100, xpIn)
  const rank    = getRank(level)

  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const avatarImageUrl = useMemo(() => {
    const resolved = resolveAvatarUrl(userProfile.avatar)
    if (!resolved) return null
    if (resolved.startsWith("http") || resolved.startsWith("data:")) return resolved
    return null
  }, [userProfile.avatar])

  const avatarFallback = useMemo(() => {
    const v = userProfile.avatar?.trim()
    if (v && !avatarImageUrl) return v
    return userProfile.name?.trim()?.charAt(0)?.toUpperCase() || "🙂"
  }, [avatarImageUrl, userProfile.avatar, userProfile.name])

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* ═══ GRADIENT MESH BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/[0.04] dark:bg-violet-500/[0.03] blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-pink-500/[0.04] dark:bg-pink-500/[0.03] blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-amber-500/[0.04] dark:bg-amber-500/[0.03] blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      {/* ═══════════════════════════════════════════════
           STATUS BAR — minimal, game HUD style
         ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/15">
        {/* Gradient accent stripe */}
        <div className={cn("h-1 bg-gradient-to-r", rank.grad)} />
        <div className="max-w-3xl mx-auto px-4 flex items-center h-12 gap-3">
          {/* Greeting + Level badge */}
          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
            <div className={cn(
              "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white",
              "bg-gradient-to-br", rank.grad,
            )}>
              {level}
            </div>
            <p className="text-sm font-bold truncate">
              {t(getGreetingKey())}, <span className="text-foreground">{userProfile.name}</span>
            </p>
          </div>

          {/* Points coin */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/20">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0">
              <Star className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {statsLoading ? "·" : points.toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-400/20">
              <Flame className={cn("h-4 w-4 text-orange-500", streak >= 3 && "animate-streak-flame")} />
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
            </div>
          )}

          {/* Settings gear */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
              <div className="flex items-center justify-center gap-1 py-1.5">
                <LanguageSwitcher variant="ghost" size="sm" />
                <ThemeToggle />
                <NotificationsPopover />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAvatarPicker(true)} className="rounded-xl text-sm">
                <User className="mr-2 h-4 w-4" /> {t("child.navigation.changeAvatar")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="rounded-xl text-sm text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> {t("child.navigation.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>


      {/* COMPACT HERO */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-4 pb-1">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="relative shrink-0 group"
            aria-label={t("child.navigation.changeAvatar")}
          >
            <Avatar className="h-14 w-14 ring-2 ring-primary/20 shadow-md group-hover:scale-105 transition-transform">
              {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="" />}
              <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/60 dark:to-pink-900/60 font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 z-10">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ring-2 ring-background",
                "bg-gradient-to-br", rank.grad,
              )}>
                {level}
              </div>
            </div>
          </button>

          {/* Name + Rank + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold truncate">{userProfile.name}</span>
              <span className="text-xs">{rank.emoji}</span>
              <span className={cn("text-[11px] font-bold bg-gradient-to-r bg-clip-text text-transparent", rank.grad)}>
                {t(`childProfile.rank.${rank.key}`)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-muted-foreground shrink-0">XP</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums shrink-0">{xpIn}/100</span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-0.5" />
              <span className="text-xs font-black leading-none">{done}</span>
            </div>
            <div className="flex flex-col items-center">
              <Sparkles className="h-4 w-4 text-violet-500 mb-0.5" />
              <span className="text-xs font-black leading-none">{xp}</span>
            </div>
          </div>
        </div>
      </div>
      {/* ═══════════════════════════════════════════════
           GAME NAVIGATION — desktop horizontal bar
         ═══════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-3xl mx-auto px-4 mt-4 mb-3">
        <nav className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/30 border border-border/20">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  active
                    ? ["bg-background shadow-lg", tab.glow, "scale-[1.02]"]
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {active ? (
                  <span className="text-lg animate-tab-pop">{tab.emoji}</span>
                ) : (
                  <tab.Icon className="h-4 w-4" />
                )}
                <span className={cn(active && "bg-gradient-to-r bg-clip-text text-transparent", active && tab.grad)}>
                  {t(tab.labelKey)}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════
           CONTENT
         ═══════════════════════════════════════════════ */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 pb-24 md:pb-8 pt-1">
        <div className={cn(activeTab === "tasks" ? "block" : "hidden")}><TasksList userType="child" /></div>
        <div className={cn(activeTab === "gallery" ? "block" : "hidden")}><EvidenceGallery tasks={tasks} userType="child" /></div>
        <div className={cn(activeTab === "quests" ? "block" : "hidden")}><GameHub /></div>
        <div className={cn(activeTab === "shop" ? "block" : "hidden")}><RewardsShop userType="child" /></div>
        <div className={cn(activeTab === "achievements" ? "block" : "hidden")}><AchievementTree /></div>
        <div className={cn(activeTab === "profile" ? "block" : "hidden")}>
          <ChildProfile
            childId={userId}
            name={userProfile.name}
            avatarSymbol={avatarFallback}
            avatarImageUrl={avatarImageUrl}
            familyCode={familyCode}
            stats={stats}
            statsLoading={statsLoading}
          />
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
           MOBILE BOTTOM NAV — floating game bar
         ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-4 mb-4">
          <nav className={cn(
            "flex items-center justify-around h-[60px] rounded-[20px]",
            "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl",
            "border border-white/40 dark:border-slate-700/30",
            "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          )}>
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center h-full w-full"
                >
                  {/* Active glow dot */}
                  {active && (
                    <div className={cn("absolute -top-1.5 w-1.5 h-1.5 rounded-full", tab.dot, "shadow-sm")} />
                  )}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
                    active
                      ? ["bg-gradient-to-br text-white shadow-lg", tab.grad, tab.glow, "scale-110"]
                      : "text-muted-foreground/50",
                  )}>
                    {active ? (
                      <span className="text-lg animate-tab-pop">{tab.emoji}</span>
                    ) : (
                      <tab.Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold mt-0.5 leading-none transition-colors",
                    active ? "text-foreground" : "text-muted-foreground/40",
                  )}>
                    {t(tab.labelKey)}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ═══ AVATAR PICKER DIALOG ═══ */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {t("childDashboard.chooseAvatar")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {["👦", "👧", "🧒", "👨‍🦱", "👩‍🦱", "🧑", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️", "👩‍⚕️", "🧑‍🍳"].map((av) => (
              <button
                key={av}
                onClick={() => setShowAvatarPicker(false)}
                className="text-3xl p-2.5 rounded-2xl hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all border border-transparent hover:border-primary/20 hover:shadow-lg"
              >
                {av}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">{t("childDashboard.uploadImage")}</label>
            <label className="flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer border-border hover:bg-primary/5 hover:border-primary/40 transition-all">
              <span className="text-2xl mb-1">📷</span>
              <span className="text-xs text-muted-foreground font-medium">{t("childProfile.uploadPrompt")}</span>
              <input
                type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    let uid: string | undefined
                    const raw = localStorage.getItem("familyapp_current_user")
                    if (raw) uid = JSON.parse(raw).id
                    if (!uid) { alert(t("childDashboard.userNotFound")); return }
                    const { authService } = await import("@/services/auth-service")
                    await authService.uploadAvatar(uid, file)
                    window.location.reload()
                  } catch (err) { console.error(err); alert(t("childDashboard.avatarUploadError")) }
                }}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowAvatarPicker(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
