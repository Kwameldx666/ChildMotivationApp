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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{familyEmblem || "🏰"}</div>
              <div>
                <h1 className="text-2xl font-bold">{familyName || t("parentDashboard.familyNameFallback")}</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="outline" size="sm" />
            <ThemeToggle />
            <NotificationsPopover />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt={t("parentDashboard.profileAvatarAlt")} />}
                    <AvatarFallback>{avatarFallbackSymbol}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={event => {
                    event.preventDefault()
                    router.push("/profile")
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("parentDashboard.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("parentDashboard.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 h-auto p-1 bg-muted">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.tasks")}</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.rewards")}</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.children")}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.analytics")}</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.chat")}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">{t("parentDashboard.tabs.settings")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{t("parentDashboard.sections.tasks.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("parentDashboard.sections.tasks.subtitle")}</p>
              </div>
              <Button
                className="gap-2"
                onClick={() => setIsTaskModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                {t("parentDashboard.sections.tasks.newAction")}
              </Button>
            </div>
            <TasksList userType="parent" />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t("parentDashboard.sections.rewards.title")}</h2>
              <Button className="gap-2" onClick={() => setIsRewardModalOpen(true)}>
                <Plus className="w-4 h-4" />
                {t("parentDashboard.sections.rewards.newAction")}
              </Button>
            </div>
            <RewardsShop userType="parent" />
          </TabsContent>

          <TabsContent value="children" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{t("parentDashboard.sections.children.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("parentDashboard.sections.children.subtitle")}</p>
            </div>
            <ChildrenPageContent />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{t("parentDashboard.sections.analytics.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("parentDashboard.sections.analytics.subtitle")}</p>
            </div>
            <FeatureGate
              feature="advancedAnalytics"
              blurred
              onUpgrade={() => setActiveTab("settings")}
            >
              <AnalyticsDashboard />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{t("parentDashboard.sections.settings.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("parentDashboard.sections.settings.subtitle")}</p>
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
    </div>
  )
}

/* cspell:enable */
