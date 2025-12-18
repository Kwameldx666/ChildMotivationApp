"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FamilyTimelinePageProps {
  onBack: () => void
}

export default function FamilyTimelinePage({ onBack }: FamilyTimelinePageProps) {
  const events = [
    { type: "achievement", user: "Иван", text: "разблокировал достижение Юный помощник", time: "2 часа назад" },
    { type: "reward", user: "Мария", text: "купила награду Пицца", time: "4 часа назад" },
    { type: "task", user: "Родитель", text: "создал задачу Помыть посуду", time: "вчера" },
    { type: "level", user: "Иван", text: "достиг уровня 10!", time: "вчера" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">История семьи</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {events.map((event, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">
                      <span className="text-primary">{event.user}</span> {event.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
