"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useI18n } from "@/i18n/provider"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { ChevronLeft, ChevronRight, Filter, Loader2, Download } from "lucide-react"
import { getTaskAnalytics, type AnalyticsData } from "@/services/analytics-service"

export default function AnalyticsDashboard() {
  const { t } = useI18n()
  const [currentChart, setCurrentChart] = useState(0)
  const [selectedChild, setSelectedChild] = useState("all")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowDays, setWindowDays] = useState(30)
  const exportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [windowDays])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTaskAnalytics(windowDays)
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('analyticsDashboard.loadError'))
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('analyticsDashboard.loading')}</span>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error || t('analyticsDashboard.noData')}</p>
        <Button onClick={loadAnalytics}>{t('analyticsDashboard.tryAgain')}</Button>
      </div>
    )
  }

  // Конфигурация графиков
  const chartsConfig = [
    { id: 0, titleKey: "analytics.charts.weeklyActivity", type: "bar" },
    { id: 1, titleKey: "analytics.charts.pointsByChildren", type: "pie" },
    { id: 2, titleKey: "analytics.charts.difficultyDistribution", type: "pie" },
    { id: 3, titleKey: "analytics.charts.weeklyProgress", type: "area" },
    { id: 4, titleKey: "analytics.charts.taskStatus", type: "pie" },
    { id: 5, titleKey: "analytics.charts.pointsTrend", type: "area" },
  ]

  const renderChart = (chartId: number) => {
    switch (chartId) {
      case 0:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCompleted" fill="#8b5cf6" name={t('analytics.chartLabels.tasks')} />
              <Bar dataKey="pointsEarned" fill="#f59e0b" name={t('analytics.chartLabels.points')} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 1:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.childrenStats.map(c => ({ name: c.childName, value: c.totalPoints, fill: c.color }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.childrenStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 2:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.difficultyDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.difficultyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 3:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" name={t('analytics.chartLabels.completed')} />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={t('analytics.chartLabels.total')} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 4:
        const taskStatusData = [
          { name: t('analytics.chartLabels.completed'), value: analytics.taskStatus.completed, fill: "#10b981" },
          { name: t('analytics.chartLabels.inProgress'), value: analytics.taskStatus.inProgress, fill: "#f59e0b" },
          { name: t('analytics.chartLabels.overdue'), value: analytics.taskStatus.overdue, fill: "#ef4444" },
        ]
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 5:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.pointsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="points" stroke="#8b5cf6" fill="#8b5cf6" name={t('analytics.chartLabels.points')} />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  const nextChart = () => {
    setCurrentChart((prev) => (prev + 1) % chartsConfig.length)
  }

  const prevChart = () => {
    setCurrentChart((prev) => (prev - 1 + chartsConfig.length) % chartsConfig.length)
  }

  const exportAsPng = async () => {
    if (!exportRef.current) return
    const dataUrl = await toPng(exportRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    })
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = `analytics_${windowDays}d_${new Date().toISOString().slice(0, 10)}.png`
    link.click()
  }

  const exportAsPdf = async () => {
    if (!exportRef.current) return
    const dataUrl = await toPng(exportRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    })

    const img = new Image()
    img.src = dataUrl
    await img.decode()

    const pdf = new jsPDF({ orientation: "p", unit: "px", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const ratio = Math.min(pageWidth / img.width, pageHeight / img.height)
    const imgWidth = img.width * ratio
    const imgHeight = img.height * ratio
    const x = (pageWidth - imgWidth) / 2
    const y = 20

    pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight)
    pdf.save(`analytics_${windowDays}d_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Выбор периода + экспорт */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={windowDays === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setWindowDays(7)}
          >
            {t('analytics.periodSelection.7days')}
          </Button>
          <Button
            variant={windowDays === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setWindowDays(30)}
          >
            {t('analytics.periodSelection.30days')}
          </Button>
          <Button
            variant={windowDays === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setWindowDays(90)}
          >
            {t('analytics.periodSelection.90days')}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAsPng}>
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.export.png')}
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsPdf}>
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.export.pdf')}
          </Button>
        </div>
      </div>

      <div ref={exportRef} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('analytics.cards.totalPoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.cards.earnedForPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('analytics.cards.completedTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{analytics.completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.cards.outOf', { total: analytics.totalTasks })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('analytics.cards.completionRate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{analytics.completionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.cards.successRate')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('analytics.cards.activeChildren')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">{analytics.activeChildren}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('analytics.cards.participatingInTasks')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t(chartsConfig[currentChart].titleKey)}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t('analyticsDashboard.chartOf', { current: currentChart + 1, total: chartsConfig.length })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevChart}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextChart}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Фильтр по детям */}
          {analytics.childrenStats.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <Filter className="w-4 h-4 mt-2 text-muted-foreground" />
              <Button
                variant={selectedChild === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChild("all")}
              >
                {t('analyticsDashboard.wholeFamily')}
              </Button>
              {analytics.childrenStats.map((child) => (
                <Button
                  key={child.childId}
                  variant={selectedChild === "child.childId"}
                  size="sm"
                  onClick={() => setSelectedChild(child.childId)}
                >
                  {child.childName}
                </Button>
              ))}
            </div>
          )}
          {renderChart(currentChart)}
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('analyticsDashboard.quickSwitch')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {chartsConfig.map((chart, idx) => (
                <Button
                  key={chart.id}
                  variant={currentChart === idx ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setCurrentChart(idx)}
                >
                  {idx + 1}. {t(chart.titleKey)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
