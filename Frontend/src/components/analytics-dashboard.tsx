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
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
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

const CHILD_COLORS = [
  "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444",
  "#10b981", "#ec4899", "#3b82f6", "#f97316",
]

const STATUS_COLORS = {
  completed: "#22c55e",
  inProgress: "#f59e0b",
  overdue:    "#ef4444",
}

// ── SVG donut for task status ─────────────────────────────────────────────────
function StatusDonut({
  completed, inProgress, overdue,
}: {
  completed: number; inProgress: number; overdue: number
}) {
  const total = completed + inProgress + overdue
  if (!total) return null

  const cx = 72; const cy = 72; const r = 52; const size = 144
  const strokeW = 18

  const segments = [
    { value: completed,  color: STATUS_COLORS.completed  },
    { value: inProgress, color: STATUS_COLORS.inProgress },
    { value: overdue,    color: STATUS_COLORS.overdue    },
  ].filter(s => s.value > 0)

  const GAP_DEG = segments.length > 1 ? 4 : 0
  const totalAngle = 360 - GAP_DEG * segments.length

  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180

  const arc = (startDeg: number, endDeg: number) => {
    const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) }
    const e = { x: cx + r * Math.cos(toRad(endDeg)),   y: cy + r * Math.sin(toRad(endDeg))   }
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  let cursor = -90
  const paths = segments.map(seg => {
    const sweep = (seg.value / total) * totalAngle
    const start = cursor
    const end   = cursor + sweep
    cursor = end + GAP_DEG
    return { ...seg, start, end }
  })

  const pct = Math.round((completed / total) * 100)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {/* background track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="currentColor" strokeOpacity={0.07} strokeWidth={strokeW} />
        {paths.map((p, i) => (
          <path key={i} d={arc(p.start, p.end)}
            fill="none" stroke={p.color} strokeWidth={strokeW}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${p.color}55)` }}
          />
        ))}
      </svg>
      {/* centre label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white leading-none">{pct}%</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">готово</span>
      </div>
    </div>
  )
}

// ── Glassmorphism card shell ──────────────────────────────────────────────────
function ChartShell({
  title, description, badge, className, accent = "cyan", children,
}: {
  title: string; description: string; badge?: string
  className?: string; accent?: "cyan" | "purple" | "amber" | "emerald" | "rose"
  children: React.ReactNode
}) {
  const glowMap = {
    cyan:    "group-hover:shadow-[0_8px_40px_rgba(6,182,212,0.18)]  dark:group-hover:shadow-[0_8px_40px_rgba(6,182,212,0.22)]",
    purple:  "group-hover:shadow-[0_8px_40px_rgba(139,92,246,0.18)] dark:group-hover:shadow-[0_8px_40px_rgba(139,92,246,0.22)]",
    amber:   "group-hover:shadow-[0_8px_40px_rgba(245,158,11,0.18)] dark:group-hover:shadow-[0_8px_40px_rgba(245,158,11,0.22)]",
    emerald: "group-hover:shadow-[0_8px_40px_rgba(16,185,129,0.18)] dark:group-hover:shadow-[0_8px_40px_rgba(16,185,129,0.22)]",
    rose:    "group-hover:shadow-[0_8px_40px_rgba(244,63,94,0.18)]  dark:group-hover:shadow-[0_8px_40px_rgba(244,63,94,0.22)]",
  }
  const blobMap = {
    cyan:    "bg-cyan-400/8 dark:bg-cyan-400/12",
    purple:  "bg-purple-400/8 dark:bg-purple-400/12",
    amber:   "bg-amber-400/8 dark:bg-amber-400/12",
    emerald: "bg-emerald-400/8 dark:bg-emerald-400/12",
    rose:    "bg-rose-400/8 dark:bg-rose-400/12",
  }
  return (
    <Card className={`group relative overflow-hidden transition-all duration-500 shadow-lg
      bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl
      border border-slate-200/80 dark:border-slate-700/60
      ${glowMap[accent]} ${className ?? ""}`}>
      <div className={`absolute -right-16 -top-16 h-56 w-56 rounded-full blur-[80px] transition-all duration-700 ${blobMap[accent]}`} />
      <div className={`absolute -left-16 -bottom-16 h-40 w-40 rounded-full blur-[60px] transition-all duration-700 ${blobMap[accent]}`} />
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[88%]">
              {description}
            </p>
          </div>
          {badge && (
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 font-bold text-[10px] tracking-widest uppercase shrink-0">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pb-6">{children}</CardContent>
    </Card>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  title, value, subtitle, gradient, icon,
}: {
  title: string; value: string; subtitle: string
  gradient: string; icon: React.ReactNode
}) {
  return (
    <Card className={`group relative overflow-hidden border-0 shadow-xl transition-all duration-300
      hover:-translate-y-1 hover:shadow-2xl ${gradient}`}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl
        group-hover:bg-white/25 transition-all duration-500" />
      <CardHeader className="relative z-10 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/75">
            {title}
          </CardTitle>
          <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center
            text-white border border-white/20 group-hover:scale-110 transition-transform duration-300 shadow-lg">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pt-1 pb-4">
        <p className="text-3xl font-black text-white tracking-tight drop-shadow">{value}</p>
        <p className="text-[11px] font-semibold text-white/70 mt-0.5 uppercase tracking-wider">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-white/10 dark:border-white/15
      bg-slate-900/95 dark:bg-black/90 backdrop-blur-xl
      shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-3.5 text-sm min-w-[200px]">
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2.5 pb-2
          border-b border-white/10">{label}</p>
      )}
      <div className="space-y-2">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-300 text-xs font-medium flex-1">{entry.name}</span>
            <span className="font-black text-white text-sm tabular-nums ml-2">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderboardRow({
  rank, name, points, completedTasks, completionPercent, color, isFocused,
}: {
  rank: number; name: string; points: number; completedTasks: number
  completionPercent: number; color: string; isFocused: boolean
}) {
  const medals = ["🥇", "🥈", "🥉"]
  const medal = rank <= 3 ? medals[rank - 1] : `#${rank}`

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200
      ${isFocused
        ? "bg-cyan-500/10 dark:bg-cyan-400/10 ring-1 ring-cyan-500/30 dark:ring-cyan-400/30"
        : "bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
      }`}>
      <div className="w-8 text-center text-lg leading-none shrink-0 font-black">{medal}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</span>
          <span className="text-sm font-black tabular-nums ml-2" style={{ color }}>
            {points.toLocaleString()} <span className="text-[10px] font-semibold opacity-70">pts</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionPercent}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 w-8 text-right">
            {completionPercent}%
          </span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {completedTasks} задач выполнено
        </p>
      </div>
    </div>
  )
}

// ── Status stat row ───────────────────────────────────────────────────────────
function StatusRow({
  icon, label, value, total, color, bgColor,
}: {
  icon: React.ReactNode; label: string; value: number
  total: number; color: string; bgColor: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}
        style={{ color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{label}</span>
          <span className="text-sm font-black tabular-nums ml-2 text-slate-900 dark:text-white">{value}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: color,
                boxShadow: `0 0 8px ${color}66` }} />
          </div>
          <span className="text-[10px] font-bold w-7 text-right shrink-0"
            style={{ color }}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type DashboardView = {
  totalPoints: number; completedTasks: number; totalTasks: number
  completionRate: number; activeChildren: number
  weeklyActivity: DailyActivity[]; weeklyProgress: WeeklyProgress[]
  pointsTrend: PointsTrend[]; difficultyDistribution: CategoryData[]
  taskStatus: { completed: number; inProgress: number; overdue: number }
  focusChildName: string | null
}

function metricDir(v: number) { return v > 0 ? "+" : "" }

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { t } = useI18n()
  const [windowDays, setWindowDays] = useState<number>(30)
  const [selectedChild, setSelectedChild] = useState<string>("all")

  const { analytics, isLoading, isError, error } = useRealAnalytics(windowDays)

  useEffect(() => {
    if (!analytics || selectedChild === "all") return
    const exists = analytics.childrenStats.some(c => c.childId === selectedChild)
    if (!exists) setSelectedChild("all")
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
    const child = analytics.childrenStats.find(c => c.childId === selectedChild)
    if (!child) return null
    const overdue = child.overdueTasks ?? 0
    const inProgress = child.inProgressTasks ?? Math.max(0, child.pendingTasks - overdue)
    const totalTasks = child.completedTasks + child.pendingTasks
    return {
      totalPoints: child.totalPoints,
      completedTasks: child.completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? (child.completedTasks / totalTasks) * 100 : 0,
      activeChildren: totalTasks > 0 ? 1 : 0,
      weeklyActivity: analytics.perChildActivity.find(x => x.childId === selectedChild)?.data ?? [],
      weeklyProgress: analytics.perChildProgress.find(x => x.childId === selectedChild)?.data ?? [],
      pointsTrend: analytics.perChildPointsTrend.find(x => x.childId === selectedChild)?.data ?? [],
      difficultyDistribution: analytics.perChildDifficulty.find(x => x.childId === selectedChild)?.data ?? [],
      taskStatus: { completed: child.completedTasks, inProgress, overdue },
      focusChildName: child.childName,
    }
  }, [analytics, selectedChild])

  const activitySeries = useMemo(() => {
    if (!view) return []
    return view.weeklyActivity.map((p, i, arr) => {
      const sample = arr.slice(Math.max(0, i - 1), i + 2)
      const trend = Math.round((sample.reduce((s, x) => s + x.tasksCompleted, 0) / sample.length) * 10) / 10
      return { ...p, trend }
    })
  }, [view])

  const progressSeries = useMemo(() => {
    if (!view) return []
    return view.weeklyProgress.map(p => ({
      period: p.week,
      completionPercent: p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0,
      completed: p.completed,
      total: p.total,
    }))
  }, [view])

  const pointsSeries = useMemo(() => {
    if (!view) return []
    return view.pointsTrend.map((p, i, arr) => ({
      ...p,
      gain: Math.max(0, p.points - (i > 0 ? arr[i - 1].points : 0)),
    }))
  }, [view])

  const difficultySeries = useMemo(() => view?.difficultyDistribution.filter(x => x.value > 0) ?? [], [view])

  const leaderboardSeries = useMemo(() => {
    if (!analytics) return []
    return [...analytics.childrenStats]
      .map((c, idx) => {
        const total = c.completedTasks + c.pendingTasks
        return {
          id: c.childId,
          childName: c.childName,
          totalPoints: c.totalPoints,
          completionPercent: total > 0 ? Math.round((c.completedTasks / total) * 100) : 0,
          completedTasks: c.completedTasks,
          pendingTasks: c.pendingTasks,
          color: CHILD_COLORS[idx % CHILD_COLORS.length],
          isFocused: selectedChild !== "all" && c.childId === selectedChild,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [analytics, selectedChild])

  const pointsDelta = useMemo(() => {
    if (pointsSeries.length < 2) return 0
    return pointsSeries[pointsSeries.length - 1].points - pointsSeries[0].points
  }, [pointsSeries])

  const completionMomentum = useMemo(() => {
    if (progressSeries.length < 2) return 0
    return progressSeries[progressSeries.length - 1].completionPercent - progressSeries[0].completionPercent
  }, [progressSeries])

  const activeDays = useMemo(() => activitySeries.filter(d => d.tasksCompleted > 0).length, [activitySeries])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t("analyticsDashboard.loading")}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">{t("analyticsDashboard.loadError")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{error?.message}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics || !view) {
    return <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t("analyticsDashboard.noData")}</p>
  }

  const statusTotal = view.taskStatus.completed + view.taskStatus.inProgress + view.taskStatus.overdue

  return (
    <div className="space-y-6">

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl
        bg-gradient-to-br from-slate-900 via-indigo-950 to-cyan-950
        dark:from-slate-950 dark:via-indigo-950/80 dark:to-cyan-950/80
        shadow-2xl border border-white/5">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-indigo-500/15 blur-[80px]" />
        <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />

        <div className="relative z-10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80">
                  {t("analytics.title")}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {selectedChild === "all" ? t("analyticsDashboard.wholeFamily") : view.focusChildName}
              </h2>
              <p className="mt-1 text-sm text-white/50 max-w-lg">
                {t("analytics.chartDescriptions.completionMomentum")}
              </p>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-2xl p-1.5 self-start">
              {PERIOD_OPTIONS.map(days => (
                <button key={days} onClick={() => setWindowDays(days)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all duration-200
                    ${windowDays === days
                      ? "bg-white text-slate-900 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                  {t(`analytics.periodSelection.${days}days`)}
                </button>
              ))}
            </div>
          </div>

          {/* Child filter pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setSelectedChild("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold
                transition-all duration-200 border
                ${selectedChild === "all"
                  ? "bg-white text-slate-900 border-transparent shadow"
                  : "bg-white/8 text-white/70 border-white/15 hover:bg-white/15 hover:text-white"}`}>
              <Users className="h-3.5 w-3.5" />
              {t("analyticsDashboard.wholeFamily")}
            </button>
            {analytics.childrenStats.map((child, idx) => {
              const color = CHILD_COLORS[idx % CHILD_COLORS.length]
              const active = selectedChild === child.childId
              return (
                <button key={child.childId} onClick={() => setSelectedChild(child.childId)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold
                    transition-all duration-200 border
                    ${active
                      ? "bg-white/15 text-white border-white/30 shadow"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/12 hover:text-white"}`}
                  style={active ? { borderColor: `${color}60`, backgroundColor: `${color}20`, color: "white" } : {}}>
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {child.childName}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Metric cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title={t("analytics.cards.totalPoints")}
          value={view.totalPoints.toLocaleString()}
          subtitle={`${metricDir(pointsDelta)}${pointsDelta.toLocaleString()} pts`}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          icon={<Star className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.completedTasks")}
          value={view.completedTasks.toLocaleString()}
          subtitle={`из ${view.totalTasks} задач`}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          icon={<Target className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.completionRate")}
          value={`${view.completionRate.toFixed(0)}%`}
          subtitle={`${metricDir(completionMomentum)}${completionMomentum.toFixed(1)}pp`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title={t("analytics.cards.activeChildren")}
          value={view.activeChildren.toLocaleString()}
          subtitle={`${activeDays} активных дней`}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon={<Zap className="h-4 w-4" />}
        />
      </div>

      {/* ── AI insights ─────────────────────────────────────────────────────── */}
      <AiAnalyticsInsights analytics={analytics as AnalyticsData} windowDays={windowDays} />

      {/* ── Activity pulse — full width ──────────────────────────────────────── */}
      <ChartShell
        title={t("analytics.charts.activityPulse")}
        description={t("analytics.chartDescriptions.activityPulse")}
        badge={`${windowDays}д`}
        accent="cyan"
      >
        {activitySeries.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-400">{t("analyticsDashboard.noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={activitySeries} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ag-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
                <filter id="ag-glow">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.07} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="p" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dx={-6} width={32} />
              <YAxis yAxisId="t" orientation="right" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dx={6} width={28} />
              <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "currentColor", opacity: 0.04 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 14, color: "currentColor", opacity: 0.75 }} />
              <Bar yAxisId="p" dataKey="pointsEarned" name={t("analytics.chartLabels.points")}
                fill="url(#ag-bar)" radius={[6, 6, 0, 0]} barSize={22} />
              <Line yAxisId="t" type="monotone" dataKey="tasksCompleted" name={t("analytics.chartLabels.tasks")}
                stroke="#f97316" strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#f97316" }}
                activeDot={{ r: 7, strokeWidth: 3 }} filter="url(#ag-glow)" />
              <Line yAxisId="t" type="monotone" dataKey="trend" name={t("analytics.chartLabels.trend")}
                stroke="#10b981" strokeDasharray="6 5" strokeWidth={2.5} dot={false} filter="url(#ag-glow)" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      {/* ── Middle row: Status + Leaderboard ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* ── Task Status — custom SVG donut + stat rows ── */}
        <ChartShell
          title={t("analytics.charts.taskStatusDonut")}
          description={t("analytics.chartDescriptions.taskStatusDonut")}
          badge={statusTotal > 0 ? `${statusTotal} задач` : undefined}
          accent="purple"
        >
          {statusTotal === 0 ? (
            <p className="py-14 text-center text-sm text-slate-400">{t("analyticsDashboard.noData")}</p>
          ) : (
            <div className="flex flex-col items-center gap-5 pt-2">
              {/* SVG donut */}
              <StatusDonut
                completed={view.taskStatus.completed}
                inProgress={view.taskStatus.inProgress}
                overdue={view.taskStatus.overdue}
              />

              {/* Stat rows */}
              <div className="w-full space-y-3">
                <StatusRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label={t("analytics.chartLabels.completed")}
                  value={view.taskStatus.completed}
                  total={statusTotal}
                  color={STATUS_COLORS.completed}
                  bgColor="bg-emerald-500/10 dark:bg-emerald-500/15"
                />
                <StatusRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label={t("analytics.chartLabels.inProgress")}
                  value={view.taskStatus.inProgress}
                  total={statusTotal}
                  color={STATUS_COLORS.inProgress}
                  bgColor="bg-amber-500/10 dark:bg-amber-500/15"
                />
                <StatusRow
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label={t("analytics.chartLabels.overdue")}
                  value={view.taskStatus.overdue}
                  total={statusTotal}
                  color={STATUS_COLORS.overdue}
                  bgColor="bg-rose-500/10 dark:bg-rose-500/15"
                />
              </div>
            </div>
          )}
        </ChartShell>

        {/* ── Children leaderboard ── */}
        <ChartShell
          title={t("analytics.charts.childrenLeaderboard")}
          description={t("analytics.chartDescriptions.childrenLeaderboard")}
          badge={leaderboardSeries.length > 0 ? `${leaderboardSeries.length} детей` : undefined}
          accent="cyan"
        >
          {leaderboardSeries.length === 0 ? (
            <div className="py-10 text-center">
              <Trophy className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{t("analyticsDashboard.noData")}</p>
            </div>
          ) : (
            <div className="space-y-2.5 mt-2">
              {leaderboardSeries.map((child, idx) => (
                <LeaderboardRow
                  key={child.id}
                  rank={idx + 1}
                  name={child.childName}
                  points={child.totalPoints}
                  completedTasks={child.completedTasks}
                  completionPercent={child.completionPercent}
                  color={child.color}
                  isFocused={child.isFocused}
                />
              ))}
            </div>
          )}
        </ChartShell>
      </div>

      {/* ── Bottom row: Progress + Difficulty ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Completion momentum */}
        <ChartShell
          title={t("analytics.charts.completionMomentum")}
          description={t("analytics.chartDescriptions.completionMomentum")}
          badge={`${view.completionRate.toFixed(0)}%`}
          accent="emerald"
        >
          {progressSeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-slate-400">{t("analyticsDashboard.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={progressSeries} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag-comp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#10b981" stopOpacity={0.55} />
                    <stop offset="85%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.07} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                  axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                  axisLine={false} tickLine={false} dx={-6} width={30} />
                <Tooltip content={<AnalyticsTooltip />}
                  cursor={{ stroke: "currentColor", strokeWidth: 1, strokeOpacity: 0.12, strokeDasharray: "4 4" }} />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="5 4" strokeWidth={1.5}
                  label={{ position: "insideTopLeft", value: "Цель 80%", fill: "#f59e0b", fontSize: 11, fontWeight: "bold" }} />
                <Area type="monotone" dataKey="completionPercent"
                  name={t("analytics.chartLabels.completionPercent")}
                  stroke="#10b981" strokeWidth={3} fill="url(#ag-comp)"
                  activeDot={{ r: 7, strokeWidth: 3, stroke: "#10b981", fill: "white" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartShell>

        {/* Difficulty donut */}
        <ChartShell
          title={t("analytics.charts.difficultyRadar")}
          description={t("analytics.chartDescriptions.difficultyRadar")}
          badge={difficultySeries.length > 0 ? `${difficultySeries.length} уровней` : undefined}
          accent="amber"
        >
          {difficultySeries.length === 0 ? (
            <p className="py-14 text-center text-sm text-slate-400">{t("analyticsDashboard.noData")}</p>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="ag-diff-shadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={0.25} />
                    </filter>
                  </defs>
                  <Pie data={difficultySeries} dataKey="value" nameKey="name"
                    innerRadius={60} outerRadius={96} paddingAngle={4}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={2}>
                    {difficultySeries.map((e, i) => (
                      <Cell key={i} fill={e.color} filter="url(#ag-diff-shadow)" style={{ outline: "none" }} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {difficultySeries.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full px-2.5 py-1
                    bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                    {e.name}
                    <span className="text-slate-400 dark:text-slate-500 font-semibold">({e.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartShell>
      </div>

      {/* ── Points growth — full width ───────────────────────────────────────── */}
      <ChartShell
        title={t("analytics.charts.pointsGrowth")}
        description={t("analytics.chartDescriptions.pointsGrowth")}
        badge={`${metricDir(pointsDelta)}${pointsDelta}`}
        accent="amber"
      >
        {pointsSeries.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-400">{t("analyticsDashboard.noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={pointsSeries} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ag-pts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.65} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ag-gain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.07} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="total" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dx={-6} width={32} />
              <YAxis yAxisId="gain" orientation="right" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }}
                axisLine={false} tickLine={false} dx={6} width={28} />
              <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "currentColor", opacity: 0.04 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 14, color: "currentColor", opacity: 0.75 }} />
              <Bar yAxisId="gain" dataKey="gain" name={t("analytics.chartLabels.points")}
                fill="url(#ag-gain)" radius={[6, 6, 0, 0]} barSize={20} />
              <Area yAxisId="total" type="monotone" dataKey="points" name={t("analytics.chartLabels.trend")}
                stroke="#06b6d4" strokeWidth={3} fill="url(#ag-pts)"
                activeDot={{ r: 7, strokeWidth: 3, stroke: "#06b6d4", fill: "white" }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartShell>

      {/* ── Summary strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t("analytics.cards.completedTasks"), value: `${view.completedTasks}/${view.totalTasks}`, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
          { label: t("analytics.cards.completionRate"),  value: `${view.completionRate.toFixed(1)}%`,        icon: <TrendingUp className="h-4 w-4 text-cyan-500" /> },
          { label: t("analytics.chartLabels.activeDays"), value: `${activeDays}д`,                           icon: <Activity className="h-4 w-4 text-violet-500" /> },
          { label: t("analytics.chartLabels.overdue"),    value: `${view.taskStatus.overdue}`,               icon: <AlertTriangle className="h-4 w-4 text-rose-500" /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border
            bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/60
            backdrop-blur-sm p-3.5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{s.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
