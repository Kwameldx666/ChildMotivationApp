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

const formatPercent = (value: number) => `${Math.round(value)}%`

const isLowQualityAiReply = (reply: string) => {
  const trimmed = reply.trim()
  if (!trimmed) return true
  if (!/\d/.test(trimmed)) return true

  const lines = trimmed
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length < 3) return true

  const genericMarkers = [
    "отличная идея",
    "могу сразу",
    "разбить задачу",
    "понятный дедлайн",
    "быструю награду",
    "great idea",
    "you can do it",
    "excellent progress",
    "idee grozava",
    "progres excelent",
  ]

  const normalized = trimmed.toLowerCase()
  const genericHits = genericMarkers.filter(marker => normalized.includes(marker)).length
  return genericHits >= 2
}

const buildDeterministicInsights = (analytics: AnalyticsData, windowDays: number) => {
  const completionRate = analytics.completionRate
  const overdue = analytics.taskStatus.overdue
  const inProgress = analytics.taskStatus.inProgress
  const topChild = [...analytics.childrenStats].sort((a, b) => b.totalPoints - a.totalPoints)[0]
  const supportChild = [...analytics.childrenStats].sort((a, b) => {
    const aTotal = a.completedTasks + a.pendingTasks
    const bTotal = b.completedTasks + b.pendingTasks
    const aRate = aTotal > 0 ? a.completedTasks / aTotal : 0
    const bRate = bTotal > 0 ? b.completedTasks / bTotal : 0
    return aRate - bRate
  })[0]

  const totalByDifficulty = analytics.difficultyDistribution.reduce((sum, item) => sum + item.value, 0)
  const hardShare = totalByDifficulty > 0
    ? (analytics.difficultyDistribution
        .filter(item => item.name.toLowerCase().includes("сложно"))
        .reduce((sum, item) => sum + item.value, 0) / totalByDifficulty) * 100
    : 0

  const pointsTrend = analytics.pointsTrend
  const trendDelta = pointsTrend.length >= 2
    ? pointsTrend[pointsTrend.length - 1].points - pointsTrend[0].points
    : 0

  const insights = [
    `- За ${windowDays} дн.: выполнено ${analytics.completedTasks}/${analytics.totalTasks} задач (${formatPercent(completionRate)}). Действие: удерживать недельную цель не ниже 80%.`,
    `- В работе ${inProgress}, просрочено ${overdue}. Действие: сегодня закрыть 1-2 просроченные задачи с низкой сложностью.`,
    topChild
      ? `- Лидер по очкам: ${topChild.childName} (${topChild.totalPoints}). Действие: закрепить прогресс бонусом за серию 3 дней.`
      : `- Нет лидера по очкам. Действие: добавить прозрачную доску прогресса для всех детей.`,
    supportChild
      ? `- Зона поддержки: ${supportChild.childName}. Действие: уменьшить размер задач и давать быстрый фидбек после каждого выполнения.`
      : `- Зона поддержки не определена. Действие: разделить большие задачи на короткие шаги.`,
    `- Доля сложных задач: ${formatPercent(hardShare)}. Тренд очков за период: +${trendDelta}. Действие: держать сложные задачи в диапазоне 20-30% от общего объёма.`,
  ]

  return [
    "AI-аналитика (авто-режим):",
    ...insights,
  ].join("\n")
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
      const languageInstruction = locale === "ru" ? "Russian" : locale === "ro" ? "Romanian" : "English"
      const response = await aiService.sendChatMessage({
        message: [
          "You are a strict family productivity analyst.",
          "Return exactly 5 bullet points.",
          "Each bullet must contain: metric -> risk -> concrete action for this week.",
          "No generic motivational phrases.",
          "Use numeric values from the data.",
          "Focus on overdue risks, completion momentum, and child-specific coaching.",
          `Language: ${languageInstruction}.`,
          "",
          summary,
        ].join("\n"),
        context: {
          locale: localeMap[locale] ?? locale,
          audience: "parent",
          mode: "analytics",
        },
      })
      const reply = (response.reply ?? "").trim()
      if (isLowQualityAiReply(reply)) {
        setInsights(buildDeterministicInsights(analytics, windowDays))
      } else {
        setInsights(reply)
      }
    } catch {
      setInsights(buildDeterministicInsights(analytics, windowDays))
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [analytics, buildAnalyticsSummary, locale, windowDays])

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
