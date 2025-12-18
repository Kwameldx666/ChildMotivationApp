"use client"

import { ArrowLeft, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface XPBreakdownPageProps {
  onBack: () => void
}

export default function XPBreakdownPage({ onBack }: XPBreakdownPageProps) {
  const xpBreakdown = [
    { task: "Убрать комнату", xp: 150, date: "Сегодня" },
    { task: "Помыть посуду", xp: 100, date: "Сегодня" },
    { task: "Ежедневная миссия", xp: 50, date: "Вчера" },
    { task: "Достижение разблокировано", xp: 200, date: "Вчера" },
  ]

  const totalXP = xpBreakdown.reduce((sum, item) => sum + item.xp, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Прирост опыта
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6 bg-gradient-to-r from-accent/10 to-secondary/10">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-2">Всего XP за 2 дня</p>
            <p className="text-center text-4xl font-bold text-accent">{totalXP}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {xpBreakdown.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.task}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <p className="text-lg font-bold text-accent">+{item.xp}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
