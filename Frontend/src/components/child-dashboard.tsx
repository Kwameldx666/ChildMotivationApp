"use client"

import { useMemo, useState } from "react"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, LogOut, User,
  Flame, Star, Trophy, Target, Crown, Sparkles,
  Gift, Settings, Image, Zap, MessageCircle, Bot,
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
  { id: "chat",         labelKey: "childDashboard.nav.chat",         Icon: Bot,          emoji: "🤖", grad: "from-cyan-400 to-blue-500",     ring: "ring-cyan-400/40",    glow: "shadow-cyan-500/25",    dot: "bg-cyan-400",    bgLight: "bg-cyan-500/10",    textColor: "text-cyan-600 dark:text-cyan-400"      },

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
  const { showTour, completeTour } = useFirstVisitTour("child-tour-seen")

  const tourSteps: TourStep[] = useMemo(() => [
    { target: null, titleKey: "tour.child.welcome.title", descriptionKey: "tour.child.welcome.desc", icon: "🌟" },
    { target: "[data-tour='child-stats']", titleKey: "tour.child.stats.title", descriptionKey: "tour.child.stats.desc", icon: "📊", placement: "bottom" },
    { target: "[data-tour='child-xp']", titleKey: "tour.child.xp.title", descriptionKey: "tour.child.xp.desc", icon: "⚡", placement: "bottom" },
    { target: "[data-tour='child-nav']", titleKey: "tour.child.nav.title", descriptionKey: "tour.child.nav.desc", icon: "🗂️", placement: "bottom", onBeforeStep: () => setActiveTab("tasks") },
    { target: "[data-tour='child-tasks']", titleKey: "tour.child.tasks.title", descriptionKey: "tour.child.tasks.desc", icon: "⚡", placement: "bottom", onBeforeStep: () => setActiveTab("tasks") },
    { target: "[data-tour='child-shop']", titleKey: "tour.child.shop.title", descriptionKey: "tour.child.shop.desc", icon: "🎁", placement: "bottom", onBeforeStep: () => setActiveTab("shop") },
    { target: "[data-tour='child-chat']", titleKey: "tour.child.chat.title", descriptionKey: "tour.child.chat.desc", icon: "🤖", placement: "bottom" },
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
    if (v && !avatarImageUrl) return v
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

      {/* ═══ GRADIENT MESH BACKGROUND — dreamy child-friendly atmosphere ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-500/[0.06] dark:bg-violet-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-pink-500/[0.06] dark:bg-pink-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/[0.05] dark:bg-amber-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />
        <div className="absolute top-2/3 right-1/3 w-[350px] h-[350px] rounded-full bg-emerald-500/[0.05] dark:bg-emerald-500/[0.02] blur-[120px] animate-pulse" style={{ animationDuration: "14s", animationDelay: "6s" }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-sky-500/[0.04] dark:bg-sky-500/[0.02] blur-[100px] animate-pulse" style={{ animationDuration: "16s", animationDelay: "3s" }} />
      </div>

      {/* ═══════════════════════════════════════════════
           TOP HEADER BAR — full-width
         ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/20">
        {/* Gradient accent stripe */}
        <div className={cn("h-1 w-full bg-gradient-to-r", rank.grad)} />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-3">
          {/* Greeting + Level badge */}
          <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
            <div className={cn(
              "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm",
              "bg-gradient-to-br", rank.grad,
            )}>
              {level}
            </div>
            <p className="text-sm md:text-base font-bold truncate">
              {t(getGreetingKey())}, <span className="text-foreground">{userProfile.name}</span>
            </p>
          </div>

          {/* Points coin */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0 shadow-sm">
              <Star className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {statsLoading ? "·" : points.toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/20">
              <Flame className={cn("h-4 w-4 text-orange-500", streak >= 3 && "animate-streak-flame")} />
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">{streak}</span>
            </div>
          )}

          {/* Notifications bell — always visible */}
          <NotificationsPopover />

          {/* Language flags — gamified, directly visible */}
          <LanguageSwitcher gamified />

          {/* Settings gear */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
              <div className="flex items-center justify-center gap-1 py-1.5">
                <ThemeToggle />
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


      {/* ===============================================
             HERO SECTION � avatar, stats, XP
           =============================================== */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card/80 via-card/50 to-background/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl p-6 sm:p-10">
          
          {/* Decorative blur orbs */}
          <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 lg:gap-12">
            
            {/* LEFT: AVATAR & LEVEL */}
            <div className="relative flex shrink-0 justify-center items-center">
              {/* Avatar trigger */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group peer"
                aria-label={t("child.navigation.changeAvatar")}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60" />
                <Avatar className="relative h-28 w-28 md:h-36 md:w-36 ring-8 ring-background/80 dark:ring-background/40 shadow-2xl group-hover:scale-105 transition-all duration-500">
                  {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="" className="object-cover" />}
                  <AvatarFallback className="text-5xl md:text-6xl bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 dark:from-violet-900/60 dark:via-pink-900/40 dark:to-amber-900/30 font-bold">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-3 -right-3 text-3xl md:text-4xl animate-star-twinkle opacity-90 drop-shadow-lg">?</div>
                
                {/* Level Circle */}
                <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div className={cn(
                    "h-7 px-4 md:h-9 md:px-5 rounded-full flex items-center justify-center text-xs md:text-sm font-black text-white ring-4 ring-background shadow-xl group-hover:scale-110 transition-transform duration-300",
                    "bg-gradient-to-r", rank.grad,
                  )}>
                    LVL {level}
                  </div>
                </div>
              </button>
            </div>

            {/* RIGHT: INFO & PROGRESS */}
            <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center items-center md:items-start">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
                  {userProfile.name}
                </h1>
                <div className={cn(
                  "inline-flex w-max mx-auto sm:mx-0 items-center gap-2 px-4 py-2 rounded-2xl bg-background/60 shadow-sm backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10"
                )}>
                  <span className="text-lg md:text-xl drop-shadow-sm">{rank.emoji}</span>
                  <span className={cn("text-sm md:text-base font-extrabold bg-gradient-to-r bg-clip-text text-transparent", rank.grad)}>
                    {t(`childProfile.rank.${rank.key}`)}
                  </span>
                </div>
              </div>
              
              {/* BEAUTIFUL STATS GRID: DAY STREAK & TOTAL XP */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 w-full max-w-xl">
                {/* DAY STREAK */}
                <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 p-3 sm:p-4 flex items-center gap-3 md:gap-4 shadow-sm backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Flame className={cn("h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-md", streak >= 3 && "animate-streak-flame")} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">{t("childDashboard.nav.streak", "���� ������")}</p>
                    <p className="text-xl sm:text-2xl font-black tabular-nums text-foreground leading-none mt-0.5">{streak}</p>
                  </div>
                </div>

                {/* TOTAL XP */}
                <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border border-sky-500/20 p-3 sm:p-4 flex items-center gap-3 md:gap-4 shadow-sm backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-md" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-600/70 dark:text-sky-400/70">��������� ����</p>
                    <p className="text-xl sm:text-2xl font-black tabular-nums text-foreground leading-none mt-0.5">{xp}</p>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR WITH TEXT */}
              <div data-tour="child-xp" className="w-full max-w-xl group">
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className="text-[10px] sm:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    {t("childProfile.xpTitle", "�������� ������")}
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {xpIn} <span className="text-muted-foreground/60">/ 100 XP</span>
                  </span>
                </div>
                <div className="relative flex-1 h-5 md:h-7 rounded-2xl bg-muted/80 overflow-hidden shadow-inner ring-1 ring-inset ring-border/60">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--foreground)) 10px, hsl(var(--foreground)) 20px)",
                    }}
                  />
                  <div
                    className="relative h-full rounded-2xl bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-400 transition-all duration-1000 animate-xp-fill shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                    style={{ width: `${xpPct}%` }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-40 mix-blend-overlay"
                      style={{
                        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute right-0 top-1/2 h-full w-4 md:w-6 -translate-y-1/2 bg-gradient-to-l from-white/70 to-transparent"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
           GAME NAVIGATION — desktop horizontal bar
         ═══════════════════════════════════════════════ */}
      <div className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-4">
        <nav data-tour="child-nav" className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 shadow-sm">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                data-tour={`child-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                  active
                    ? ["bg-background shadow-lg ring-1 ring-border/30", tab.glow, "scale-[1.02]"]
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                {active ? (
                  <span className="text-xl animate-tab-pop">{tab.emoji}</span>
                ) : (
                  <tab.Icon className="h-4.5 w-4.5" />
                )}
                <span className={cn(
                  "text-sm font-bold",
                  active && "bg-gradient-to-r bg-clip-text text-transparent",
                  active && tab.grad,
                )}>
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
      </main>

      {/* ═══════════════════════════════════════════════
           MOBILE BOTTOM NAV — floating game bar
         ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-3 mb-3">
          <nav className={cn(
            "flex items-center justify-around h-[64px] rounded-[22px]",
            "bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl",
            "border border-white/40 dark:border-slate-700/30",
            "shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]",
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
                    let uid: string | undefined
                    const raw = localStorage.getItem("familyapp_current_user")
                    if (raw) uid = JSON.parse(raw).id
                    if (!uid) { alert(t("childDashboard.userNotFound")); return }
                    const { authService } = await import("@/services/auth-service")
                    await authService.uploadAvatar(uid, file)
                    window.location.reload()
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
