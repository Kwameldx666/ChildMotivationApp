"use client"

import { useMemo, useState } from "react"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, LogOut, User,
  Flame, Star, Trophy, Target, Crown, Sparkles,
  Gift, Settings, Image, Zap, MessageCircle,
} from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { NotificationsPopover } from "@/components/notifications-popover"
import TasksList from "./tasks-list"
import RewardsShop from "./rewards-shop"
import ChildProfile from "./child-profile"
import GameHub from "./game-hub"
import EvidenceGallery from "./evidence-gallery"
import ChildChatHub from "./child-chat-hub"
import { useTasks } from "@/services/tasks-queries"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import GuidedTour, { useFirstVisitTour, type TourStep } from "@/components/guided-tour"
import ErrorBoundary from "@/components/error-boundary"
import { authApi } from "@/features/auth/api/authApi"
import { setSession } from "@/features/auth/store/authSlice"
import { useAppDispatch } from "@/store/hooks"

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
  onLogout: () => void
}

/* ═══════════ Game Tabs ═══════════ */

const TABS = [
  { id: "tasks",        labelKey: "childDashboard.nav.tasks",        Icon: CheckCircle2, emoji: "⚡", grad: "from-emerald-400 to-teal-500",  ring: "ring-emerald-400/40", glow: "shadow-emerald-500/25", dot: "bg-emerald-400", bgLight: "bg-emerald-500/10", textColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "gallery",      labelKey: "childDashboard.nav.gallery",      Icon: Image,        emoji: "📸", grad: "from-pink-400 to-rose-500",     ring: "ring-pink-400/40",    glow: "shadow-pink-500/25",    dot: "bg-pink-400",    bgLight: "bg-pink-500/10",    textColor: "text-pink-600 dark:text-pink-400"    },
  { id: "quests",       labelKey: "childDashboard.nav.quests",       Icon: Target,       emoji: "🎯", grad: "from-orange-400 to-red-500",    ring: "ring-orange-400/40",  glow: "shadow-orange-500/25",  dot: "bg-orange-400",  bgLight: "bg-orange-500/10",  textColor: "text-orange-600 dark:text-orange-400"  },
  { id: "shop",         labelKey: "childDashboard.nav.shop",         Icon: Gift,         emoji: "🎁", grad: "from-violet-400 to-purple-600", ring: "ring-violet-400/40",  glow: "shadow-violet-500/25",  dot: "bg-violet-400",  bgLight: "bg-violet-500/10",  textColor: "text-violet-600 dark:text-violet-400"  },
  { id: "chat",         labelKey: "childDashboard.nav.chat",         Icon: MessageCircle, emoji: "💬", grad: "from-cyan-400 to-blue-500",     ring: "ring-cyan-400/40",    glow: "shadow-cyan-500/25",    dot: "bg-cyan-400",    bgLight: "bg-cyan-500/10",    textColor: "text-cyan-600 dark:text-cyan-400"      },

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

/* ═══════════ Stat Card ═══════════ */
function StatCard({ icon, label, value, gradient, delay = 0, emoji }: {
  icon: React.ReactNode
  label: string
  value: string | number
  gradient: string
  delay?: number
  emoji?: string
}) {
  return (
    <div
      className="relative group flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border/20 bg-card/80 backdrop-blur-sm p-3 md:p-4 shadow-sm child-card-hover overflow-hidden animate-card-appear"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("absolute inset-0 opacity-[0.04] bg-gradient-to-br pointer-events-none", gradient)} />
      {emoji && (
        <div className="absolute -top-1 -right-1 text-lg opacity-[0.12] select-none pointer-events-none animate-star-twinkle" style={{ animationDelay: `${delay * 10}ms` }}>{emoji}</div>
      )}
      <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform", gradient)}>
        {icon}
      </div>
      <span className="text-lg md:text-xl font-black tabular-nums leading-none">{value}</span>
      <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

/* ═══════════ Component ═══════════ */

export default function ChildDashboard({ userId, userProfile, onLogout }: ChildDashboardProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
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
  const activeTasksCount = useMemo(
    () => tasks.filter((task) => !task.completed && !task.pendingApproval).length,
    [tasks],
  )
  const reviewQueueCount = useMemo(
    () => tasks.filter((task) => task.pendingApproval).length,
    [tasks],
  )

  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const { showTour, completeTour } = useFirstVisitTour("child-tour-seen")

  const tourSteps: TourStep[] = useMemo(() => [
    { target: null, titleKey: "tour.child.welcome.title", descriptionKey: "tour.child.welcome.desc", icon: "🌟" },
    { target: "[data-tour='child-stats']", titleKey: "tour.child.stats.title", descriptionKey: "tour.child.stats.desc", icon: "📊", placement: "bottom" },
    { target: "[data-tour='child-xp']", titleKey: "tour.child.xp.title", descriptionKey: "tour.child.xp.desc", icon: "⚡", placement: "bottom" },
    { target: "[data-tour='child-nav']", titleKey: "tour.child.nav.title", descriptionKey: "tour.child.nav.desc", icon: "🗂️", placement: "bottom", onBeforeStep: () => setActiveTab("tasks") },
    { target: "[data-tour='child-tasks']", titleKey: "tour.child.tasks.title", descriptionKey: "tour.child.tasks.desc", icon: "⚡", placement: "bottom", onBeforeStep: () => setActiveTab("tasks") },
    { target: "[data-tour='child-shop']", titleKey: "tour.child.shop.title", descriptionKey: "tour.child.shop.desc", icon: "🎁", placement: "bottom", onBeforeStep: () => setActiveTab("shop") },
    { target: "[data-tour='child-chat']", titleKey: "tour.child.chat.title", descriptionKey: "tour.child.chat.desc", icon: "💬", placement: "bottom" },
    { target: null, titleKey: "tour.child.done.title", descriptionKey: "tour.child.done.desc", icon: "🚀" },
  ], [t])

  const avatarImageUrl = useMemo(() => {
    const resolved = resolveAvatarUrl(userProfile.avatar)
    if (!resolved) return null
    if (resolved.startsWith("http") || resolved.startsWith("data:")) return resolved
    return null
  }, [userProfile.avatar])

  const avatarFallback = useMemo(() => {
    const v = userProfile.avatar?.trim()
    if (v && !avatarImageUrl) {
      const cleaned = v.replace(/[?\uFFFD]/g, "").trim()
      if (cleaned) {
        return Array.from(cleaned)[0] ?? cleaned
      }
    }
    return userProfile.name?.trim()?.charAt(0)?.toUpperCase() || "🙂"
  }, [avatarImageUrl, userProfile.avatar, userProfile.name])

  const activeTabContent = useMemo(() => {
    switch (activeTab) {
      case "tasks":
        return <TasksList userType="child" />
      case "gallery":
        return <EvidenceGallery tasks={tasks} userType="child" />
      case "quests":
        return <GameHub />
      case "shop":
        return <RewardsShop userType="child" childBalance={points} />
      case "chat":
        return <ChildChatHub />
      case "profile":
        return (
          <ChildProfile
            childId={userId}
            name={userProfile.name}
            avatarSymbol={avatarFallback}
            avatarImageUrl={avatarImageUrl}
            stats={stats}
            statsLoading={statsLoading}
          />
        )
      default:
        return <TasksList userType="child" />
    }
  }, [
    activeTab,
    tasks,
    points,
    userId,
    userProfile.name,
    avatarFallback,
    avatarImageUrl,
    stats,
    statsLoading,
  ])

  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden">

      {/* ===============================================
           CLEAN MINIMAL NAVBAR
         =============================================== */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo / Greeting */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-none mb-0.5">
                {t(getGreetingKey())}
              </p>
              <h2 className="text-sm sm:text-base font-black text-foreground leading-none">
                {userProfile.name}
              </h2>
            </div>
          </div>

          {/* Right Actions - Extremely Simplified */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Store Points - Big & Clear */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-muted/40 transition-colors border border-border cursor-default">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-amber-500" />
              <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                {statsLoading ? "..." : points.toLocaleString()}
              </span>
            </div>

            {/* Notifications */}
            <NotificationsPopover />

            {/* Pure Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors border border-border/40">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-border/40 shadow-xl" sideOffset={8}>
                {/* Language Switcher */}
                <div className="px-2 py-1.5">
                  <LanguageSwitcher gamified />
                </div>
                
                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium">{t("settings.theme", "")}</span>
                  <ThemeToggle />
                </div>
                
                <DropdownMenuSeparator className="bg-border/40 my-1" />

                <DropdownMenuItem 
                  onClick={() => setShowAvatarPicker(true)} 
                  className="rounded-xl px-3 py-2 cursor-pointer text-sm font-medium transition-colors focus:bg-primary/10"
                >
                  <User className="mr-2 h-4 w-4" /> 
                  {t("child.navigation.changeAvatar")}
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={onLogout} 
                  className="rounded-xl px-3 py-2 cursor-pointer text-sm font-medium text-destructive focus:bg-destructive/10 mt-1 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" /> 
                  {t("child.navigation.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* ====
             HERO SECTION avatar, stats, XP
           =============================================== */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 pt-3 pb-2">
        <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[220px,1fr] lg:items-center">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="mx-auto lg:mx-0 flex flex-col items-center gap-2"
              aria-label={t("child.navigation.changeAvatar")}
            >
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border shadow-sm">
                {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="" className="object-cover" />}
                <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-muted">{avatarFallback}</AvatarFallback>
              </Avatar>
              <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-semibold">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                LVL {level}
              </span>
            </button>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">{userProfile.name}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("childDashboard.heroMessage")}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium w-fit">
                  <span>{rank.emoji}</span>
                  <span>{t(`childProfile.rank.${rank.key}`)}</span>
                </div>
              </div>

              <div data-tour="child-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("gameHub.dayStreak")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums flex items-center gap-1.5">
                    <Flame className={cn("h-4 w-4 text-orange-500", streak >= 3 && "animate-streak-flame")} />
                    {streak}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-sky-500" />
                    {xp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className="rounded-xl border bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("childDashboard.nav.tasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{activeTasksCount}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className="rounded-xl border bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("tasks.pendingApproval")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{reviewQueueCount}</p>
                </button>
              </div>

              <div data-tour="child-xp" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("childDashboard.nextLevel")}</span>
                  <span className="tabular-nums">{xpIn}/100 XP</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${xpPct}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("shop")}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-muted/40 transition-colors"
                >
                  <Gift className="h-3.5 w-3.5 text-violet-500" />
                  {t("childDashboard.nav.shop")}: {points}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-muted/40 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-cyan-500" />
                  {t("childDashboard.nav.chat")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
           GAME NAVIGATION — desktop horizontal bar
         ═══════════════════════════════════════════════ */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-4">
        <nav data-tour="child-nav" className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                data-tour={`child-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <tab.Icon className="h-4.5 w-4.5" />
                <span>
                  {t(tab.labelKey)}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════
           CONTENT — full width
         ═══════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-10 pt-1">
        <section className="rounded-2xl border bg-card/70 p-3 sm:p-4 shadow-sm">
          <ErrorBoundary
            key={activeTab}
            fallback={
              <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">
                {t("common.error")}
              </div>
            }
          >
            {activeTabContent}
          </ErrorBoundary>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════
           MOBILE BOTTOM NAV — floating game bar
         ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-3 mb-3">
          <nav className={cn(
            "flex items-center justify-around h-[62px] rounded-2xl",
            "bg-card/95 backdrop-blur",
            "border border-border",
            "shadow-sm",
          )}>
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center h-full w-full"
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60",
                  )}>
                    <tab.Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-0.5 leading-none transition-colors",
                    active ? "text-foreground" : "text-muted-foreground/50",
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
      {/* ═══ AVATAR PICKER DIALOG — fun & playful ═══ */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
              {t("childDashboard.chooseAvatar")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {["👦", "👧", "🧒", "👨‍🦱", "👩‍🦱", "🧑", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️", "👩‍⚕️", "🧑‍🍳"].map((av) => (
              <button
                key={av}
                onClick={() => setShowAvatarPicker(false)}
                className="text-3xl p-2.5 rounded-2xl hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all border-2 border-transparent hover:border-primary/20 hover:shadow-lg child-card-hover"
              >
                {av}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">{t("childDashboard.uploadImage")}</label>
            <label className="flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer border-border hover:bg-primary/5 hover:border-primary/40 transition-all group">
              <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">📷</span>
              <span className="text-xs text-muted-foreground font-medium">{t("childProfile.uploadPrompt")}</span>
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG — max 5MB</span>
              <input
                type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const { authService } = await import("@/services/auth-service")
                    await authService.uploadAvatar(userId, file)
                    const refreshed = await authApi.getProfile(userId)
                    dispatch(setSession(refreshed))
                    setShowAvatarPicker(false)
                  } catch (err) {
                    console.error(err)
                    toast({
                      title: t("common.error"),
                      description: mapApiError(err, t("childDashboard.avatarUploadError")),
                      variant: "destructive",
                    })
                  }
                }}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl border-2 btn-bounce" onClick={() => setShowAvatarPicker(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showTour && <GuidedTour steps={tourSteps} storageKey="child-tour-seen" onComplete={completeTour} />}
    </div>
  )
}

