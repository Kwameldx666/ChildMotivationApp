"use client"

// cspell:disable

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, ShoppingBag, Award, LogOut, User, Zap, BookOpen, MessageSquare, IdCard } from "lucide-react"
import TasksList from "./tasks-list"
import RewardsShop from "./rewards-shop"
import ChildProfile from "./child-profile"
import AchievementTree from "./achievement-tree"
import DailyMissions from "./daily-missions"
import StickerCollection from "./sticker-collection"
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

interface ChildDashboardProps {
  userProfile: {
    name: string
    avatar: string
    age?: number
    role: "parent" | "child"
  }
  familyCode: string
  onLogout: () => void
}

export default function ChildDashboard({ userProfile, familyCode, onLogout }: ChildDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tasks")
  const [xp, setXp] = useState(2450)
  const [level, setLevel] = useState(8)
  const [points, setPoints] = useState(1250)
  const [streak, setStreak] = useState(7)
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
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Уровень</p>
                <p className="font-bold text-lg text-primary">{level}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Опыт</p>
                <p className="font-bold text-lg text-accent">{xp}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Очки</p>
                <p className="font-bold text-lg text-secondary">{points}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Серия</p>
                <p className="font-bold text-lg text-orange-500">🔥{streak}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">
                    {userProfile.avatar}
                  </div>
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
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Уровень</p>
                  <p className="text-3xl font-bold text-primary">{level}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Опыт</p>
                  <p className="text-3xl font-bold text-accent">{xp}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Очки</p>
                  <p className="text-3xl font-bold text-secondary">{points}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Серия</p>
                  <p className="text-3xl font-bold text-orange-500">🔥 {streak} дн.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-96">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 h-auto p-1 bg-muted">
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
            <ChildProfile />
          </TabsContent>
        </Tabs>
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
