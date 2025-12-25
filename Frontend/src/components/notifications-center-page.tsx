"use client"

import { ArrowLeft, Bell, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

interface NotificationsCenterPageProps {
  onBack: () => void
}

export default function NotificationsCenterPage({ onBack }: NotificationsCenterPageProps) {
  const [notifications, setNotifications] = useState([
    { id: 1, type: "task", title: "Новая задача", message: "Родитель создал задачу Помыть посуду", time: "1 ч" },
    { id: 2, type: "reward", title: "Награда куплена", message: "Ты купил(а) Пицца за 500 очков", time: "3 ч" },
    { id: 3, type: "achievement", title: "Достижение!", message: "Разблокировано: Юный помощник", time: "вчера" },
    { id: 4, type: "level", title: "Новый уровень", message: "Ты достиг(ла) уровня 10!", time: "2 дня" },
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>
              Очистить все
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <Bell className="w-5 h-5" />
          Уведомления
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">У тебя нет новых уведомлений</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card key={notif.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time} назад</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotifications(notifications.filter((n) => n.id !== notif.id))}
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
  )
}
