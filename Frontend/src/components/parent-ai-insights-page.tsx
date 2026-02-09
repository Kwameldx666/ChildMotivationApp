"use client"

import { ArrowLeft, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface ParentAIInsightsPageProps {
  onBack: () => void
}

export default function ParentAIInsightsPage({ onBack }: ParentAIInsightsPageProps) {
  const { t } = useTranslation()

  const insights = [
    {
      type: "warning",
      title: t("parentAiInsights.lowMotivationTitle"),
      message: t("parentAiInsights.lowMotivationMessage"),
    },
    {
      type: "success",
      title: t("parentAiInsights.greatProgressTitle"),
      message: t("parentAiInsights.greatProgressMessage"),
    },
    {
      type: "insight",
      title: t("parentAiInsights.rewardAnalysisTitle"),
      message: t("parentAiInsights.rewardAnalysisMessage"),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
          <TrendingUp className="w-5 h-5" />
          {t("parentAiInsights.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {insights.map((insight, idx) => (
          <Card
            key={idx}
            className={`${
              insight.type === "warning" ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"
            }`}
          >
            <CardContent className="pt-4">
              <p className="font-semibold flex items-center gap-2 text-sm">
                {insight.type === "warning" && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                {insight.title}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{insight.message}</p>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}
