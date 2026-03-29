"use client"

чimport { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  Bell,
  Check,
  CheckCheck,
  Gift,
  Star,
  Target,
  Trophy,
  Zap,
  Info,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
} from "@/services/notifications-queries"
import { useUserSettings } from "@/hooks/use-user-settings"
import { canReceiveLiveNotifications } from "@/services/user-settings-service"
import type { NotificationType, NotificationDto } from "@/services/notifications-service"
import { useTranslation } from "@/i18n/provider"

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  task_created: Target,
  task_completed: Check,
  task_assigned: Target,
  reward_purchased: Gift,
  achievement_unlocked: Trophy,
  streak_bonus: Zap,
  level_up: Star,
  general: Info,
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  task_created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  task_completed: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  task_assigned: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  reward_purchased: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  achievement_unlocked: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  streak_bonus: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  level_up: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  general: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
}

interface NotificationItemProps {
  notification: NotificationDto
  onMarkRead: (id: string) => void
}

// Простая функция для отображения времени
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

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const { t, locale } = useTranslation()
  const Icon = NOTIFICATION_ICONS[notification.type] ?? Info
  const colorClass = NOTIFICATION_COLORS[notification.type] ?? NOTIFICATION_COLORS.general

  const timeAgo = useMemo(() => {
    return formatTimeAgo(notification.createdAt, t, locale)
  }, [notification.createdAt, t, locale])

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium truncate", !notification.isRead && "font-semibold")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  )
}

export function NotificationsPopover() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { settings } = useUserSettings()
  const lastUnreadCountRef = useRef(0)
  
  // Запросы к API
  const { data: notifications, isLoading, isError } = useNotifications()
  const { data: unreadCount } = useUnreadNotificationsCount()
  const markRead = useMarkNotificationsRead()
  const markAllRead = useMarkAllNotificationsRead()

  // Use real API data only
  const displayNotifications = settings.notificationsEnabled ? (notifications ?? []) : []

  const displayUnreadCount = useMemo(() => {
    if (!settings.notificationsEnabled) return 0
    if (typeof unreadCount === "number") return unreadCount
    return displayNotifications.filter(n => !n.isRead).length
  }, [unreadCount, displayNotifications, settings.notificationsEnabled])

  // Request native notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const previous = lastUnreadCountRef.current
    const increased = displayUnreadCount > previous
    lastUnreadCountRef.current = displayUnreadCount

    if (!increased) return
    if (!settings.notificationsEnabled) return
    if (!canReceiveLiveNotifications(settings)) return

    if (settings.soundEnabled) {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YTAAAAAAAP///wAA//8AAP//AAD//wAA//8AAP///wAA")
        audio.volume = 0.25
        void audio.play().catch(() => undefined)
      } catch {
        // ignore browser autoplay restrictions
      }
    }

    // Trigger native push notification
    if ("Notification" in window && Notification.permission === "granted") {
      const newNotifs = displayNotifications.filter(n => !n.isRead)
      if (newNotifs.length > 0) {
        const latestNotif = newNotifs[0]
        try {
          new Notification(latestNotif.title, {
            body: latestNotif.message,
            icon: "/icon.png"
          })
        } catch (e) {
          console.error("Failed to show native notification", e)
        }
      }
    }
  }, [displayUnreadCount, displayNotifications, settings])

  const handleMarkRead = (id: string) => {
    if (!settings.notificationsEnabled) return
    markRead.mutate([id])
  }

  const handleMarkAllRead = useCallback(() => {
    if (!settings.notificationsEnabled) return
    markAllRead.mutate()
  }, [settings.notificationsEnabled, markAllRead])

  // Mark all as read when opening popover
  useEffect(() => {
    if (open && displayUnreadCount > 0) {
      handleMarkAllRead()
    }
  }, [open, displayUnreadCount, handleMarkAllRead])

  // To prevent the UI from "jumping" instantly when opening the popover
  // we can freeze the visually unread notifications while the popover is open.
  const [frozenUnreadIds, setFrozenUnreadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      // capture currently unread
      setFrozenUnreadIds(new Set(displayNotifications.filter(n => !n.isRead).map(n => n.id)))
    } else {
      setFrozenUnreadIds(new Set())
    }
  }, [open]) // intentional: only run when open state changes

  const unreadNotifications = displayNotifications.filter(n => open ? frozenUnreadIds.has(n.id) : !n.isRead)
  const readNotifications = displayNotifications.filter(n => open ? !frozenUnreadIds.has(n.id) : n.isRead)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("notificationsPopover.title")}
        >
          <Bell className="h-5 w-5" />
          {displayUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {displayUnreadCount > 9 ? "9+" : displayUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold">{t("notificationsPopover.title")}</h4>
          {displayUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              {t("notificationsPopover.markAllRead")}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{t("notificationsPopover.noNotifications")}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {unreadNotifications.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                    {t("notificationsPopover.newCount", { count: unreadNotifications.length })}
                  </p>
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </>
              )}
              
              {readNotifications.length > 0 && (
                <>
                  {unreadNotifications.length > 0 && (
                    <Separator className="my-2" />
                  )}
                  <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                    {t("notificationsPopover.read")}
                  </p>
                  {readNotifications.slice(0, 5).map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                  {readNotifications.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      {t("notificationsPopover.andMore", { count: readNotifications.length - 5 })}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
