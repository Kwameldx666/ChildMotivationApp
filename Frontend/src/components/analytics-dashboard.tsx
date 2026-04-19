"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/provider"
import { useRealAnalytics } from "@/hooks/use-real-analytics"
import AiAnalyticsInsights from "./ai-analytics-insights"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type {
  AnalyticsData,
  CategoryData,
  DailyActivity,
  PointsTrend,
  WeeklyProgress,
} from "@/services/analytics-service"

const PERIOD_OPTIONS = [7, 30, 90] as const
const CHILD_COLORS = ["#0ea5e9", "#f97316", "#ef4444", "#22c55e", "#8b5cf6", "#14b8a6", "#f59e0b"]

const STATUS_COLORS = {
  completed: "#16a34a",
  inProgress: "#f59e0b",
  overdue: "#ef4444",
}

type DashboardView = {
  totalPoints: number
  completedTasks: number
  totalTasks: number
  completionRate: number
  activeChildren: number
  weeklyActivity: DailyActivity[]
  weeklyProgress: WeeklyProgress[]
  pointsTrend: PointsTrend[]
  difficultyDistribution: CategoryData[]
  taskStatus: {
    completed: number
    inProgress: number
    overdue: number
  }
  focusChildName: string | null
}

function metricDirection(value: number) {
  if (value > 0) return "+"
  return ""
}

