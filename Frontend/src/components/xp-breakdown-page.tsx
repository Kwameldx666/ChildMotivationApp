"use client"

import { ArrowLeft, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface XPBreakdownPageProps {
  onBack: () => void
}

export default function XPBreakdownPage({ onBack }: XPBreakdownPageProps) {
  const { t } = useTranslation()
  const xpBreakdown = [
    { task: t("xpBreakdown.cleanRoom"), xp: 150, date: t("xpBreakdown.today") },
    { task: t("xpBreakdown.washDishes"), xp: 100, date: t("xpBreakdown.today") },
    { task: t("xpBreakdown.dailyMission"), xp: 50, date: t("xpBreakdown.yesterday") },
    { task: t("xpBreakdown.achievementUnlocked"), xp: 200, date: t("xpBreakdown.yesterday") },
  ]

  const totalXP = xpBreakdown.reduce((sum, item) => sum + item.xp, 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t("xpBreakdown.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="mb-6 bg-gradient-to-r from-accent/10 to-secondary/10">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-2">{t("xpBreakdown.totalXPForDays")}</p>
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
