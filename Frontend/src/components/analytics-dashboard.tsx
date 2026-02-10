"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ChevronLeft, ChevronRight, Filter, Loader2, Download, FileDown, Image as ImageIcon, FileText } from "lucide-react"
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
  const allChartsRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)

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

  const exportAllChartsToPdf = useCallback(async () => {
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

  const exportCurrentAsPdf = async () => {
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

  const exportAllChartsToPdf = useCallback(async () => {
    if (!analytics || exporting) return
    setExporting(true)

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 30

      // Title page
      pdf.setFontSize(24)
      pdf.text(t('analytics.exportAll.reportTitle'), pageWidth / 2, 60, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(
        `${t('analytics.exportAll.period')}: ${windowDays} ${t('analytics.exportAll.days')}  •  ${new Date().toLocaleDateString()}`,
        pageWidth / 2, 90, { align: "center" }
      )

      // Summary stats on title page
      const statsY = 130
      pdf.setFontSize(14)
      const stats = [
        { label: t('analytics.cards.totalPoints'), value: analytics.totalPoints.toLocaleString() },
        { label: t('analytics.cards.completedTasks'), value: `${analytics.completedTasks} / ${analytics.totalTasks}` },
        { label: t('analytics.cards.completionRate'), value: `${analytics.completionRate.toFixed(1)}%` },
        { label: t('analytics.cards.activeChildren'), value: String(analytics.activeChildren) },
      ]
      const colWidth = (pageWidth - margin * 2) / stats.length
      stats.forEach((stat, i) => {
        const x = margin + colWidth * i + colWidth / 2
        pdf.setFontSize(11)
        pdf.setTextColor(100)
        pdf.text(stat.label, x, statsY, { align: "center" })
        pdf.setFontSize(22)
        pdf.setTextColor(0)
        pdf.text(stat.value, x, statsY + 28, { align: "center" })
      })

      // Render all charts into a hidden container and capture each
      const container = allChartsRef.current
      if (!container) {
        setExporting(false)
        return
      }

      // Show all-charts container temporarily for capture
      container.style.display = "block"
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "900px"
      container.style.backgroundColor = "#ffffff"

      // Wait for charts to render
      await new Promise((resolve) => setTimeout(resolve, 500))

      const chartNodes = container.querySelectorAll<HTMLElement>("[data-chart-export]")

      for (let i = 0; i < chartNodes.length; i++) {
        const node = chartNodes[i]
        pdf.addPage()

        // Chart title
        const chartTitle = chartsConfig[i]?.titleKey ? t(chartsConfig[i].titleKey) : `Chart ${i + 1}`
        pdf.setFontSize(18)
        pdf.setTextColor(0)
        pdf.text(`${i + 1}. ${chartTitle}`, margin, 40)

        try {
          const dataUrl = await toPng(node, {
            cacheBust: true,
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          })
          const img = new Image()
          img.src = dataUrl
          await img.decode()

          const maxW = pageWidth - margin * 2
          const maxH = pageHeight - 80 - margin
          const ratio = Math.min(maxW / img.width, maxH / img.height)
          const imgW = img.width * ratio
          const imgH = img.height * ratio
          const x = (pageWidth - imgW) / 2
          pdf.addImage(dataUrl, "PNG", x, 60, imgW, imgH)
        } catch (e) {
          pdf.setFontSize(12)
          pdf.setTextColor(200, 0, 0)
          pdf.text(t('analytics.exportAll.renderError'), margin, 80)
        }
      }

      container.style.display = "none"

      pdf.save(`analytics_full_report_${windowDays}d_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error("PDF export error:", err)
    } finally {
      setExporting(false)
    }
  }, [analytics, exporting, windowDays, t])

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
        <div className="flex gap-2 items-center">
          {/* Primary: Export all to PDF */}
          <Button
            size="sm"
            onClick={exportAllChartsToPdf}
            disabled={exporting}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-white shadow-md hover:shadow-lg transition-all"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {exporting ? t('analytics.exportAll.generating') : t('analytics.exportAll.button')}
          </Button>

          {/* Secondary: dropdown for current view export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                {t('analytics.exportAll.currentView')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsPng} className="gap-2 cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                {t('analytics.exportAll.currentPng')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportCurrentAsPdf} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                {t('analytics.exportAll.currentPdf')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Hidden container for rendering all charts during PDF export */}
      <div ref={allChartsRef} style={{ display: "none" }}>
        {chartsConfig.map((chart, idx) => (
          <div key={chart.id} data-chart-export style={{ width: 900, height: 400, padding: 20 }}>
            {renderChart(idx)}
          </div>
        ))}
      </div>
    </div>
  )
}
