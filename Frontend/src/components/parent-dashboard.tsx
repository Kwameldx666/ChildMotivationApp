"use client"

/* cspell:disable */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, FileText, Settings, BarChart3, Gift, LogOut, User } from "lucide-react"
import TasksList from "@/components/tasks-list"
import RewardsShop from "@/components/rewards-shop"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import ChildrenManagement from "@/components/children-management"
import TaskTemplates from "@/components/task-templates"
import ParentSettings from "@/components/parent-settings"
import RewardCreationModal from "@/components/reward-creation-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ParentDashboardProps {
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
  userProfile,
  familyCode,
  familyName,
  familyEmblem,
  onLogout,
}: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const safeFamilyCode = familyCode ?? "—"

  const handleCreateReward = (reward: { title: string; description: string; cost: number; icon: string }) => {
    console.log("[v0] Reward created:", reward)
    setIsRewardModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-border">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">
                  {userProfile.avatar}
                </div>
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
              <DropdownMenuItem>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 h-auto p-1 bg-muted">
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
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Создать задачу
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
            <ChildrenManagement familyCode={safeFamilyCode} />
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
        </Tabs>
      </main>

      <RewardCreationModal
        open={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSubmit={handleCreateReward}
      />
    </div>
  )
}

/* cspell:enable */
