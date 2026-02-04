"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Trash2, CheckCheck, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppRoute } from "@/routes/AppRoute"

interface Notification {
  id: string
  type: "task" | "reward" | "achievement" | "level" | "family" | "system"
  title: string
  message: string
  time: string
  timestamp: Date
  read: boolean
}

const NOTIFICATION_ICONS: Record<string, string> = {
  task: "📝",
  reward: "🎁",
  achievement: "🏆",
  level: "⬆️",
  family: "👨‍👩‍👧‍👦",
  system: "🔔",
}

const NOTIFICATION_COLORS: Record<string, string> = {
  task: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  reward: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  achievement: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  level: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  family: "bg-pink-500/10 text-pink-700 border-pink-500/30",
  system: "bg-slate-500/10 text-slate-700 border-slate-500/30",
}

// Генерируем демо-данные для истории уведомлений
const generateDemoNotifications = (): Notification[] => {
  const now = new Date()
  return [
    {
      id: "1",
      type: "task",
      title: "Новая задача",
      message: "Родитель создал задачу «Помыть посуду»",
      time: "1 час назад",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "2",
      type: "reward",
      title: "Награда получена!",
      message: "Ты обменял 50 очков на «Дополнительная сказка на ночь»",
      time: "3 часа назад",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "3",
      type: "achievement",
      title: "Новое достижение!",
      message: "Разблокировано: «Юный помощник» — выполни 5 задач",
      time: "вчера",
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "4",
      type: "level",
      title: "Новый уровень!",
      message: "Поздравляем! Ты достиг уровня 5!",
      time: "2 дня назад",
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "5",
      type: "task",
      title: "Задача выполнена",
      message: "Ты успешно выполнил задачу «Прибраться в комнате»",
      time: "3 дня назад",
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "6",
      type: "family",
      title: "Новый член семьи",
      message: "К семье присоединился новый участник",
      time: "5 дней назад",
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "7",
      type: "reward",
      title: "Новая награда в магазине",
      message: "Родитель добавил награду «Поход в кино» за 150 очков",
      time: "неделю назад",
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "8",
      type: "achievement",
      title: "Серия выполнения!",
      message: "Ты выполняешь задачи 7 дней подряд! 🔥",
      time: "неделю назад",
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "9",
      type: "system",
      title: "Добро пожаловать!",
      message: "Добро пожаловать в FamilyQuest! Начни выполнять задачи и зарабатывай награды.",
      time: "2 недели назад",
      timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ]
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Загружаем уведомления (в реальном приложении - из API)
    setNotifications(generateDemoNotifications())
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const filteredNotifications = useMemo(() => {
    let result = notifications

    if (filter !== "all") {
      if (filter === "unread") {
        result = result.filter((n) => !n.read)
      } else {
        result = result.filter((n) => n.type === filter)
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      )
    }

    return result
  }, [notifications, filter, searchQuery])

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = () => {
    if (window.confirm("Удалить все уведомления?")) {
      setNotifications([])
    }
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <AppRoute requiredRoles={["parent", "child"]} redirectTo="/">
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Прочитать все</span>
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
                    Очистить все
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Уведомления
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{unreadCount} новых</Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">История всех ваших уведомлений</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Поиск и фильтры */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск уведомлений..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="w-full flex-wrap h-auto p-1">
                <TabsTrigger value="all" className="text-xs">Все</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Непрочитанные {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="task" className="text-xs">📝 Задачи</TabsTrigger>
                <TabsTrigger value="reward" className="text-xs">🎁 Награды</TabsTrigger>
                <TabsTrigger value="achievement" className="text-xs">🏆 Достижения</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Список уведомлений */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Нет уведомлений</h3>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" || searchQuery
                    ? "По вашему запросу ничего не найдено"
                    : "Здесь будут появляться ваши уведомления"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    !notif.read ? "border-primary/50 bg-primary/5" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${NOTIFICATION_COLORS[notif.type]}`}
                      >
                        {NOTIFICATION_ICONS[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-semibold ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notif.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{notif.time}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 w-8 p-0 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNotification(notif.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AppRoute>
  )
}
