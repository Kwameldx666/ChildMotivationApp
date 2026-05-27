"use client"

/* cspell:disable */

import { useEffect, useMemo, useState } from "react"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Settings, BarChart3, Gift, LogOut, User, MessageCircle, Users } from "lucide-react"
import { NotificationsPopover } from "@/components/notifications-popover"
import TasksList from "@/components/tasks-list"
import RewardsShop from "@/components/rewards-shop"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import ParentSettings from "@/components/parent-settings"
import RewardCreationModal from "@/components/reward-creation-modal"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import FamilyChat from "@/components/family-chat"
import ParentChatSelector from "@/components/parent-chat-selector"
import ChildrenPageContent from "@/components/children-page-content"
import { useCreateProduct } from "@/services/shop-queries"
import { useToast } from "@/hooks/use-toast"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/i18n/provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FeatureGate } from "@/components/feature-gate"
import GuidedTour, { useFirstVisitTour, type TourStep } from "@/components/guided-tour"

interface ParentDashboardProps {
  userId?: string
  userProfile: {
    name: string
    avatar: string
    role: "parent" | "child"
  }
  familyName?: string | null
  familyEmblem?: string | null
  onLogout: () => void
}

export default function ParentDashboard({
  userId,
  userProfile,
  familyName,
  familyEmblem,
  onLogout,
}: ParentDashboardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tasks")
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const createProduct = useCreateProduct()
  const { toast } = useToast()
  const { showTour, completeTour, resetTour } = useFirstVisitTour("parent-tour-seen")

  const tourSteps: TourStep[] = useMemo(() => [
    { target: null, titleKey: "tour.parent.welcome.title", descriptionKey: "tour.parent.welcome.desc", icon: "👋" },
    { target: "[data-tour='parent-tabs']", titleKey: "tour.parent.tabs.title", descriptionKey: "tour.parent.tabs.desc", icon: "🗂️", placement: "bottom" },
    { target: "[data-tour='parent-tasks']", titleKey: "tour.parent.tasks.title", descriptionKey: "tour.parent.tasks.desc", icon: "📋", placement: "bottom", onBeforeStep: () => setActiveTab("tasks") },
    { target: "[data-tour='parent-new-task']", titleKey: "tour.parent.newTask.title", descriptionKey: "tour.parent.newTask.desc", icon: "➕", placement: "bottom" },
    { target: "[data-tour='parent-rewards']", titleKey: "tour.parent.rewards.title", descriptionKey: "tour.parent.rewards.desc", icon: "🎁", placement: "bottom", onBeforeStep: () => setActiveTab("rewards") },
    { target: "[data-tour='parent-children']", titleKey: "tour.parent.children.title", descriptionKey: "tour.parent.children.desc", icon: "👨‍👩‍👧‍👦", placement: "bottom", onBeforeStep: () => setActiveTab("children") },
    { target: "[data-tour='parent-analytics']", titleKey: "tour.parent.analytics.title", descriptionKey: "tour.parent.analytics.desc", icon: "📊", placement: "bottom" },
    { target: "[data-tour='parent-chat']", titleKey: "tour.parent.chat.title", descriptionKey: "tour.parent.chat.desc", icon: "💬", placement: "bottom" },
    { target: "[data-tour='parent-notifications']", titleKey: "tour.parent.notifications.title", descriptionKey: "tour.parent.notifications.desc", icon: "🔔", placement: "bottom" },
    { target: null, titleKey: "tour.parent.done.title", descriptionKey: "tour.parent.done.desc", icon: "🚀" },
  ], [t])

  useEffect(() => {
    const cb = () => setIsTaskModalOpen(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-task-create', cb as EventListener)
      return () => window.removeEventListener('open-task-create', cb as EventListener)
    }
    return undefined
  }, [])

  const handleCreateReward = async (reward: {
    title: string
    description: string
    cost: number
    stock: number
  }) => {
    try {
      // Defensive: strip any "undefined" prefix that might leak from AI suggestions
      const cleanName = (reward.title ?? "").toString().replace(/^undefined\s*/i, "").trim()
      const cleanDesc = (reward.description ?? "").toString().replace(/^undefined\s*/i, "").trim()
      
      if (!cleanName) {
        toast({ title: t("parentDashboard.rewardAddErrorTitle"), description: "Name is required", variant: "destructive" })
        return
      }

      await createProduct.mutateAsync({
        name: cleanName,
        description: cleanDesc || null,
        price: reward.cost,
        stock: reward.stock,
        isActive: true,
      })

      toast({ title: t("parentDashboard.rewardAddedTitle"), description: t("parentDashboard.rewardAddedDescription") })
    } catch (error) {
      toast({
        title: t("parentDashboard.rewardAddErrorTitle"),
        description: mapApiError(error, t("parentDashboard.rewardAddErrorDescription")),
        variant: "destructive",
      })
      throw error
    }
  }

  const avatarImageUrl = useMemo(() => {
    const resolved = resolveAvatarUrl(userProfile.avatar)
    if (!resolved) return null
    if (resolved.startsWith('http://') || resolved.startsWith('https://') || resolved.startsWith('data:')) return resolved
    return null
  }, [userProfile.avatar])

  const avatarFallbackSymbol = useMemo(() => {
    const value = userProfile.avatar?.trim()
    if (value && !avatarImageUrl) {
      return value
    }

    const nameInitial = userProfile.name?.trim()?.charAt(0)?.toUpperCase()
    return nameInitial || "🙂"
  }, [avatarImageUrl, userProfile.avatar, userProfile.name])

  const NAV_TABS = [
    { value: "tasks",     icon: BarChart3,     emoji: "📋", from: "#8b5cf6", to: "#7c3aed", shadow: "rgba(139,92,246,0.4)",  tourId: "parent-tasks"     },
    { value: "rewards",   icon: Gift,           emoji: "🎁", from: "#ec4899", to: "#f43f5e", shadow: "rgba(236,72,153,0.4)",  tourId: "parent-rewards"   },
    { value: "children",  icon: Users,          emoji: "👨‍👩‍👧‍👦", from: "#10b981", to: "#14b8a6", shadow: "rgba(16,185,129,0.4)",  tourId: "parent-children"  },
    { value: "analytics", icon: BarChart3,      emoji: "📊", from: "#0ea5e9", to: "#2563eb", shadow: "rgba(14,165,233,0.4)",  tourId: "parent-analytics" },
    { value: "chat",      icon: MessageCircle,  emoji: "💬", from: "#06b6d4", to: "#6366f1", shadow: "rgba(99,102,241,0.4)",  tourId: "parent-chat"      },
    { value: "settings",  icon: Settings,       emoji: "⚙️", from: "#64748b", to: "#475569", shadow: "rgba(100,116,139,0.4)", tourId: ""                 },
  ] as const

  return (
    <div className="min-h-screen surface-page-parent">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b surface-app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Family brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
            >
              {familyEmblem || "🏰"}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">FamilyQuest</p>
              <h1 className="text-lg sm:text-xl font-extrabold truncate"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {familyName || t("parentDashboard.familyNameFallback")}
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="outline" size="sm" />
            <ThemeToggle />
            <span data-tour="parent-notifications"><NotificationsPopover /></span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all hover:shadow-md surface-action-btn">
                  <Avatar className="h-7 w-7">
                    {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt={t("parentDashboard.profileAvatarAlt")} />}
                    <AvatarFallback className="text-xs font-bold">{avatarFallbackSymbol}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-semibold text-gray-700">{userProfile.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-purple-100 shadow-xl p-1">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{userProfile.name}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl"
                  onSelect={e => { e.preventDefault(); router.push("/profile") }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("parentDashboard.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="rounded-xl text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("parentDashboard.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* ── PREMIUM TAB NAV ─────────────────────────────────── */}
          <div data-tour="parent-tabs" className="mb-6">
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl overflow-x-auto surface-tab-bar">
              {NAV_TABS.map(tab => {
                const active = activeTab === tab.value
                const Icon = tab.icon
                return (
                  <button key={tab.value}
                    data-tour={tab.tourId || undefined}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap min-w-[60px] ${active ? "" : "text-muted-foreground"}`}
                    style={active ? {
                      background: `linear-gradient(135deg,${tab.from},${tab.to})`,
                      color: "#fff",
                      boxShadow: `0 4px 12px -2px ${tab.shadow}`,
                    } : {}}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t(`parentDashboard.tabs.${tab.value}`)}</span>
                    <span className="sm:hidden">{tab.emoji}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── SECTION HEADERS ─────────────────────────────────── */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between mb-4 p-4 rounded-2xl surface-section-purple">
              <div>
                <h2 className="text-xl font-extrabold" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {t("parentDashboard.sections.tasks.title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{t("parentDashboard.sections.tasks.subtitle")}</p>
              </div>
              <button data-tour="parent-new-task"
                onClick={() => setIsTaskModalOpen(true)}
                className="auth-btn-shine flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", boxShadow: "0 4px 14px -2px rgba(99,102,241,0.5)" }}
              >
                <Plus className="w-4 h-4" />
                {t("parentDashboard.sections.tasks.newAction")}
              </button>
            </div>
            <TasksList userType="parent" />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="flex items-center justify-between mb-4 p-4 rounded-2xl surface-section-pink">
              <h2 className="text-xl font-extrabold" style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("parentDashboard.sections.rewards.title")}
              </h2>
              <button onClick={() => setIsRewardModalOpen(true)}
                className="auth-btn-shine flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)", boxShadow: "0 4px 14px -2px rgba(236,72,153,0.5)" }}
              >
                <Plus className="w-4 h-4" />
                {t("parentDashboard.sections.rewards.newAction")}
              </button>
            </div>
            <RewardsShop userType="parent" />
          </TabsContent>

          <TabsContent value="children" className="space-y-4">
            <div className="mb-4 p-4 rounded-2xl surface-section-green">
              <h2 className="text-xl font-extrabold mb-0.5" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("parentDashboard.sections.children.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("parentDashboard.sections.children.subtitle")}</p>
            </div>
            <ChildrenPageContent />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="mb-4 p-4 rounded-2xl surface-section-blue">
              <h2 className="text-xl font-extrabold mb-0.5" style={{ background: "linear-gradient(135deg,#0ea5e9,#2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("parentDashboard.sections.analytics.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("parentDashboard.sections.analytics.subtitle")}</p>
            </div>
            <FeatureGate feature="advancedAnalytics" blurred onUpgrade={() => setActiveTab("settings")}>
              <AnalyticsDashboard />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="mb-4 p-4 rounded-2xl surface-section-slate">
              <h2 className="text-xl font-extrabold mb-0.5" style={{ background: "linear-gradient(135deg,#64748b,#475569)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("parentDashboard.sections.settings.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("parentDashboard.sections.settings.subtitle")}</p>
            </div>
            <ParentSettings familyName={familyName} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {userId ? (
              <ParentChatSelector
                familyId={userId}
                currentUserId={userId}
                currentUserName={userProfile.name}
                currentUserAvatar={userProfile.avatar}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("parentDashboard.sections.chat.empty")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <RewardCreationModal
        open={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSubmit={handleCreateReward}
        isSubmitting={createProduct.isPending}
      />
      <CreateTaskDialog
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
      />

      {showTour && <GuidedTour steps={tourSteps} storageKey="parent-tour-seen" onComplete={completeTour} />}
    </div>
  )
}

/* cspell:enable */
