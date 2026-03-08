"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, RefreshCw, Brain, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"
import { aiService } from "@/services/ai-service"
import type { AnalyticsData } from "@/services/analytics-service"

interface AiAnalyticsInsightsProps {
  analytics: AnalyticsData
  windowDays: number
}

export default function AiAnalyticsInsights({ analytics, windowDays }: AiAnalyticsInsightsProps) {
  const { t, locale } = useTranslation()
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildAnalyticsSummary = useCallback(() => {
    const children = analytics.childrenStats.map(c => {
      const total = c.completedTasks + c.pendingTasks
      const rate = total > 0 ? ((c.completedTasks / total) * 100) : 0
      return `${c.childName}: ${c.completedTasks}/${total} tasks, ${c.totalPoints} points, ${rate.toFixed(0)}% rate`
    }).join("; ")

    const statusBreakdown = analytics.taskStatus
      ? `completed=${analytics.taskStatus.completed}, inProgress=${analytics.taskStatus.inProgress}, overdue=${analytics.taskStatus.overdue}`
      : ""

    return [
      `Period: last ${windowDays} days`,
      `Total tasks: ${analytics.totalTasks}, Completed: ${analytics.completedTasks}`,
      `Completion rate: ${analytics.completionRate.toFixed(1)}%`,
      `Total points earned: ${analytics.totalPoints}`,
      `Active children: ${analytics.activeChildren}`,
      children ? `Per-child: ${children}` : "",
      statusBreakdown ? `Status breakdown: ${statusBreakdown}` : "",
    ].filter(Boolean).join("\n")
  }, [analytics, windowDays])

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = buildAnalyticsSummary()
      const localeMap: Record<string, string> = { en: "en-US", ru: "ru-RU", ro: "ro-RO" }
      const response = await aiService.sendChatMessage({
        message: `Analyze this family task data and provide 3-5 short actionable insights with recommendations. Be concise.\n\n${summary}`,
        context: {
          locale: localeMap[locale] ?? locale,
          audience: "parent",
          mode: "analytics",
        },
      })
      setInsights(response.reply)
    } catch {
      setError(t("aiChat.error"))
    } finally {
      setLoading(false)
    }
  }, [buildAnalyticsSummary, locale, t])

  const sections = useMemo(() => {
    if (!insights) return []
    return insights.split("\n").filter(l => l.trim())
  }, [insights])

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-violet-50/50 via-white to-pink-50/30 dark:from-violet-950/20 dark:via-background dark:to-pink-950/10">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {t("analyticsAi.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {insights && (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInsights}
                disabled={loading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                {t("analyticsAi.refresh")}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading && !error && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[10px]">✨</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">{t("analyticsAi.cta")}</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {t("analyticsAi.ctaDescription")}
              </p>
            </div>
            <Button
              onClick={fetchInsights}
              className="gap-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="h-4 w-4" />
              {t("analyticsAi.generate")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
            <p className="text-sm text-muted-foreground">{t("analyticsAi.analyzing")}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchInsights} className="shrink-0">
              {t("analyticsAi.retry")}
            </Button>
          </div>
        )}

        {insights && !loading && (
          <div className="space-y-2">
            {sections.map((line, i) => {
              const isBullet = /^\s*[-•*]\s/.test(line) || /^\s*\d+[.)]\s/.test(line)
              return (
                <div
                  key={i}
                  className={cn(
                    "text-sm leading-relaxed",
                    isBullet
                      ? "flex items-start gap-2 pl-2 py-1.5 rounded-lg bg-muted/40"
                      : "py-1",
                  )}
                >
                  {isBullet && (
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-foreground/90 whitespace-pre-wrap">
                    {line.replace(/^\s*[-•*]\s/, "").replace(/^\s*\d+[.)]\s/, "")}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