function ChartShell({
  title,
  description,
  badge,
  className,
  children,
}: {
  title: string
  description: string
  badge?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={`group relative overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-2xl bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_8px_30px_rgba(14,165,233,0.15)] ${className ?? ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-white/0 pointer-events-none" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px] group-hover:bg-cyan-400/20 transition-all duration-700" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-[80px] group-hover:bg-emerald-400/20 transition-all duration-700" />
      
      <CardHeader className="relative pb-2 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{title}</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[85%]">{description}</p>
          </div>
          {badge ? (
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md px-2.5 py-1 uppercase text-[10px]">
              {badge}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pb-6">{children}</CardContent>
    </Card>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <Card className={`group relative overflow-hidden border-0 shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${accent}`}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-3xl group-hover:bg-white/30 transition-all duration-700" />
      <div className="absolute right-0 bottom-0 h-16 w-16 rounded-full bg-black/10 blur-xl" />
      <CardHeader className="relative z-10 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/80">{title}</CardTitle>
          <div className="h-9 w-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pt-2">
        <p className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{value}</p>
        <p className="text-xs font-bold max-w-[90%] text-white/80 mt-1 uppercase tracking-wider">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 dark:bg-black/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 text-sm min-w-[220px] text-white my-2 z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <p className="relative font-bold mb-3 text-white/90 uppercase tracking-widest text-xs opacity-80">{label}</p>
      <div className="relative space-y-3">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="relative h-3 w-3 rounded-full flex-shrink-0 shadow-[0_0_10px_currentColor]" 
              style={{ backgroundColor: entry.color || entry.fill, color: entry.color || entry.fill }}
            >
              <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: entry.color || entry.fill }} />
            </div>
            <span className="text-white/90 font-medium tracking-wide">{entry.name}</span>
            <span className="ml-auto font-black tabular-nums tracking-tighter text-white drop-shadow-md text-base">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { t } = useI18n()
  const [windowDays, setWindowDays] = useState<number>(30)
  const [selectedChild, setSelectedChild] = useState<string>("all")

  const {
    analytics,
    isLoading,
    isError,
    error,
  } = useRealAnalytics(windowDays)

  useEffect(() => {
    if (!analytics || selectedChild === "all") return
    const exists = analytics.childrenStats.some((child) => child.childId === selectedChild)
    if (!exists) {
      setSelectedChild("all")
    }
  }, [analytics, selectedChild])

  const view = useMemo<DashboardView | null>(() => {
    if (!analytics) return null

    if (selectedChild === "all") {
      return {
        totalPoints: analytics.totalPoints,
        completedTasks: analytics.completedTasks,
        totalTasks: analytics.totalTasks,
        completionRate: analytics.completionRate,
        activeChildren: analytics.activeChildren,
        weeklyActivity: analytics.weeklyActivity,
        weeklyProgress: analytics.weeklyProgress,
        pointsTrend: analytics.pointsTrend,
        difficultyDistribution: analytics.difficultyDistribution,
        taskStatus: analytics.taskStatus,
        focusChildName: null,
      }
    }

    const child = analytics.childrenStats.find((item) => item.childId === selectedChild)
    if (!child) return null

    const perChildActivity = analytics.perChildActivity.find((item) => item.childId === selectedChild)?.data ?? []
    const perChildProgress = analytics.perChildProgress.find((item) => item.childId === selectedChild)?.data ?? []
    const perChildPoints = analytics.perChildPointsTrend.find((item) => item.childId === selectedChild)?.data ?? []
    const perChildDifficulty = analytics.perChildDifficulty.find((item) => item.childId === selectedChild)?.data ?? []

    const overdue = child.overdueTasks ?? 0
    const inProgress = child.inProgressTasks ?? Math.max(0, child.pendingTasks - overdue)
    const totalTasks = child.completedTasks + child.pendingTasks
    const completionRate = totalTasks > 0 ? (child.completedTasks / totalTasks) * 100 : 0

    return {
      totalPoints: child.totalPoints,
      completedTasks: child.completedTasks,
      totalTasks,
      completionRate,
      activeChildren: totalTasks > 0 ? 1 : 0,
      weeklyActivity: perChildActivity,
      weeklyProgress: perChildProgress,
      pointsTrend: perChildPoints,
      difficultyDistribution: perChildDifficulty,
      taskStatus: {
        completed: child.completedTasks,
        inProgress,
        overdue,
      },
      focusChildName: child.childName,
    }
  }, [analytics, selectedChild])

  const activitySeries = useMemo(() => {
    if (!view) return []
    return view.weeklyActivity.map((point, index, arr) => {
      const sample = arr.slice(Math.max(0, index - 1), index + 2)
      const trend = sample.length > 0
        ? Math.round((sample.reduce((sum, x) => sum + x.tasksCompleted, 0) / sample.length) * 10) / 10
        : point.tasksCompleted
      return {
        ...point,
        trend,
      }
    })
  }, [view])

  const progressSeries = useMemo(() => {
    if (!view) return []
    return view.weeklyProgress.map((period) => ({
      period: period.week,
      completionPercent: period.total > 0 ? Math.round((period.completed / period.total) * 100) : 0,
      completed: period.completed,
      total: period.total,
    }))
  }, [view])

  const pointsSeries = useMemo(() => {
    if (!view) return []
    return view.pointsTrend.map((point, index, arr) => {
      const prev = index > 0 ? arr[index - 1].points : 0
      return {
        ...point,
        gain: Math.max(0, point.points - prev),
      }
    })
  }, [view])

  const difficultySeries = useMemo(() => {
    if (!view) return []
    return view.difficultyDistribution.filter((item) => item.value > 0)
  }, [view])

  const statusSeries = useMemo(() => {
    if (!view) return []
    return [
      {
        name: t("analytics.chartLabels.completed"),
        value: view.taskStatus.completed,
        color: STATUS_COLORS.completed,
      },
      {
        name: t("analytics.chartLabels.inProgress"),
        value: view.taskStatus.inProgress,
        color: STATUS_COLORS.inProgress,
      },
      {
        name: t("analytics.chartLabels.overdue"),
        value: view.taskStatus.overdue,
        color: STATUS_COLORS.overdue,
      },
    ].filter((item) => item.value > 0)
  }, [view, t])

  const leaderboardSeries = useMemo(() => {
    if (!analytics) return []
    return [...analytics.childrenStats]
      .map((child) => {
        const total = child.completedTasks + child.pendingTasks
        const completionPercent = total > 0 ? Math.round((child.completedTasks / total) * 100) : 0
        return {
          id: child.childId,
          childName: child.childName,
          totalPoints: child.totalPoints,
          completionPercent,
          completedTasks: child.completedTasks,
          pendingTasks: child.pendingTasks,
          isFocused: selectedChild !== "all" && child.childId === selectedChild,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [analytics, selectedChild])

  const pointsDelta = useMemo(() => {
    if (pointsSeries.length < 2) return 0
    const first = pointsSeries[0].points
    const last = pointsSeries[pointsSeries.length - 1].points
    return last - first
  }, [pointsSeries])

  const completionMomentum = useMemo(() => {
    if (progressSeries.length < 2) return 0
    const first = progressSeries[0].completionPercent
    const last = progressSeries[progressSeries.length - 1].completionPercent
    return last - first
  }, [progressSeries])

  const activeDays = useMemo(() => {
    return activitySeries.filter((day) => day.tasksCompleted > 0).length
  }, [activitySeries])

  const errorMessage = isError
    ? error?.message ?? t("analyticsDashboard.loadError")
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">{t("analyticsDashboard.loading")}</span>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t("analyticsDashboard.loadError")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics || !view) {
    return <p className="text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
  }

  const statusTotal = view.taskStatus.completed + view.taskStatus.inProgress + view.taskStatus.overdue
  const completedShare = statusTotal > 0 ? Math.round((view.taskStatus.completed / statusTotal) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 shadow-xl bg-[linear-gradient(130deg,#0f172a_0%,#134e4a_45%,#0f766e_100%)] text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-teal-300/20 blur-3xl" />

        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">{t("analytics.title")}</CardTitle>
              <p className="mt-1 text-sm text-white/85 max-w-2xl">
                {selectedChild === "all"
                  ? t("analytics.chartDescriptions.completionMomentum")
                  : `${t("analyticsDashboard.child")}: ${view.focusChildName}`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 p-1.5 backdrop-blur-md">
              {PERIOD_OPTIONS.map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant={windowDays === days ? "secondary" : "ghost"}
                  className={windowDays === days ? "text-slate-900" : "text-white hover:bg-white/20 hover:text-white"}
                  onClick={() => setWindowDays(days)}
                >
                  {t(`analytics.periodSelection.${days}days`)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest font-bold text-white/60">{t("analyticsDashboard.filterTitle", "Фильтр данных")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={selectedChild === "all" ? "secondary" : "outline"}
                className={selectedChild === "all" 
                  ? "bg-white text-teal-900 hover:bg-white/90 font-bold border-transparent" 
                  : "bg-white/5 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md"
                }
                onClick={() => setSelectedChild("all")}
              >
                <Users className="w-4 h-4 mr-2" />
                {t("analyticsDashboard.wholeFamily")}
              </Button>
              <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>
              {analytics.childrenStats.map((child) => (
                <Button
                  key={child.childId}
                  size="sm"
                  variant={selectedChild === child.childId ? "secondary" : "outline"}
                  className={selectedChild === child.childId 
                    ? "bg-cyan-400 text-cyan-950 hover:bg-cyan-300 font-bold border-transparent" 
                    : "bg-white/5 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md"
                  }
                  onClick={() => setSelectedChild(child.childId)}
                >
                  <Target className="w-4 h-4 mr-2 opacity-70" />
                  {child.childName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("analytics.cards.totalPoints")}
          value={view.totalPoints.toLocaleString()}
          subtitle={`${metricDirection(pointsDelta)}${pointsDelta.toLocaleString()} ${t("analytics.chartLabels.points")}`}
          accent="bg-[linear-gradient(135deg,#0284c7_0%,#0f766e_100%)]"
          icon={<Star className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.completedTasks")}
          value={view.completedTasks.toLocaleString()}
          subtitle={t("analytics.cards.outOf", { total: view.totalTasks })}
          accent="bg-[linear-gradient(135deg,#f97316_0%,#dc2626_100%)]"
          icon={<Target className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.completionRate")}
          value={`${view.completionRate.toFixed(1)}%`}
          subtitle={`${metricDirection(completionMomentum)}${completionMomentum.toFixed(1)}pp`}
          accent="bg-[linear-gradient(135deg,#16a34a_0%,#0f766e_100%)]"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.activeChildren")}
          value={view.activeChildren.toLocaleString()}
          subtitle={`${activeDays} ${t("analytics.chartLabels.activeDays")}`}
          accent="bg-[linear-gradient(135deg,#7c3aed_0%,#2563eb_100%)]"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <AiAnalyticsInsights analytics={analytics as AnalyticsData} windowDays={windowDays} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartShell
          className="xl:col-span-2"
          title={t("analytics.charts.activityPulse")}
          description={t("analytics.chartDescriptions.activityPulse")}
          badge={`${windowDays}d`}
        >
          {activitySeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={activitySeries} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                  <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur1" />
                      <feMergeNode in="blur2" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dy={12} />
                <YAxis yAxisId="tasks" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dx={-10} width={36} />
                <YAxis yAxisId="points" orientation="right" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dx={10} width={36} />
                <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "currentColor", opacity: 0.05 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 16, opacity: 0.8 }} />
                <Bar yAxisId="points" dataKey="pointsEarned" name={t("analytics.chartLabels.points")} fill="url(#bar-gradient)" radius={[8, 8, 8, 8]} barSize={26} />
                <Line yAxisId="tasks" type="monotone" dataKey="tasksCompleted" name={t("analytics.chartLabels.tasks")} stroke="#f97316" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: "white" }} activeDot={{ r: 8, strokeWidth: 4, stroke: "#f97316" }} filter="url(#neon-glow)" />
                <Line yAxisId="tasks" type="monotone" dataKey="trend" name={t("analytics.chartLabels.trend")} stroke="#10b981" strokeDasharray="8 6" strokeWidth={3} dot={false} filter="url(#neon-glow)" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        <ChartShell
          title={t("analytics.charts.completionMomentum")}
          description={t("analytics.chartDescriptions.completionMomentum")}
          badge={`${view.completionRate.toFixed(1)}%`}
        >
          {progressSeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={335}>
              <AreaChart data={progressSeries} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="completion-gradient-new" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="glow-area-line" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dy={12} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dx={-10} width={34} />
                <Tooltip content={<AnalyticsTooltip />} cursor={{ stroke: "currentColor", strokeWidth: 1, strokeOpacity: 0.1, strokeDasharray: "4 4" }} />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} label={{ position: 'insideTopLeft', value: 'Goal 80%', fill: '#f59e0b', fontSize: 11, fontWeight: 'bold' }} />
                <Area
                  type="monotone"
                  dataKey="completionPercent"
                  name={t("analytics.chartLabels.completionPercent")}
                  stroke="#10b981"
                  strokeWidth={4}
                  fill="url(#completion-gradient-new)"
                  filter="url(#glow-area-line)"
                  activeDot={{ r: 8, strokeWidth: 3, stroke: "#10b981", fill: "white" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        <ChartShell
          title={t("analytics.charts.taskStatusDonut")}
          description={t("analytics.chartDescriptions.taskStatusDonut")}
          badge={`${completedShare}% ${t("analytics.chartLabels.completed")}`}
        >
          {statusSeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <div>
              <div className="relative h-[335px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.25" />
                      </filter>
                    </defs>
                    <Pie 
                      data={statusSeries} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={85} 
                      outerRadius={125} 
                      paddingAngle={6}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={2}
                    >
                      {statusSeries.map((slice, index) => (
                        <Cell key={`${slice.name}-${index}`} fill={slice.color} filter="url(#pie-shadow)" style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip content={<AnalyticsTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white drop-shadow-sm">{completedShare}%</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{t("analytics.chartLabels.completed")}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors p-3 text-center shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1.5" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">{t("analytics.chartLabels.completed")}</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white">{view.taskStatus.completed}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-3 text-center shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
                  <Clock3 className="mx-auto h-5 w-5 text-amber-500 mb-1.5" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">{t("analytics.chartLabels.inProgress")}</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white">{view.taskStatus.inProgress}</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors p-3 text-center shadow-[0_4px_12px_rgba(244,63,94,0.05)]">
                  <AlertTriangle className="mx-auto h-5 w-5 text-rose-500 mb-1.5" />
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">{t("analytics.chartLabels.overdue")}</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white">{view.taskStatus.overdue}</p>
                </div>
              </div>
            </div>
          )}
        </ChartShell>

        <ChartShell
          className="xl:col-span-2"
          title={t("analytics.charts.pointsGrowth")}
          description={t("analytics.chartDescriptions.pointsGrowth")}
          badge={`${metricDirection(pointsDelta)}${pointsDelta}`}
        >
          {pointsSeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={pointsSeries} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="points-gradient-new" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="points-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="bar-points" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dy={12} />
                <YAxis yAxisId="total" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dx={-10} width={36} />
                <YAxis yAxisId="gain" orientation="right" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dx={10} width={36} />
                <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "currentColor", opacity: 0.05 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 16, opacity: 0.8 }} />
                <Bar yAxisId="gain" dataKey="gain" name={t("analytics.chartLabels.points")} fill="url(#bar-points)" radius={[8, 8, 8, 8]} barSize={26} />
                <Area yAxisId="total" type="monotone" dataKey="points" name={t("analytics.chartLabels.trend")} stroke="#06b6d4" strokeWidth={4} fill="url(#points-gradient-new)" filter="url(#points-glow)" activeDot={{ r: 8, strokeWidth: 3, stroke: "#06b6d4", fill: "white" }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        <ChartShell
          title={t("analytics.charts.difficultyRadar")}
          description={t("analytics.chartDescriptions.difficultyRadar")}
          badge={difficultySeries.length > 0 ? `${difficultySeries.length}` : undefined}
        >
          {difficultySeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={335}>
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <filter id="diff-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.3" />
                  </filter>
                </defs>
                <Pie 
                  data={difficultySeries} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={70} 
                  outerRadius={120} 
                  paddingAngle={5}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={2}
                >
                  {difficultySeries.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.color} filter="url(#diff-shadow)" style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} cursor={false} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 12, opacity: 0.8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        <ChartShell
          title={t("analytics.charts.childrenLeaderboard")}
          description={t("analytics.chartDescriptions.childrenLeaderboard")}
          badge={`${leaderboardSeries.length}`}
        >
          {leaderboardSeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={335}>
              <BarChart data={leaderboardSeries} layout="vertical" margin={{ top: 12, right: 24, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="leaderboard-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={1} />
                  </linearGradient>
                  <filter id="bar-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.2" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis type="number" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}  axisLine={false} tickLine={false} dy={10} />
                <YAxis dataKey="childName" type="category" tick={{ fontSize: 12, fontWeight: 700, fill: "currentColor" }}  axisLine={false} tickLine={false} width={90} dx={-10} />
                <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "currentColor", opacity: 0.05 }} />
                <Bar dataKey="totalPoints" name={t("analytics.chartLabels.points")} radius={[0, 12, 12, 0]} barSize={32} filter="url(#bar-glow)">
                  {leaderboardSeries.map((entry, index) => (
                    <Cell 
                      key={`${entry.id}-${index}`} 
                      fill={entry.isFocused ? "#0ea5e9" : CHILD_COLORS[index % CHILD_COLORS.length]} 
                      style={{ transition: "all 0.3s ease" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartShell>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/60 dark:to-slate-950/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-cyan-600" />
            {t("analytics.chartLabels.goal")} 80%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">{t("analytics.cards.completedTasks")}</p>
              <p className="text-xl font-bold">{view.completedTasks}/{view.totalTasks}</p>
            </div>
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">{t("analytics.cards.completionRate")}</p>
              <p className="text-xl font-bold">{view.completionRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">{t("analytics.chartLabels.activeDays")}</p>
              <p className="text-xl font-bold">{activeDays}</p>
            </div>
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">{t("analytics.chartLabels.overdue")}</p>
              <p className="text-xl font-bold">{view.taskStatus.overdue}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
