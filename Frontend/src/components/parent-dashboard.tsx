"use client"

/* cspell:disable */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, FileText, Settings, BarChart3, Gift, LogOut, User, Sparkles, MessageCircle } from "lucide-react"
import TasksList from "@/components/tasks-list"
import RewardsShop from "@/components/rewards-shop"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import ChildrenManagement from "@/components/children-management"
import TaskTemplates from "@/components/task-templates"
import ParentSettings from "@/components/parent-settings"
import RewardCreationModal from "@/components/reward-creation-modal"
import TaskCreationModal from "@/components/task-creation-modal"
import FamilyChat from "@/components/family-chat"
import ParentChatSelector from "@/components/parent-chat-selector"
import { useCreateTask } from "@/services/tasks-queries"
import { useCreateProduct } from "@/services/shop-queries"
import type { CreateTaskPayload } from "@/services/tasks-service"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppRouteId, routeRecord } from "@/routes/config"

interface ParentDashboardProps {
  userId?: string
  userProfile: {
    name: string
    avatar: string
    role: "parent" | "child"
  }
  familyCode: string | null
  familyName?: string | null
  familyEmblem?: string | null
  onLogout: () => void
}

export default function ParentDashboard({
  userId,
  userProfile,
  familyCode,
  familyName,
  familyEmblem,
  onLogout,
}: ParentDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tasks")
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const safeFamilyCode = familyCode ?? "—"
  const createTask = useCreateTask()
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

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      await createTask.mutateAsync(payload)
      toast({ title: "Задача создана", description: "Она появится в списке задач" })
    } catch (error) {
      toast({ title: "Не удалось создать задачу", description: "Попробуйте ещё раз", variant: "destructive" })
      throw error
    }
  }

  const handleCreateReward = async (reward: {
    title: string
    description: string
    cost: number
    icon: string
    stock: number
  }) => {
    try {
      await createProduct.mutateAsync({
        name: `${reward.icon} ${reward.title}`.trim(),
        description: reward.description ? `${reward.icon} ${reward.description}`.trim() : reward.description,
        price: reward.cost,
        stock: reward.stock,
        isActive: true,
      })

      toast({ title: "Товар добавлен", description: "Награда появится в магазине" })
    } catch (error) {
      toast({
        title: "Не удалось добавить товар",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз",
        variant: "destructive",
      })
      throw error
    }
  }

  const avatarImageUrl = useMemo(() => {
    const value = userProfile.avatar?.trim()
    if (!value) {
      return null
    }

    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null
    } catch {
      return null
    }
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
                <h1 className="text-2xl font-bold">{familyName || "Моя семья"}</h1>
                <p className="text-sm text-muted-foreground">Код семьи: {safeFamilyCode}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              className="hidden sm:inline-flex gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/40"
              onClick={() => router.push(routeRecord[AppRouteId.AiAssistant].path)}
            >
              <Sparkles className="h-4 w-4" />
              AI чат
            </Button>
            <Button
              size="icon"
              className="sm:hidden bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/40"
              onClick={() => router.push(routeRecord[AppRouteId.AiAssistant].path)}
              aria-label="AI чат"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="Аватар профиля" />}
                    <AvatarFallback>{avatarFallbackSymbol}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">Код семьи: {safeFamilyCode}</p>
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
                  <span>Профиль</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-6 h-auto p-1 bg-muted">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Задачи</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Награды</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Аналитика</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Дети</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Чат</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Шаблоны</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Настройки</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Управление задачами</h2>
                <p className="text-sm text-muted-foreground">Создавайте и отслеживайте задачи для детей</p>
              </div>
              <Button
                className="gap-2"
                onClick={() => router.push("/dashboard/tasks/new")}
              >
                <Plus className="w-4 h-4" />
                Перейти к созданию
              </Button>
            </div>
            <TasksList userType="parent" />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Магазин наград</h2>
                <p className="text-sm text-muted-foreground">Создавайте награды или используйте ИИ для генерации</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setIsRewardModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  ИИ генератор
                </Button>
                <Button className="gap-2" onClick={() => setIsRewardModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Новая награда
                </Button>
              </div>
            </div>
            <RewardsShop userType="parent" />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Аналитика</h2>
              <p className="text-sm text-muted-foreground mb-4">Подробная статистика активности семьи</p>
            </div>
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="children" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Управление детьми</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Добавляйте, редактируйте и управляйте профилями детей
              </p>
            </div>
            <ChildrenManagement familyCode={familyCode} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Шаблоны задач</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Используйте готовые шаблоны для быстрого создания задач
              </p>
            </div>
            <TaskTemplates />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Настройки</h2>
              <p className="text-sm text-muted-foreground mb-4">Управляйте параметрами семьи и приложения</p>
            </div>
            <ParentSettings familyName={familyName} familyCode={safeFamilyCode} />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {safeFamilyCode && safeFamilyCode !== "—" && userId ? (
              <ParentChatSelector
                familyId={safeFamilyCode}
                currentUserId={userId}
                currentUserName={userProfile.name}
                currentUserAvatar={userProfile.avatar}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Создайте семью для использования чата</p>
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
      <TaskCreationModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}

/* cspell:enable */
