"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Flame, Copy, Check } from "lucide-react"
import { useState } from "react"

interface ChildProfileProps {
  childId?: string
  name?: string
  avatar?: string
}

export default function ChildProfile({ childId = "A3K9M2", name = "Иван", avatar = "👦" }: ChildProfileProps) {
  const [copied, setCopied] = useState(false)

  const achievements = [
    { icon: "⭐", title: "Звёздный старт", description: "Завершить первые 10 задач" },
    { icon: "🔥", title: "На волне", description: "7 дней подряд выполнения задач" },
    { icon: "💎", title: "Коллекционер наград", description: "Купить 5 разных наград" },
    { icon: "🚀", title: "Взлёт", description: "Достичь уровня 10" },
  ]

  const handleCopyId = () => {
    navigator.clipboard.writeText(childId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-4">
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-5xl">
              {avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">ID профиля:</span>
                <code className="bg-secondary/30 px-3 py-1 rounded font-mono font-semibold text-sm">{childId}</code>
                <Button size="sm" variant="ghost" onClick={handleCopyId} className="h-6 w-6 p-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Текущая серия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              <p className="text-3xl font-bold">12</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">дней подряд</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ранг</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">Мастер</p>
            <p className="text-xs text-muted-foreground mt-1">Уровень 8</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Купленные награды</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">8</p>
            <p className="text-xs text-muted-foreground mt-1">Из магазина</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, i) => (
              <div key={i} className="text-center p-4 bg-background rounded-lg hover:bg-muted transition-colors">
                <p className="text-4xl mb-2">{achievement.icon}</p>
                <p className="text-sm font-semibold mb-1">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
