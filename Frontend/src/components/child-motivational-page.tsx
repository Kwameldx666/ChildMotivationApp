"use client"

import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ChildMotivationalPageProps {
  onBack: () => void
}

export default function ChildMotivationalPage({ onBack }: ChildMotivationalPageProps) {
  const motivations = [
    {
      type: "story",
      title: "Твоя история успеха",
      content: "Ты уже выполнил 25 задач! Это отличный результат. Продолжай в том же духе!",
    },
    {
      type: "tip",
      title: "Советы",
      content: "Начни день с лёгкой задачи, чтобы набрать импульс. Это поможет тебе мотивироваться на остальное.",
    },
    {
      type: "praise",
      title: "Похвала",
      content: "Твоя серия из 7 дней - это потрясающе! Такая дисциплина поможет тебе в жизни!",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Мотивация
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {motivations.map((item, idx) => (
          <Card key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-4">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{item.content}</p>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}
