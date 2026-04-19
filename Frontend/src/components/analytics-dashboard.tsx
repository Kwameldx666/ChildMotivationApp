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
    <Card className={`border-0 shadow-lg bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-900/70 dark:to-slate-950/30 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
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
    <Card className={`relative overflow-hidden border-0 shadow-lg ${accent}`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white/90">{title}</CardTitle>
          <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs text-white/85 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-700/70 shadow-xl px-3 py-2 text-xs min-w-[180px]">
      <p className="font-semibold mb-1.5 text-slate-800 dark:text-slate-100">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
            <span className="ml-auto font-semibold text-slate-900 dark:text-slate-100">
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-white border-white/30">{t("analyticsDashboard.wholeFamily")}</Badge>
            <Button
              size="sm"
              variant={selectedChild === "all" ? "secondary" : "ghost"}
              className={selectedChild === "all" ? "text-slate-900" : "text-white hover:bg-white/20 hover:text-white"}
              onClick={() => setSelectedChild("all")}
            >
              {t("analyticsDashboard.wholeFamily")}
            </Button>
            {analytics.childrenStats.map((child) => (
              <Button
                key={child.childId}
                size="sm"
                variant={selectedChild === child.childId ? "secondary" : "ghost"}
                className={selectedChild === child.childId ? "text-slate-900" : "text-white hover:bg-white/20 hover:text-white"}
                onClick={() => setSelectedChild(child.childId)}
              >
                {child.childName}
              </Button>
            ))}
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
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={activitySeries} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="tasks" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <YAxis yAxisId="points" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="points" dataKey="pointsEarned" name={t("analytics.chartLabels.points")} fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Line yAxisId="tasks" type="monotone" dataKey="tasksCompleted" name={t("analytics.chartLabels.tasks")} stroke="#f97316" strokeWidth={2.8} dot={{ r: 3 }} />
                <Line yAxisId="tasks" type="monotone" dataKey="trend" name={t("analytics.chartLabels.trend")} stroke="#16a34a" strokeDasharray="6 4" strokeWidth={2.2} dot={false} />
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
            <ResponsiveContainer width="100%" height={315}>
              <AreaChart data={progressSeries} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="completion-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<AnalyticsTooltip />} />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="6 4" />
                <Area
                  type="monotone"
                  dataKey="completionPercent"
                  name={t("analytics.chartLabels.completionPercent")}
                  stroke="#16a34a"
                  strokeWidth={2.8}
                  fill="url(#completion-gradient)"
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
            <div className="relative">
              <ResponsiveContainer width="100%" height={315}>
                <PieChart>
                  <Pie data={statusSeries} dataKey="value" nameKey="name" innerRadius={78} outerRadius={115} paddingAngle={4}>
                    {statusSeries.map((slice, index) => (
                      <Cell key={`${slice.name}-${index}`} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{completedShare}%</span>
                <span className="text-xs text-muted-foreground">{t("analytics.chartLabels.completed")}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2 text-center">
                  <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-muted-foreground mt-1">{t("analytics.chartLabels.completed")}</p>
                  <p className="text-sm font-bold">{view.taskStatus.completed}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-center">
                  <Clock3 className="mx-auto h-4 w-4 text-amber-600" />
                  <p className="text-xs text-muted-foreground mt-1">{t("analytics.chartLabels.inProgress")}</p>
                  <p className="text-sm font-bold">{view.taskStatus.inProgress}</p>
                </div>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-2 text-center">
                  <AlertTriangle className="mx-auto h-4 w-4 text-rose-600" />
                  <p className="text-xs text-muted-foreground mt-1">{t("analytics.chartLabels.overdue")}</p>
                  <p className="text-sm font-bold">{view.taskStatus.overdue}</p>
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
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={pointsSeries} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="points-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="total" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <YAxis yAxisId="gain" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="gain" dataKey="gain" name={t("analytics.chartLabels.points")} fill="#f97316" radius={[5, 5, 0, 0]} />
                <Area yAxisId="total" type="monotone" dataKey="points" name={t("analytics.chartLabels.trend")} stroke="#0891b2" strokeWidth={2.8} fill="url(#points-gradient)" />
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
            <ResponsiveContainer width="100%" height={315}>
              <PieChart>
                <Pie data={difficultySeries} dataKey="value" nameKey="name" innerRadius={62} outerRadius={112} paddingAngle={3}>
                  {difficultySeries.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
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
            <ResponsiveContainer width="100%" height={315}>
              <BarChart data={leaderboardSeries} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" horizontal={false} stroke="rgba(148,163,184,0.35)" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="childName" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={86} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Bar dataKey="totalPoints" name={t("analytics.chartLabels.points")} radius={[0, 8, 8, 0]}>
                  {leaderboardSeries.map((entry, index) => (
                    <Cell key={`${entry.id}-${index}`} fill={entry.isFocused ? "#0ea5e9" : CHILD_COLORS[index % CHILD_COLORS.length]} />
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
