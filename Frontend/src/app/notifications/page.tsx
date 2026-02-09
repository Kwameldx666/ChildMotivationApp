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
import { useTranslation } from "@/i18n/provider"

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

// Generate demo notification history data
const generateDemoNotifications = (t: (key: string) => string): Notification[] => {
  const now = new Date()
  return [
    {
      id: "1",
      type: "task",
      title: t("notificationsPage.demo.newTask.title"),
      message: t("notificationsPage.demo.newTask.message"),
      time: t("notificationsPage.demo.newTask.time"),
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "2",
      type: "reward",
      title: t("notificationsPage.demo.rewardReceived.title"),
      message: t("notificationsPage.demo.rewardReceived.message"),
      time: t("notificationsPage.demo.rewardReceived.time"),
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "3",
      type: "achievement",
      title: t("notificationsPage.demo.newAchievement.title"),
      message: t("notificationsPage.demo.newAchievement.message"),
      time: t("notificationsPage.demo.newAchievement.time"),
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "4",
      type: "level",
      title: t("notificationsPage.demo.newLevel.title"),
      message: t("notificationsPage.demo.newLevel.message"),
      time: t("notificationsPage.demo.newLevel.time"),
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "5",
      type: "task",
      title: t("notificationsPage.demo.taskCompleted.title"),
      message: t("notificationsPage.demo.taskCompleted.message"),
      time: t("notificationsPage.demo.taskCompleted.time"),
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "6",
      type: "family",
      title: t("notificationsPage.demo.newMember.title"),
      message: t("notificationsPage.demo.newMember.message"),
      time: t("notificationsPage.demo.newMember.time"),
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "7",
      type: "reward",
      title: t("notificationsPage.demo.newRewardInShop.title"),
      message: t("notificationsPage.demo.newRewardInShop.message"),
      time: t("notificationsPage.demo.newRewardInShop.time"),
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "8",
      type: "achievement",
      title: t("notificationsPage.demo.streak.title"),
      message: t("notificationsPage.demo.streak.message"),
      time: t("notificationsPage.demo.streak.time"),
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: "9",
      type: "system",
      title: t("notificationsPage.demo.welcome.title"),
      message: t("notificationsPage.demo.welcome.message"),
      time: t("notificationsPage.demo.welcome.time"),
      timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ]
}

export default function NotificationsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setNotifications(generateDemoNotifications(t))
  }, [t])

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
    if (window.confirm(t("notificationsPage.confirmDeleteAll"))) {
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
                {t("notificationsPage.back")}
              </Button>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
                    <CheckCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("notificationsPage.readAll")}</span>
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
                    {t("notificationsPage.clearAll")}
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                {t("notificationsPage.title")}
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{unreadCount} {t("notificationsPage.newCount")}</Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("notificationsPage.historySubtitle")}</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Поиск и фильтры */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("notificationsPage.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="w-full flex-wrap h-auto p-1">
                <TabsTrigger value="all" className="text-xs">{t("notificationsPage.filterAll")}</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  {t("notificationsPage.filterUnread")} {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="task" className="text-xs">{t("notificationsPage.filterTasks")}</TabsTrigger>
                <TabsTrigger value="reward" className="text-xs">{t("notificationsPage.filterRewards")}</TabsTrigger>
                <TabsTrigger value="achievement" className="text-xs">{t("notificationsPage.filterAchievements")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Список уведомлений */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t("notificationsPage.noNotifications")}</h3>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" || searchQuery
                    ? t("notificationsPage.nothingFound")
                    : t("notificationsPage.emptyMessage")}
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
