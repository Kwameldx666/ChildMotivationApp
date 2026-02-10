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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
} from "recharts"
import { useI18n } from "@/i18n/provider"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import {
  ChevronLeft, ChevronRight, Filter, Loader2, Download, FileDown,
  Image as ImageIcon, FileText, TrendingUp, Trophy, Target, Zap, Star, Award,
} from "lucide-react"
import { getTaskAnalytics, type AnalyticsData } from "@/services/analytics-service"

/* ── Shared SVG filters (glow / soft-shadow) injected once ── */
function SvgFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#8b5cf6" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#10b981" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#f59e0b" floodOpacity="0.45" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>
    </svg>
  )
}

/* ── Animated number counter ── */
function AnimatedCounter({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (end === start) { setDisplay(end); return }
    const duration = 900
    const step = Math.max(1, Math.floor(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span className={className}>{display.toLocaleString()}{suffix}</span>
}

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

  const chartsConfig = [
    { id: "activityPulse", titleKey: "analytics.charts.activityPulse" },
    { id: "childrenLeaderboard", titleKey: "analytics.charts.childrenLeaderboard" },
    { id: "difficultyRadar", titleKey: "analytics.charts.difficultyRadar" },
    { id: "completionMomentum", titleKey: "analytics.charts.completionMomentum" },
    { id: "taskStatusDonut", titleKey: "analytics.charts.taskStatusDonut" },
    { id: "pointsGrowth", titleKey: "analytics.charts.pointsGrowth" },
  ]

  /* ── Glassmorphism tooltip ── */
  const GlassTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 text-sm min-w-[180px]">
        <p className="font-bold text-foreground mb-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60 text-xs uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2.5 py-1">
            <span className="w-3 h-3 rounded-md shrink-0 shadow-sm" style={{ backgroundColor: entry.color || entry.fill, boxShadow: `0 0 8px ${entry.color || entry.fill}40` }} />
            <span className="text-muted-foreground text-xs">{entry.name}</span>
            <span className="font-bold ml-auto text-foreground">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  /* ── Vibrant color palette ── */
  const NEON = {
    purple: ['#c084fc', '#a855f7', '#7c3aed', '#6d28d9'],
    blue: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'],
    emerald: ['#6ee7b7', '#34d399', '#10b981', '#059669'],
    amber: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706'],
    rose: ['#fda4af', '#fb7185', '#f43f5e', '#e11d48'],
    cyan: ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2'],
    orange: ['#fdba74', '#fb923c', '#f97316', '#ea580c'],
  }

  /* ── Custom dot with glow ring ── */
  const GlowDot = ({ cx, cy, fill, glowColor }: any) => (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={glowColor || fill} opacity={0.15} />
      <circle cx={cx} cy={cy} r={6} fill="#fff" stroke={fill} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={2.5} fill={fill} />
    </g>
  )

  const renderChart = (index: number) => {
    if (!analytics) return null

    const filteredChildrenStats =
      selectedChild === "all"
        ? analytics.childrenStats
        : analytics.childrenStats.filter(c => c.childId === selectedChild)

    const filteredTaskStatus =
      selectedChild === "all"
        ? analytics.taskStatus
        : (() => {
            const child = analytics.childrenStats.find(c => c.childId === selectedChild)
            if (!child) return analytics.taskStatus
            return { completed: child.completedTasks, inProgress: child.pendingTasks, overdue: 0 }
          })()

    switch (index) {
      /* ━━━━━━━━━━━━━━ 0 ▸ ACTIVITY PULSE ━━━━━━━━━━━━━━ */
      case 0:
        return (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={analytics.weeklyActivity} barGap={6} barSize={windowDays <= 14 ? 28 : 18}>
              <defs>
                <linearGradient id="neon-bar-tasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                  <stop offset="40%" stopColor="#a855f7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="neon-bar-points" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity={1} />
                  <stop offset="40%" stopColor="#fbbf24" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                </linearGradient>
                <filter id="bar-glow-p" x="-20%" y="-10%" width="140%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.35" />
                </filter>
                <filter id="bar-glow-a" x="-20%" y="-10%" width="140%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.35" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dx={-4} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(139,92,246,0.04)', radius: 8 }} />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value: string) => <span className="text-xs font-medium ml-1">{value}</span>}
              />
              <Bar
                dataKey="tasksCompleted"
                fill="url(#neon-bar-tasks)"
                radius={[10, 10, 3, 3]}
                name={t('analytics.chartLabels.tasks')}
                animationDuration={1200}
                animationEasing="ease-out"
                style={{ filter: 'url(#bar-glow-p)' }}
              />
              <Bar
                dataKey="pointsEarned"
                fill="url(#neon-bar-points)"
                radius={[10, 10, 3, 3]}
                name={t('analytics.chartLabels.points')}
                animationDuration={1200}
                animationEasing="ease-out"
                style={{ filter: 'url(#bar-glow-a)' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      /* ━━━━━━━━━━━━━━ 1 ▸ CHILDREN LEADERBOARD ━━━━━━━━━━━━━━ */
      case 1: {
        const childGradients = [
          { from: '#a78bfa', to: '#7c3aed', shadow: '#8b5cf6' },
          { from: '#67e8f9', to: '#0891b2', shadow: '#06b6d4' },
          { from: '#fbbf24', to: '#d97706', shadow: '#f59e0b' },
          { from: '#fb7185', to: '#e11d48', shadow: '#f43f5e' },
          { from: '#34d399', to: '#059669', shadow: '#10b981' },
        ]
        const childData = filteredChildrenStats.map((c, idx) => ({
          name: c.childName,
          points: c.totalPoints,
          completed: c.completedTasks,
          pending: c.pendingTasks,
          gradientIdx: idx % childGradients.length,
        })).sort((a, b) => b.points - a.points)
        if (!childData.length) return <p className="text-center text-muted-foreground py-12">{t('analyticsDashboard.noData')}</p>
        const maxPoints = Math.max(...childData.map(d => d.points), 1)
        return (
          <div className="space-y-4 py-2">
            {childData.map((child, idx) => {
              const g = childGradients[child.gradientIdx]
              const pct = Math.round((child.points / maxPoints) * 100)
              return (
                <div key={idx} className="group relative">
                  <div className="flex items-center gap-4">
                    {/* Rank badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                        boxShadow: `0 4px 14px ${g.shadow}40`,
                      }}
                    >
                      {idx === 0 ? <Trophy className="w-5 h-5" /> : `#${idx + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm truncate">{child.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-sm">{child.points.toLocaleString()}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${g.from}, ${g.to})`,
                            boxShadow: `0 0 12px ${g.shadow}50`,
                          }}
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{t('analytics.chartLabels.completed')}: <b className="text-emerald-600">{child.completed}</b></span>
                        <span>{t('analytics.chartLabels.pending')}: <b className="text-amber-600">{child.pending}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      /* ━━━━━━━━━━━━━━ 2 ▸ DIFFICULTY RADAR ━━━━━━━━━━━━━━ */
      case 2: {
        const radarData = analytics.difficultyDistribution
        if (!radarData.length) return <p className="text-center text-muted-foreground py-12">{t('analyticsDashboard.noData')}</p>
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <defs>
                <linearGradient id="radar-neon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="radar-stroke-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feFlood floodColor="#8b5cf6" floodOpacity="0.3" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <PolarGrid stroke="rgba(148,163,184,0.2)" gridType="polygon" />
              <PolarAngleAxis
                dataKey="name"
                tick={({ payload, x, y, textAnchor }: any) => (
                  <text x={x} y={y} textAnchor={textAnchor} fill="#64748b" fontSize={12} fontWeight={600}>
                    {payload.value}
                  </text>
                )}
              />
              <PolarRadiusAxis tick={false} axisLine={false} />
              {/* Ghost outer layer */}
              <Radar
                dataKey="value"
                stroke="#c084fc"
                fill="none"
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />
              {/* Main filled radar */}
              <Radar
                name={t('analytics.chartLabels.tasks')}
                dataKey="value"
                stroke="url(#radar-stroke-grad)"
                fill="url(#radar-neon)"
                strokeWidth={3}
                dot={({ cx, cy }: any) => (
                  <g key={`${cx}-${cy}`}>
                    <circle cx={cx} cy={cy} r={8} fill="#8b5cf6" opacity={0.15} />
                    <circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#8b5cf6" strokeWidth={2.5} />
                    <circle cx={cx} cy={cy} r={2} fill="#8b5cf6" />
                  </g>
                )}
                animationDuration={1200}
                style={{ filter: 'url(#radar-glow)' }}
              />
              <Tooltip content={<GlassTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )
      }

      /* ━━━━━━━━━━━━━━ 3 ▸ COMPLETION DYNAMICS ━━━━━━━━━━━━━━ */
      case 3: {
        const momentumData = analytics.weeklyProgress.map(w => ({
          week: w.week,
          completed: w.completed,
          total: w.total,
          rate: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
        }))
        return (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={momentumData}>
              <defs>
                <linearGradient id="dyn-area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="dyn-total-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="rate-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <filter id="line-glow-red" x="-20%" y="-30%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.4" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<GlassTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value: string) => <span className="text-xs font-medium ml-1">{value}</span>}
              />
              <Area yAxisId="left" type="monotone" dataKey="total" stroke="#60a5fa" strokeWidth={2} fill="url(#dyn-total-fill)" name={t('analytics.chartLabels.total')} animationDuration={1000} />
              <Area yAxisId="left" type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} fill="url(#dyn-area-fill)" name={t('analytics.chartLabels.completed')} animationDuration={1000} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                stroke="url(#rate-line-grad)"
                strokeWidth={3.5}
                dot={(props: any) => <GlowDot {...props} fill="#ef4444" glowColor="#ef4444" />}
                activeDot={{ r: 8, fill: '#ef4444', stroke: '#fff', strokeWidth: 3 }}
                name={t('analytics.chartLabels.completionRate')}
                animationDuration={1400}
                style={{ filter: 'url(#line-glow-red)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )
      }

      /* ━━━━━━━━━━━━━━ 4 ▸ TASK STATUS DONUT ━━━━━━━━━━━━━━ */
      case 4: {
        const total = filteredTaskStatus.completed + filteredTaskStatus.inProgress + filteredTaskStatus.overdue
        const statusData = [
          { name: t('analytics.chartLabels.completed'), value: filteredTaskStatus.completed, color: '#10b981', gradient: 'donut-g' },
          { name: t('analytics.chartLabels.inProgress'), value: filteredTaskStatus.inProgress, color: '#f59e0b', gradient: 'donut-a' },
          { name: t('analytics.chartLabels.overdue'), value: filteredTaskStatus.overdue, color: '#ef4444', gradient: 'donut-r' },
        ].filter(d => d.value > 0)
        const pct = total > 0 ? Math.round((filteredTaskStatus.completed / total) * 100) : 0
        return (
          <div className="relative">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <defs>
                  <linearGradient id="donut-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="donut-a" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="donut-r" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <filter id="donut-shadow" x="-15%" y="-15%" width="130%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.15" />
                  </filter>
                </defs>
                {/* Decorative thin outer ring */}
                <Pie
                  data={[{ value: 1 }]}
                  cx="50%" cy="50%"
                  innerRadius={128} outerRadius={132}
                  fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={1}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  <Cell fill="rgba(148,163,184,0.08)" />
                </Pie>
                {/* Main donut */}
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={80} outerRadius={122}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={12}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  style={{ filter: 'url(#donut-shadow)' }}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={`url(#${entry.gradient})`} stroke="none" />
                  ))}
                </Pie>
                {/* Decorative thin inner ring */}
                <Pie
                  data={[{ value: 1 }]}
                  cx="50%" cy="50%"
                  innerRadius={72} outerRadius={75}
                  fill="none"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  <Cell fill="rgba(148,163,184,0.06)" />
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative">
                <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 bg-clip-text text-transparent drop-shadow-sm">
                  <AnimatedCounter value={pct} suffix="%" />
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">{t('analytics.chartLabels.completed')}</span>
            </div>
            {/* Legend pills */}
            <div className="flex justify-center gap-4 -mt-4">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}40` }} />
                  <span className="text-xs text-muted-foreground">{d.name}: <b>{d.value}</b></span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      /* ━━━━━━━━━━━━━━ 5 ▸ POINTS GROWTH ━━━━━━━━━━━━━━ */
      case 5:
        return (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={analytics.pointsTrend}>
              <defs>
                <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity={0.5} />
                  <stop offset="30%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="70%" stopColor="#8b5cf6" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="growth-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <filter id="area-glow" x="-10%" y="-20%" width="120%" height="150%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.3" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '6 4' }} />
              <Area
                type="monotone"
                dataKey="points"
                stroke="url(#growth-stroke)"
                strokeWidth={3.5}
                fill="url(#growth-fill)"
                dot={(props: any) => <GlowDot {...props} fill="#8b5cf6" glowColor="#a855f7" />}
                activeDot={{ r: 9, fill: '#7c3aed', stroke: '#fff', strokeWidth: 3.5 }}
                name={t('analytics.chartLabels.points')}
                animationDuration={1400}
                animationEasing="ease-out"
                style={{ filter: 'url(#area-glow)' }}
              />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">{t('analyticsDashboard.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={loadAnalytics}>
          {t('common.retry') || 'Retry'}
        </Button>
      </div>
    )
  }

  if (!analytics) return null

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
        {/* ── Ultra-premium stat cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Points */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet-50 via-purple-50/50 to-white dark:from-violet-950/40 dark:via-purple-950/20 dark:to-background">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-violet-400/20 to-purple-600/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.cards.totalPoints')}</CardTitle>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Star className="w-4.5 h-4.5 text-white fill-white/80" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 bg-clip-text text-transparent">
                <AnimatedCounter value={analytics.totalPoints} />
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{t('analytics.cards.earnedForPeriod')}</p>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white dark:from-blue-950/40 dark:via-sky-950/20 dark:to-background">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-sky-600/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-blue-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.cards.completedTasks')}</CardTitle>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Target className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                <AnimatedCounter value={analytics.completedTasks} />
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{t('analytics.cards.outOf', { total: analytics.totalTasks })}</p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 via-green-50/50 to-white dark:from-emerald-950/40 dark:via-green-950/20 dark:to-background">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-600/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.cards.completionRate')}</CardTitle>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <TrendingUp className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-500 bg-clip-text text-transparent">
                <AnimatedCounter value={parseFloat(analytics.completionRate.toFixed(1))} suffix="%" decimals={1} />
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{t('analytics.cards.successRate')}</p>
            </CardContent>
          </Card>

          {/* Active Children */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-600/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('analytics.cards.activeChildren')}</CardTitle>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Zap className="w-4.5 h-4.5 text-white fill-white/80" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={analytics.activeChildren} />
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{t('analytics.cards.participatingInTasks')}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Main chart card ── */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <SvgFilters />
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-900/50 dark:to-background border-b border-gray-100/80 dark:border-gray-800/50">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                {t(chartsConfig[currentChart].titleKey)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 ml-4">
                {t('analyticsDashboard.chartOf', { current: currentChart + 1, total: chartsConfig.length })}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={prevChart} className="rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextChart} className="rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Фильтр по детям */}
            {analytics.childrenStats.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedChild === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setSelectedChild("all")}
                >
                  {t('analyticsDashboard.wholeFamily')}
                </Button>
                {analytics.childrenStats.map((child) => (
                  <Button
                    key={child.childId}
                    variant={selectedChild === child.childId ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl text-xs"
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

        {/* ── Quick switch ── */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" />
              {t('analyticsDashboard.quickSwitch')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {chartsConfig.map((chart, idx) => (
                <Button
                  key={chart.id}
                  variant={currentChart === idx ? "default" : "outline"}
                  size="sm"
                  className={`text-xs rounded-xl transition-all duration-200 ${
                    currentChart === idx
                      ? 'shadow-md shadow-violet-500/20'
                      : 'hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm'
                  }`}
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
