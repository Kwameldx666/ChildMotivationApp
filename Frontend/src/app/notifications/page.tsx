"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Trash2, CheckCheck, Search, Loader2, Check, Target, Gift, Trophy, Zap, Star, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppRoute } from "@/routes/AppRoute"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/services/notifications-queries"
import type { NotificationType, NotificationDto } from "@/services/notifications-service"
import { useUserSettings } from "@/hooks/use-user-settings"

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  task_created: Target,
  task_completed: Check,
  task_updated: Target,
  task_assigned: Target,
  reward_purchased: Gift,
  achievement_unlocked: Trophy,
  streak_bonus: Zap,
  level_up: Star,
  general: Info,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  task_created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  task_completed: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  task_updated: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  task_assigned: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  reward_purchased: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  achievement_unlocked: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  streak_bonus: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  level_up: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  general: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
}

// Map backend types to filter categories
function getFilterCategory(type: string): string {
  if (type.startsWith("task_")) return "task"
  if (type === "reward_purchased") return "reward"
  if (type === "achievement_unlocked" || type === "streak_bonus" || type === "level_up") return "achievement"
  return "system"
}

function formatTimeAgo(dateString: string, t: (key: string, params?: Record<string, string | number>) => string, locale: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t("notificationsPopover.justNow")
    if (diffMins < 60) return t("notificationsPopover.minutesAgo", { count: diffMins })
    if (diffHours < 24) return t("notificationsPopover.hoursAgo", { count: diffHours })
    if (diffDays < 7) return t("notificationsPopover.daysAgo", { count: diffDays })
    const dateLocale = locale === "ru" ? "ru-RU" : locale === "ro" ? "ro-RO" : "en-US"
    return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { settings } = useUserSettings()

  // Real API queries
  const { data: notifications, isLoading } = useNotifications()
  const { data: unreadCountData } = useUnreadNotificationsCount()
  const markRead = useMarkNotificationsRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  const allNotifications = settings.notificationsEnabled ? (notifications ?? []) : []
  const unreadCount = settings.notificationsEnabled
    ? (typeof unreadCountData === "number" ? unreadCountData : allNotifications.filter(n => !n.isRead).length)
    : 0

  const filteredNotifications = useMemo(() => {
    let result = allNotifications

    if (filter !== "all") {
      if (filter === "unread") {
        result = result.filter((n) => !n.isRead)
      } else {
        result = result.filter((n) => getFilterCategory(n.type) === filter)
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
  }, [allNotifications, filter, searchQuery])

  const handleMarkAllRead = () => {
    if (!settings.notificationsEnabled) return
    markAllRead.mutate()
  }

  const handleDeleteNotification = (id: string) => {
    if (!settings.notificationsEnabled) return
    deleteNotification.mutate(id)
  }

  const handleMarkAsRead = (id: string) => {
    if (!settings.notificationsEnabled) return
    markRead.mutate([id])
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={markAllRead.isPending}
                    className="gap-2"
                  >
                    {markAllRead.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{t("notificationsPage.readAll")}</span>
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
          {/* Search & filters */}
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

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
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
              {filteredNotifications.map((notif) => {
                const Icon = NOTIFICATION_ICONS[notif.type] ?? Bell
                const colorClass = NOTIFICATION_COLORS[notif.type] ?? NOTIFICATION_COLORS.general
                const timeAgo = formatTimeAgo(notif.createdAt, t, locale)

                return (
                  <Card
                    key={notif.id}
                    className={cn(
                      "transition-all cursor-pointer hover:shadow-md",
                      !notif.isRead && "border-primary/50 bg-primary/5"
                    )}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("font-semibold", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                                {notif.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                            </div>
                            {!notif.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-8 w-8 p-0 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotification(notif.id)
                          }}
                          disabled={deleteNotification.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </AppRoute>
  )
}
