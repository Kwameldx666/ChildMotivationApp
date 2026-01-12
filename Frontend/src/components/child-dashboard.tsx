"use client"

// cspell:disable

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, ShoppingBag, Award, LogOut, User, Zap, BookOpen, MessageSquare, IdCard, MessageCircle } from "lucide-react"
import TasksList from "./tasks-list"
import RewardsShop from "./rewards-shop"
import ChildProfile from "./child-profile"
import AchievementTree from "./achievement-tree"
import DailyMissions from "./daily-missions"
import StickerCollection from "./sticker-collection"
import FamilyChat from "./family-chat"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"
import { AppRouteId, routeRecord } from "@/routes/config"


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

export default function ChildDashboard({ userId, userProfile, familyCode, onLogout }: ChildDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tasks")
  const { stats, isLoading: statsLoading } = useChildProgressStats()
  const xp = stats.xp
  const level = stats.level
  const points = stats.points
  const streak = stats.streak
  const [hudCollapsed, setHudCollapsed] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // CHANGE: Added state management for modals and AI features
  const [showAIHelper, setShowAIHelper] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const handleScroll = (e: any) => {
    const scrollTop = e.target.scrollTop
    setScrolled(scrollTop > 50)
    setHudCollapsed(scrollTop > 200)
  }

  {/* cspell:disable */}
  // CHANGE: AI Helper function
  const handleAIHelper = () => {
    const suggestions = [
      "Чтобы выполнить эту задачу максимально эффективно, попробуй разбить её на три простых шага.",
      "Совет: сначала подготовь необходимые материалы, а потом приступай к выполнению.",
      "Не забудь сделать хорошую фотографию при хорошем освещении для проверки родителя!",
      "Эта задача намного легче, если делать её вместе с семьёй. Позови кого-нибудь помочь!",
    ]
    setAiMessage(suggestions[Math.floor(Math.random() * suggestions.length)])
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

  const renderInlineStat = (label: string, value: string, accentClass: string) => (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      {statsLoading ? <Skeleton className="h-5 w-12 mx-auto" /> : <p className={`font-bold text-lg ${accentClass}`}>{value}</p>}
    </div>
  )

  const renderCardStat = (label: string, value: string, accentClass: string) => (
    <Card className="bg-card border-border">
      <CardContent className="pt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          {statsLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : <p className={`text-3xl font-bold ${accentClass}`}>{value}</p>}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* CHANGE: Changed header from sticky to fixed so it scrolls naturally but stays visible at top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Привет, {userProfile.name}! 👋</h1>
              <p className="text-sm text-muted-foreground">Продолжай выполнять задачи и зарабатывай награды</p>
            </div>

            {/* CHANGE: Stats displayed in normal row instead of compacting on scroll */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30"
                onClick={() => router.push(routeRecord[AppRouteId.AiAssistant].path)}
              >
                <MessageSquare className="h-4 w-4" />
                AI чат
              </Button>
              {renderInlineStat("Уровень", String(level), "text-primary")}
              {renderInlineStat("Опыт", `${xp}`, "text-accent")}
              {renderInlineStat("Очки", `${points}`, "text-secondary")}
              {renderInlineStat("Серия", `🔥${streak}`, "text-orange-500")}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-8 w-8">
                    {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="Аватар профиля" />}
                    <AvatarFallback>{avatarFallbackSymbol}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile.age && `${userProfile.age} лет • `}Код семьи: {familyCode}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAvatarPicker(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Изменить аватар</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={event => {
                    event.preventDefault()
                    router.push("/profile")
                  }}
                >
                  <IdCard className="mr-2 h-4 w-4" />
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

          {/* CHANGE: Full HUD stats in grid below header, scrolls naturally */}
          <div className="grid grid-cols-4 gap-4">
            {renderCardStat("Уровень", String(level), "text-primary")}
            {renderCardStat("Опыт", `${xp}`, "text-accent")}
            {renderCardStat("Очки", `${points}`, "text-secondary")}
            {renderCardStat("Серия", `🔥 ${streak} дн.`, "text-orange-500")}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-96">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 mb-6 h-auto p-1 bg-muted">
            <TabsTrigger value="tasks" className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Задачи</span>
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Миссии</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Достижения</span>
            </TabsTrigger>
            <TabsTrigger value="stickers" className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Стикеры</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Магазин</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Чат</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Профиль</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Мои задачи</h2>
                <p className="text-sm text-muted-foreground mb-4">Выполняй задачи и получай опыт и очки</p>
              </div>
              {/* CHANGE: Added AI helper button */}
              <Button
                onClick={handleAIHelper}
                className="gap-2 bg-linear-to-r from-purple-500 to-pink-500 text-white"
              >
                <MessageSquare className="w-4 h-4" />
                ИИ помощник
              </Button>
            </div>
            <TasksList userType="child" />
          </TabsContent>

          <TabsContent value="missions" className="space-y-4">
            <DailyMissions />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <AchievementTree />
          </TabsContent>

          <TabsContent value="stickers" className="space-y-4">
            <StickerCollection />
          </TabsContent>

          <TabsContent value="shop" className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Магазин наград</h2>
              <p className="text-sm text-muted-foreground mb-4">Потрати свои очки на награды</p>
            </div>
            <RewardsShop userType="child" />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ChildProfile
              childId={userId}
              name={userProfile.name}
              avatarSymbol={avatarFallbackSymbol}
              avatarImageUrl={avatarImageUrl}
              familyCode={familyCode}
              stats={stats}
              statsLoading={statsLoading}
            />
          </TabsContent>
          <TabsContent value="chat" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Чат с семьёй</h2>
                <p className="text-sm text-muted-foreground">Общайся с родителями и упоминай задачи</p>
              </div>
            </div>
            <div className="max-w-4xl mx-auto">
              <FamilyChat 
                familyId={familyCode} 
                currentUserId={userId}
                currentUserName={userProfile.name}
                currentUserAvatar={userProfile.avatar}
                userRole="child"
              />
            </div>
          </TabsContent>        </Tabs>
      </main>

      {/* CHANGE: AI Helper Modal */}
      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ИИ Помощник</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-linear-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
              <p className="text-sm font-medium">{aiMessage || "Загружаю совет..."}</p>
            </div>
            <Button onClick={handleAIHelper} className="w-full">
              Получить ещё совет
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIHelper(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHANGE: Avatar Picker Modal */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выбери аватар</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4">
            {["👦", "👧", "🧒", "👨‍🦱", "👩‍🦱", "🧑", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️", "👩‍⚕️", "🧑‍🍳"].map((avatar) => (
              <button
                key={avatar}
                onClick={() => {
                  setShowAvatarPicker(false)
                }}
                className="text-4xl p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                {avatar}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Загрузить своё изображение</label>
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  // Try to get current user id from local cache
                  let userId: string | undefined
                  const raw = localStorage.getItem('familyapp_current_user')
                  if (raw) userId = JSON.parse(raw).id
                  if (!userId) {
                    alert('Не удалось определить пользователя. Пожалуйста, перезайдите.')
                    return
                  }

                  const { authService } = await import('@/services/auth-service')
                  await authService.uploadAvatar(userId, file)
                  // Simple UX: reload to pick up new avatar
                  window.location.reload()
                } catch (err) {
                  console.error(err)
                  alert('Ошибка при загрузке аватара')
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarPicker(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// cspell:enable
