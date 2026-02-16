"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts"
import { useI18n } from "@/i18n/provider"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import {
  ChevronLeft, ChevronRight, Filter, Loader2, Download, FileDown,
  Image as ImageIcon, FileText, TrendingUp, Trophy, Target, Zap, Star, Award,
  Flame, CalendarDays, Info, Shield, Swords, Crown, Check, Users, CheckSquare, Square,
} from "lucide-react"
import { getTaskAnalytics, type AnalyticsData } from "@/services/analytics-service"
import { generateMockAnalytics } from "@/services/analytics-mock"

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
function AnimatedCounter({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string; decimals?: number }) {
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

/* ── Per-chart time range control ── */
function ChartTimeFilter({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const { t } = useI18n()
  const opts = [
    { label: t('analytics.periodSelection.7days'), days: 7 },
    { label: t('analytics.periodSelection.30days'), days: 30 },
    { label: t('analytics.periodSelection.90days'), days: 90 },
  ]
  return (
    <div className="flex items-center gap-1.5 mb-4">
      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
      <div className="flex gap-1 bg-gray-100/80 dark:bg-gray-800/60 rounded-lg p-0.5">
        {opts.map(o => (
          <button
            key={o.days}
            onClick={() => onChange(value === o.days ? null : o.days)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              value === o.days
                ? 'bg-white dark:bg-gray-700 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value && (
        <button onClick={() => onChange(null)} className="text-[10px] text-muted-foreground hover:text-foreground ml-1">✕</button>
      )}
    </div>
  )
}

/* ══ DEV: set to true to use mock data for charts ══ */
const USE_MOCK = false

/* ── Child color palette ── */
const CHILD_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6']

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

  /* ── Export dialog state ── */
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportChildFilter, setExportChildFilter] = useState("all")
  const [exportChartSelection, setExportChartSelection] = useState<boolean[]>([])
  const exportTitleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [windowDays])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      if (USE_MOCK) {
        // Simulate small network delay
        await new Promise(r => setTimeout(r, 400))
        setAnalytics(generateMockAnalytics(windowDays))
      } else {
        const data = await getTaskAnalytics(windowDays)
        setAnalytics(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('analyticsDashboard.loadError'))
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const chartsConfig = [
    { id: "activityPulse", titleKey: "analytics.charts.activityPulse", descKey: "analytics.chartDescriptions.activityPulse" },
    { id: "childrenLeaderboard", titleKey: "analytics.charts.childrenLeaderboard", descKey: "analytics.chartDescriptions.childrenLeaderboard" },
    { id: "difficultyRadar", titleKey: "analytics.charts.difficultyRadar", descKey: "analytics.chartDescriptions.difficultyRadar" },
    { id: "completionMomentum", titleKey: "analytics.charts.completionMomentum", descKey: "analytics.chartDescriptions.completionMomentum" },
    { id: "taskStatusDonut", titleKey: "analytics.charts.taskStatusDonut", descKey: "analytics.chartDescriptions.taskStatusDonut" },
    { id: "pointsGrowth", titleKey: "analytics.charts.pointsGrowth", descKey: "analytics.chartDescriptions.pointsGrowth" },
    { id: "streakHeatmap", titleKey: "analytics.charts.streakHeatmap", descKey: "analytics.chartDescriptions.streakHeatmap" },
  ]

  /* ── Per-chart time override (null = use global) ── */
  const [chartTimeOverride, setChartTimeOverride] = useState<Record<number, number | null>>({})
  /* Cached data for per-chart overrides */
  const [overrideData, setOverrideData] = useState<Record<number, AnalyticsData>>({})
  const [overrideLoading, setOverrideLoading] = useState<Record<number, boolean>>({})

  const handleChartTimeChange = async (chartIdx: number, days: number | null) => {
    setChartTimeOverride(prev => ({ ...prev, [chartIdx]: days }))
    if (days && days !== windowDays) {
      setOverrideLoading(prev => ({ ...prev, [chartIdx]: true }))
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 200))
          setOverrideData(prev => ({ ...prev, [chartIdx]: generateMockAnalytics(days) }))
        } else {
          const data = await getTaskAnalytics(days)
          setOverrideData(prev => ({ ...prev, [chartIdx]: data }))
        }
      } catch(e) { console.error(e) }
      setOverrideLoading(prev => ({ ...prev, [chartIdx]: false }))
    }
  }

  /* Get effective data for a chart (override or global) */
  const getChartData = (chartIdx: number): AnalyticsData | null => {
    const override = chartTimeOverride[chartIdx]
    if (override && override !== windowDays && overrideData[chartIdx]) return overrideData[chartIdx]
    return analytics
  }

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

  const renderChart = (index: number) => {
    const chartData = getChartData(index)
    if (!chartData) return null
    const isOverrideLoading = overrideLoading[index]
    if (isOverrideLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

    const filteredChildrenStats =
      selectedChild === "all"
        ? chartData.childrenStats
        : chartData.childrenStats.filter(c => c.childId === selectedChild)

    const filteredTaskStatus =
      selectedChild === "all"
        ? chartData.taskStatus
        : (() => {
            const child = chartData.childrenStats.find(c => c.childId === selectedChild)
            if (!child) return chartData.taskStatus
            return { completed: child.completedTasks, inProgress: child.pendingTasks, overdue: 0 }
          })()

    // Per-child data helpers
    const filteredActivity =
      selectedChild === "all"
        ? chartData.weeklyActivity
        : (chartData.perChildActivity?.find(c => c.childId === selectedChild)?.data ?? chartData.weeklyActivity)

    const filteredDifficulty =
      selectedChild === "all"
        ? chartData.difficultyDistribution
        : (chartData.perChildDifficulty?.find(c => c.childId === selectedChild)?.data ?? chartData.difficultyDistribution)

    const filteredProgress =
      selectedChild === "all"
        ? chartData.weeklyProgress
        : (chartData.perChildProgress?.find(c => c.childId === selectedChild)?.data ?? chartData.weeklyProgress)

    const filteredPointsTrend =
      selectedChild === "all"
        ? chartData.pointsTrend
        : (chartData.perChildPointsTrend?.find(c => c.childId === selectedChild)?.data ?? chartData.pointsTrend)

    const chartTimeControl = (
      <ChartTimeFilter value={chartTimeOverride[index] ?? null} onChange={(v) => handleChartTimeChange(index, v)} />
    )

    switch (index) {
      /* ━━━━━━━━━━━━━━ 0 ▸ ACTIVITY PULSE — area + trend line ━━━━━━━━━━━━━━ */
      case 0: {
        // Convert to area chart with smooth gradient + points overlay + moving average line
        const actData = filteredActivity.map((d, i, arr) => {
          // 3-point moving average for the trend
          const window = arr.slice(Math.max(0, i - 1), i + 2)
          const trend = Math.round(window.reduce((s, x) => s + x.tasksCompleted, 0) / window.length * 10) / 10
          return { ...d, trend }
        })
        return (
          <>
            {chartTimeControl}
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={actData} barGap={4}>
                <defs>
                  <linearGradient id="activity-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="activity-points-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                  </linearGradient>
                  <filter id="trend-line-glow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.5" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(139,92,246,0.04)' }} />
                <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(v: string) => <span className="text-xs font-medium ml-1">{v}</span>} />

                {/* Tasks area */}
                <Area yAxisId="left" type="monotone" dataKey="tasksCompleted" stroke="#a855f7" strokeWidth={2.5}
                  fill="url(#activity-area-gradient)" name={t('analytics.chartLabels.tasks')} animationDuration={1000}
                  dot={({ cx, cy }: any) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#a855f7" strokeWidth={2} /><circle cx={cx} cy={cy} r={2} fill="#a855f7" /></g>}
                />
                {/* Points bars overlaid */}
                <Bar yAxisId="right" dataKey="pointsEarned" fill="url(#activity-points-gradient)" radius={[6, 6, 2, 2]}
                  barSize={windowDays <= 14 ? 16 : 10} name={t('analytics.chartLabels.points')} animationDuration={1000} opacity={0.85}
                />
                {/* Trend line */}
                <Line yAxisId="left" type="monotone" dataKey="trend" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="6 3"
                  dot={false} name={t('analytics.chartLabels.trend')} style={{ filter: 'url(#trend-line-glow)' }} animationDuration={1400}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )
      }

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
          <>
            {chartTimeControl}
            <div className="space-y-4 py-2">
              {childData.map((child, idx) => {
                const g = childGradients[child.gradientIdx]
                const pct = Math.round((child.points / maxPoints) * 100)
                return (
                  <div key={idx} className="group relative">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shrink-0"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, boxShadow: `0 4px 14px ${g.shadow}40` }}
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
                        <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                          <div className="h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${g.from}, ${g.to})`, boxShadow: `0 0 12px ${g.shadow}50` }}
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
          </>
        )
      }

      /* ━━━━━━━━━━━━━━ 2 ▸ DIFFICULTY MAP — horizontal stacked bars per child ━━━━━━━━━━━━━━ */
      case 2: {
        const diffColors: Record<string, string> = {
          'Очень легко': '#22c55e', 'Легко': '#84cc16', 'Средне': '#eab308', 'Сложно': '#f97316', 'Очень сложно': '#ef4444',
          'Very Easy': '#22c55e', 'Easy': '#84cc16', 'Medium': '#eab308', 'Hard': '#f97316', 'Very Hard': '#ef4444',
          'Foarte Ușor': '#22c55e', 'Ușor': '#84cc16', 'Mediu': '#eab308', 'Dificil': '#f97316', 'Foarte Dificil': '#ef4444',
        }

        if (selectedChild !== "all") {
          // Single child: show radial bars
          const radarData = filteredDifficulty
          if (!radarData.length) return <p className="text-center text-muted-foreground py-12">{t('analyticsDashboard.noData')}</p>
          return (
            <>
              {chartTimeControl}
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={radarData} layout="vertical" barSize={24}>
                  <defs>
                    {radarData.map((d, i) => (
                      <linearGradient key={i} id={`diff-bar-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={d.color} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={d.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1000} name={t('analytics.chartLabels.tasks')}>
                    {radarData.map((d, i) => <Cell key={i} fill={`url(#diff-bar-${i})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )
        }

        // All children: comparative stacked horizontal bars
        const diffNames = chartData.difficultyDistribution.map(d => d.name)
        const childDiffData = (chartData.perChildDifficulty ?? []).map((child, ci) => {
          const childName = chartData.childrenStats.find(c => c.childId === child.childId)?.childName ?? child.childId
          const row: any = { name: childName }
          for (const dn of diffNames) {
            const found = child.data.find(d => d.name === dn)
            row[dn] = found?.value ?? 0
          }
          return row
        })

        if (!childDiffData.length) {
          // Fallback: aggregate radar
          return (
            <>
              {chartTimeControl}
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={filteredDifficulty} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name={t('analytics.chartLabels.tasks')}>
                    {filteredDifficulty.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )
        }

        return (
          <>
            {chartTimeControl}
            <ResponsiveContainer width="100%" height={Math.max(280, childDiffData.length * 70)}>
              <BarChart data={childDiffData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Legend wrapperStyle={{ paddingTop: 12 }} formatter={(v: string) => <span className="text-xs font-medium ml-1">{v}</span>} />
                {diffNames.map((dn, i) => (
                  <Bar key={dn} dataKey={dn} stackId="diff" fill={diffColors[dn] ?? CHILD_COLORS[i % CHILD_COLORS.length]}
                    radius={i === diffNames.length - 1 ? [0, 8, 8, 0] : [0, 0, 0, 0]}
                    animationDuration={1000} name={dn}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </>
        )
      }

      /* ━━━━━━━━━━━━━━ 3 ▸ COMPLETION DYNAMICS — clean % area with goal line ━━━━━━━━━━━━━━ */
      case 3: {
        const momentumData = filteredProgress.map(w => ({
          week: w.week,
          rate: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
          completed: w.completed,
          total: w.total,
        }))
        const avgRate = momentumData.length > 0
          ? Math.round(momentumData.reduce((s, d) => s + d.rate, 0) / momentumData.length)
          : 0
        return (
          <>
            {chartTimeControl}
            <div className="flex items-center gap-4 mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{avgRate}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('analytics.chartLabels.avgRate')}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{t('analytics.chartLabels.completionPercent')}</span>
                <span className="flex items-center gap-1"><span className="w-6 h-0 border-t-2 border-dashed border-amber-400" />{t('analytics.chartLabels.goal')} 80%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={momentumData}>
                <defs>
                  <linearGradient id="completion-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <filter id="completion-glow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.4" /></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '6 4' }} />
                <ReferenceLine y={80} yAxisId={0} stroke="#f59e0b" strokeDasharray="8 4" strokeWidth={2} label={{ value: '80%', position: 'right', fill: '#f59e0b', fontSize: 11, fontWeight: 700 }} />
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3}
                  fill="url(#completion-area)" name={t('analytics.chartLabels.completionPercent')} animationDuration={1200}
                  dot={({ cx, cy }: any) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r={6} fill="#10b981" opacity={0.15} /><circle cx={cx} cy={cy} r={4} fill="#fff" stroke="#10b981" strokeWidth={2} /></g>}
                  style={{ filter: 'url(#completion-glow)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
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
                  <linearGradient id="donut-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                  <linearGradient id="donut-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fcd34d" /><stop offset="100%" stopColor="#d97706" /></linearGradient>
                  <linearGradient id="donut-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fda4af" /><stop offset="100%" stopColor="#dc2626" /></linearGradient>
                  <filter id="donut-shadow" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.15" /></filter>
                </defs>
                <Pie data={[{ value: 1 }]} cx="50%" cy="50%" innerRadius={128} outerRadius={132} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={1} dataKey="value" isAnimationActive={false}>
                  <Cell fill="rgba(148,163,184,0.08)" />
                </Pie>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={80} outerRadius={122} paddingAngle={5} dataKey="value" cornerRadius={12} animationDuration={1200} animationEasing="ease-out" style={{ filter: 'url(#donut-shadow)' }}>
                  {statusData.map((entry, i) => <Cell key={`cell-${i}`} fill={`url(#${entry.gradient})`} stroke="none" />)}
                </Pie>
                <Pie data={[{ value: 1 }]} cx="50%" cy="50%" innerRadius={72} outerRadius={75} fill="none" dataKey="value" isAnimationActive={false}>
                  <Cell fill="rgba(148,163,184,0.06)" />
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 bg-clip-text text-transparent drop-shadow-sm">
                <AnimatedCounter value={pct} suffix="%" />
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">{t('analytics.chartLabels.completed')}</span>
            </div>
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

      /* ━━━━━━━━━━━━━━ 5 ▸ POINTS GROWTH — multi-child or single ━━━━━━━━━━━━━━ */
      case 5: {
        // If viewing all children and per-child data is available, show multi-line
        const hasPerChild = selectedChild === "all" && chartData.perChildPointsTrend?.length > 0

        if (hasPerChild) {
          // Merge all children's points into a single dataset keyed by date
          const dateMap = new Map<string, any>()
          for (const cd of chartData.perChildPointsTrend) {
            const childName = chartData.childrenStats.find(c => c.childId === cd.childId)?.childName ?? cd.childId
            for (const pt of cd.data) {
              if (!dateMap.has(pt.date)) dateMap.set(pt.date, { date: pt.date })
              dateMap.get(pt.date)![childName] = pt.points
            }
          }
          const merged = Array.from(dateMap.values())
          const childNames = chartData.perChildPointsTrend.map(cd =>
            chartData.childrenStats.find(c => c.childId === cd.childId)?.childName ?? cd.childId
          )

          return (
            <>
              {chartTimeControl}
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={merged}>
                  <defs>
                    {childNames.map((cn, i) => (
                      <linearGradient key={cn} id={`growth-child-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHILD_COLORS[i % CHILD_COLORS.length]} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHILD_COLORS[i % CHILD_COLORS.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '6 4' }} />
                  <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(v: string) => <span className="text-xs font-medium ml-1">{v}</span>} />
                  {childNames.map((cn, i) => (
                    <Area key={cn} type="monotone" dataKey={cn} stroke={CHILD_COLORS[i % CHILD_COLORS.length]}
                      strokeWidth={2.5} fill={`url(#growth-child-${i})`} name={cn} animationDuration={1200}
                      dot={false} activeDot={{ r: 5, fill: CHILD_COLORS[i % CHILD_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </>
          )
        }

        // Single child or fallback
        return (
          <>
            {chartTimeControl}
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={filteredPointsTrend}>
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
                  <filter id="area-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.3" /></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '6 4' }} />
                <Area type="monotone" dataKey="points" stroke="url(#growth-stroke)" strokeWidth={3.5}
                  fill="url(#growth-fill)" name={t('analytics.chartLabels.points')} animationDuration={1400}
                  dot={({ cx, cy }: any) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r={8} fill="#a855f7" opacity={0.12} /><circle cx={cx} cy={cy} r={4.5} fill="#fff" stroke="#8b5cf6" strokeWidth={2.5} /><circle cx={cx} cy={cy} r={2} fill="#8b5cf6" /></g>}
                  style={{ filter: 'url(#area-glow)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )
      }

      /* ━━━━━━━━━━━━━━ 6 ▸ QUEST JOURNEY — gamified streak adventure ━━━━━━━━━━━━━━ */
      case 6: {
        // If "all" family is selected, show combined family quest with per-child breakdown
        const isFamily = selectedChild === "all"

        // For family view, aggregate all children's data
        const allChildActivities = isFamily && chartData.perChildActivity?.length
          ? chartData.perChildActivity
          : null

        const days = filteredActivity
        const maxTasks = Math.max(...days.map(d => d.tasksCompleted), 1)
        const totalTasksCount = days.reduce((s, d) => s + d.tasksCompleted, 0)
        const totalPointsCount = days.reduce((s, d) => s + d.pointsEarned, 0)
        const activeDays = days.filter(d => d.tasksCompleted > 0).length
        const currentStreak = (() => {
          let streak = 0
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].tasksCompleted > 0) streak++
            else break
          }
          return streak
        })()
        const bestStreak = (() => {
          let best = 0, cur = 0
          for (const d of days) {
            if (d.tasksCompleted > 0) { cur++; best = Math.max(best, cur) }
            else cur = 0
          }
          return best
        })()

        // XP & level system
        const xp = totalTasksCount * 10 + totalPointsCount
        const levelThresholds = [0, 50, 150, 350, 700, 1200, 2000, 3500, 5500, 8000, 12000]
        const level = levelThresholds.filter(th => xp >= th).length
        const currentLevelMin = levelThresholds[level - 1] ?? 0
        const nextLevelXp = levelThresholds[level] ?? currentLevelMin + 2000
        const levelProgress = Math.min(100, Math.round(((xp - currentLevelMin) / (nextLevelXp - currentLevelMin)) * 100))

        // Achievements
        const achievements = [
          { key: 'firstStep', icon: <Star className="w-4 h-4" />, threshold: 1, color: 'from-green-400 to-emerald-500', unlocked: activeDays >= 1 },
          { key: 'onFire', icon: <Flame className="w-4 h-4" />, threshold: 3, color: 'from-orange-400 to-red-500', unlocked: bestStreak >= 3 },
          { key: 'unstoppable', icon: <Swords className="w-4 h-4" />, threshold: 7, color: 'from-blue-400 to-indigo-500', unlocked: bestStreak >= 7 },
          { key: 'legendary', icon: <Shield className="w-4 h-4" />, threshold: 14, color: 'from-purple-400 to-violet-600', unlocked: bestStreak >= 14 },
          { key: 'mythical', icon: <Crown className="w-4 h-4" />, threshold: 30, color: 'from-amber-400 to-yellow-500', unlocked: bestStreak >= 30 },
        ]

        // Quest path: last 14 days shown as path nodes
        const pathDays = days.slice(-14)
        const nodeSize = 44

        // Level colors
        const getLevelColor = (lvl: number) => {
          if (lvl <= 2) return { bg: 'from-green-500 to-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-400' }
          if (lvl <= 4) return { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-700', ring: 'ring-blue-400' }
          if (lvl <= 6) return { bg: 'from-purple-500 to-violet-600', text: 'text-purple-700', ring: 'ring-purple-400' }
          if (lvl <= 8) return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-700', ring: 'ring-amber-400' }
          return { bg: 'from-red-500 to-rose-600', text: 'text-red-700', ring: 'ring-red-400' }
        }
        const lvlColor = getLevelColor(level)

        return (
          <>
            {chartTimeControl}
            <div className="space-y-5">

              {/* ── Level + XP bar ── */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50 border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-violet-400/10 to-purple-600/5 rounded-full blur-xl" />
                <div className="flex items-center gap-4">
                  {/* Level badge */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${lvlColor.bg} flex items-center justify-center shadow-xl relative`}>
                    <span className="text-2xl font-black text-white">{level}</span>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center`}>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${lvlColor.text} dark:text-white`}>{t('analytics.chartLabels.level')} {level}</span>
                      <span className="text-xs text-muted-foreground font-mono">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} {t('analytics.chartLabels.xp')}</span>
                    </div>
                    <div className="h-4 rounded-full bg-gray-200/80 dark:bg-gray-700/60 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${lvlColor.bg} transition-all duration-1000 ease-out relative`}
                        style={{ width: `${levelProgress}%` }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ animationName: 'shimmer' }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{levelProgress}%</span>
                      <span>{(nextLevelXp - xp).toLocaleString()} {t('analytics.chartLabels.xp')} {t('analytics.chartLabels.remaining')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Streak + Stats row ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/20 border border-orange-200/60 dark:border-orange-900/30 relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-red-500/10 rounded-full blur-lg" />
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow">
                      <Flame className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{t('analytics.chartLabels.currentStreak')}</span>
                  </div>
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{currentStreak} <span className="text-xs font-medium text-muted-foreground">{t('analytics.chartLabels.days')}</span></p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20 border border-purple-200/60 dark:border-purple-900/30 relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-violet-500/10 rounded-full blur-lg" />
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center shadow">
                      <Trophy className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{t('analytics.chartLabels.bestStreak')}</span>
                  </div>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{bestStreak} <span className="text-xs font-medium text-muted-foreground">{t('analytics.chartLabels.days')}</span></p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-200/60 dark:border-emerald-900/30 relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-lg" />
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow">
                      <CalendarDays className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{t('analytics.chartLabels.activeDays')}</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeDays}<span className="text-sm font-medium text-muted-foreground">/{days.length}</span></p>
                </div>
              </div>

              {/* ── Quest Path (last 14 days as game map) ── */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50/80 to-white dark:from-gray-900/60 dark:to-gray-800/30 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Swords className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-bold">{t('analytics.chartLabels.questPath')}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{t('analytics.chartLabels.days').replace('days','').trim()} {pathDays.length}</span>
                </div>

                {/* Winding path */}
                <div className="relative">
                  {/* Connector lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {pathDays.map((_, i) => {
                      if (i === 0) return null
                      const cols = Math.min(7, pathDays.length)
                      const row = Math.floor(i / cols)
                      const prevRow = Math.floor((i - 1) / cols)
                      const col = row % 2 === 0 ? (i % cols) : (cols - 1 - (i % cols))
                      const prevCol = prevRow % 2 === 0 ? ((i - 1) % cols) : (cols - 1 - ((i - 1) % cols))
                      const gap = 8
                      const x1 = prevCol * (nodeSize + gap) + nodeSize / 2
                      const y1 = prevRow * (nodeSize + gap + 12) + nodeSize / 2
                      const x2 = col * (nodeSize + gap) + nodeSize / 2
                      const y2 = row * (nodeSize + gap + 12) + nodeSize / 2
                      const active = pathDays[i].tasksCompleted > 0 && pathDays[i - 1].tasksCompleted > 0
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? '#a855f7' : '#e2e8f0'} strokeWidth={active ? 3 : 2} strokeDasharray={active ? 'none' : '6 4'} strokeLinecap="round" opacity={active ? 0.6 : 0.4} />
                    })}
                  </svg>

                  {/* Nodes arranged in a winding path */}
                  {(() => {
                    const cols = Math.min(7, pathDays.length)
                    const rowsArr: typeof pathDays[] = []
                    for (let i = 0; i < pathDays.length; i += cols) rowsArr.push(pathDays.slice(i, i + cols))

                    return (
                      <div className="space-y-3 relative" style={{ zIndex: 1 }}>
                        {rowsArr.map((row, ri) => (
                          <div key={ri} className={`flex gap-2 ${ri % 2 === 1 ? 'flex-row-reverse' : ''} justify-center`}>
                            {row.map((day, di) => {
                              const intensity = day.tasksCompleted / maxTasks
                              const isActive = day.tasksCompleted > 0
                              const isLast = ri === rowsArr.length - 1 && di === row.length - 1
                              const nodeColor = !isActive
                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                : intensity > 0.75
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 shadow-lg shadow-amber-400/30'
                                  : intensity > 0.5
                                    ? 'bg-gradient-to-br from-violet-400 to-purple-600 border-violet-300 shadow-lg shadow-violet-400/30'
                                    : intensity > 0.25
                                      ? 'bg-gradient-to-br from-blue-400 to-indigo-500 border-blue-300 shadow-md shadow-blue-400/20'
                                      : 'bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-300 shadow-md shadow-emerald-400/20'

                              return (
                                <div key={di} className="group relative">
                                  <div
                                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-default ${nodeColor} ${isLast ? 'ring-2 ring-violet-400/50 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                                  >
                                    {isActive ? (
                                      <span className="text-white text-xs font-bold drop-shadow-sm">{day.tasksCompleted}</span>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                                    )}
                                  </div>
                                  {isLast && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 animate-pulse" />
                                  )}
                                  {/* Tooltip */}
                                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 bg-gray-900 text-white text-[10px] px-3 py-2 rounded-xl whitespace-nowrap shadow-xl border border-gray-700">
                                    <p className="font-bold">{day.day}</p>
                                    <p>{isActive ? `${day.tasksCompleted} ${t('analytics.chartLabels.tasksCompleted')}, ${day.pointsEarned} ${t('analytics.chartLabels.points').toLowerCase()}` : t('analytics.chartLabels.noActivity')}</p>
                                    <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* ── Achievements ── */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-gray-900/30 border border-amber-100/60 dark:border-amber-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold">{t('analytics.chartLabels.achievements')}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {achievements.map(a => (
                    <div key={a.key} className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      a.unlocked
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-40 grayscale'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl ${a.unlocked ? `bg-gradient-to-br ${a.color}` : 'bg-gray-300 dark:bg-gray-700'} flex items-center justify-center shadow-lg text-white`}>
                        {a.icon}
                      </div>
                      <span className="text-[11px] font-bold">{t(`analytics.chartLabels.${a.key}`)}</span>
                      <span className="text-[9px] text-muted-foreground">{t(`analytics.chartLabels.${a.key}Desc`)}</span>
                      {a.unlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow border-2 border-white dark:border-gray-800">
                          <span className="text-white text-[9px] font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Family mode: per-child activity breakdown ── */}
              {isFamily && allChildActivities && allChildActivities.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-gray-900/30 border border-violet-100/60 dark:border-violet-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-bold">{t('analytics.chartLabels.familyQuest')}</span>
                  </div>
                  <div className="space-y-3">
                    {allChildActivities.map((child, ci) => {
                      const childName = chartData.childrenStats.find(c => c.childId === child.childId)?.childName ?? child.childId
                      const childActive = child.data.filter(d => d.tasksCompleted > 0).length
                      const childTotalTasks = child.data.reduce((s, d) => s + d.tasksCompleted, 0)
                      const childStreak = (() => {
                        let s = 0
                        for (let i = child.data.length - 1; i >= 0; i--) {
                          if (child.data[i].tasksCompleted > 0) s++
                          else break
                        }
                        return s
                      })()
                      const childXp = childTotalTasks * 10 + child.data.reduce((s, d) => s + d.pointsEarned, 0)
                      const childLevel = levelThresholds.filter(th => childXp >= th).length
                      const color = CHILD_COLORS[ci % CHILD_COLORS.length]

                      return (
                        <div key={child.childId} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg" style={{ background: color, boxShadow: `0 4px 14px ${color}40` }}>
                            {childLevel}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold truncate">{childName}</span>
                              <div className="flex items-center gap-2 text-xs shrink-0">
                                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{childStreak}d</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{childXp}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span>{t('analytics.chartLabels.level')} {childLevel}</span>
                              <span>•</span>
                              <span>{childActive}/{child.data.length} {t('analytics.chartLabels.activeDays').toLowerCase()}</span>
                              <span>•</span>
                              <span>{childTotalTasks} {t('analytics.chartLabels.tasks').toLowerCase()}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )
      }

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

  /**
   * Prepare a DOM subtree for html-to-image capture:
   * - Replace `bg-clip-text text-transparent` gradient text with solid fallback
   * - Force white background and dark text for consistent exports
   * Returns a cleanup function to restore original styles.
   */
  const prepareForCapture = (root: HTMLElement): (() => void) => {
    const restorers: Array<() => void> = []

    // Fix gradient text (bg-clip-text text-transparent) — invisible in rasterised capture
    root.querySelectorAll<HTMLElement>(".text-transparent").forEach((el) => {
      const prev = el.style.cssText
      el.style.color = "#1a1a2e"
      el.style.webkitTextFillColor = "#1a1a2e"
      el.style.backgroundClip = "unset"
      el.style.webkitBackgroundClip = "unset"
      el.style.background = "none"
      restorers.push(() => { el.style.cssText = prev })
    })

    // Force light-mode appearance on cards
    root.querySelectorAll<HTMLElement>(".dark\\:from-violet-950\\/40, .dark\\:from-blue-950\\/40, .dark\\:from-emerald-950\\/40, .dark\\:from-amber-950\\/40").forEach((el) => {
      const prev = el.style.cssText
      el.style.backgroundColor = "#ffffff"
      el.style.color = "#1a1a2e"
      restorers.push(() => { el.style.cssText = prev })
    })

    // Ensure muted-foreground text is visible
    root.querySelectorAll<HTMLElement>(".text-muted-foreground").forEach((el) => {
      const prev = el.style.cssText
      el.style.color = "#6b7280"
      restorers.push(() => { el.style.cssText = prev })
    })

    return () => restorers.forEach((fn) => fn())
  }

  /** Build export filename with child name if filtered */
  const exportFileName = (ext: string, prefix = "analytics") => {
    const childSuffix = selectedChild !== "all"
      ? `_${analytics?.childrenStats.find(c => c.childId === selectedChild)?.childName ?? "child"}`
      : ""
    return `${prefix}${childSuffix}_${windowDays}d_${new Date().toISOString().slice(0, 10)}.${ext}`
  }

  const exportAsPng = async () => {
    if (!exportRef.current) return
    const restore = prepareForCapture(exportRef.current)
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = exportFileName("png")
      link.click()
    } finally {
      restore()
    }
  }

  const exportCurrentAsPdf = async () => {
    if (!exportRef.current) return
    const restore = prepareForCapture(exportRef.current)
    try {
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
      pdf.save(exportFileName("pdf"))
    } finally {
      restore()
    }
  }

  const exportAllChartsToPdf = useCallback(async () => {
    if (!analytics || exporting) return
    setExporting(true)

    try {
      // Use exportChildFilter from the dialog (user's selected child for export)
      const childForExport = exportChildFilter
      const childLabel = childForExport !== "all"
        ? analytics.childrenStats.find(c => c.childId === childForExport)?.childName ?? ""
        : t('analyticsDashboard.wholeFamily')

      // Temporarily switch selectedChild for chart rendering
      const prevSelectedChild = selectedChild
      setSelectedChild(childForExport)

      // Wait for charts to re-render with new child filter
      await new Promise((resolve) => setTimeout(resolve, 300))

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20

      // ── Title page: render as HTML and capture as image ──
      const titleContainer = exportTitleRef.current
      if (titleContainer) {
        // Populate dynamic content
        const titleEl = titleContainer.querySelector('[data-export-title]')
        const subtitleEl = titleContainer.querySelector('[data-export-subtitle]')
        const dateEl = titleContainer.querySelector('[data-export-date]')
        const childEl = titleContainer.querySelector('[data-export-child]')
        const statsEls = titleContainer.querySelectorAll('[data-export-stat]')

        if (titleEl) titleEl.textContent = t('analytics.exportAll.reportTitle')
        if (subtitleEl) subtitleEl.textContent = `${t('analytics.exportAll.period')}: ${windowDays} ${t('analytics.exportAll.days')}`
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString()
        if (childEl) childEl.textContent = childLabel

        const statValues = [
          { label: t('analytics.cards.totalPoints'), value: analytics.totalPoints.toLocaleString() },
          { label: t('analytics.cards.completedTasks'), value: `${analytics.completedTasks} / ${analytics.totalTasks}` },
          { label: t('analytics.cards.completionRate'), value: `${analytics.completionRate.toFixed(1)}%` },
          { label: t('analytics.cards.activeChildren'), value: String(analytics.activeChildren) },
        ]
        statsEls.forEach((el, i) => {
          if (statValues[i]) {
            const labelEl = el.querySelector('[data-stat-label]')
            const valueEl = el.querySelector('[data-stat-value]')
            if (labelEl) labelEl.textContent = statValues[i].label
            if (valueEl) valueEl.textContent = statValues[i].value
          }
        })

        titleContainer.style.display = "block"
        titleContainer.style.position = "absolute"
        titleContainer.style.left = "-9999px"
        titleContainer.style.top = "0"
        titleContainer.style.width = "900px"

        await new Promise((resolve) => setTimeout(resolve, 200))

        try {
          const titleImg = await toPng(titleContainer, {
            cacheBust: true,
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          })
          const img = new Image()
          img.src = titleImg
          await img.decode()

          const maxW = pageWidth - margin * 2
          const maxH = pageHeight - margin * 2
          const ratio = Math.min(maxW / img.width, maxH / img.height)
          const imgW = img.width * ratio
          const imgH = img.height * ratio
          const x = (pageWidth - imgW) / 2
          const y = (pageHeight - imgH) / 2
          pdf.addImage(titleImg, "PNG", x, y, imgW, imgH)
        } catch (e) {
          console.error("Title page render error:", e)
        }
        titleContainer.style.display = "none"
      }

      // ── Chart pages: render from hidden container ──
      const container = allChartsRef.current
      if (container) {
        container.style.display = "block"
        container.style.position = "absolute"
        container.style.left = "-9999px"
        container.style.top = "0"
        container.style.width = "900px"
        container.style.backgroundColor = "#ffffff"

        await new Promise((resolve) => setTimeout(resolve, 600))

        const restoreExport = prepareForCapture(container)
        const chartNodes = container.querySelectorAll<HTMLElement>("[data-chart-export]")

        for (let i = 0; i < chartNodes.length; i++) {
          // Skip charts not selected by user
          if (exportChartSelection.length > 0 && !exportChartSelection[i]) continue

          const node = chartNodes[i]

          // Set chart title and description in the export container
          const titleEl = node.querySelector('[data-chart-title]')
          const descEl = node.querySelector('[data-chart-desc]')
          const numEl = node.querySelector('[data-chart-num]')
          if (titleEl) titleEl.textContent = chartsConfig[i]?.titleKey ? t(chartsConfig[i].titleKey) : `Chart ${i + 1}`
          if (descEl) descEl.textContent = chartsConfig[i]?.descKey ? t(chartsConfig[i].descKey) : ""
          if (numEl) numEl.textContent = String(i + 1)

          pdf.addPage()

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
            const maxH = pageHeight - margin * 2
            const ratio = Math.min(maxW / img.width, maxH / img.height)
            const imgW = img.width * ratio
            const imgH = img.height * ratio
            const x = (pageWidth - imgW) / 2
            const y = margin
            pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH)
          } catch (e) {
            console.error(`Chart ${i} render error:`, e)
          }
        }

        restoreExport()
        container.style.display = "none"
      }

      // Restore original child selection
      setSelectedChild(prevSelectedChild)

      pdf.save(exportFileName("pdf", "analytics_full_report"))
    } catch (err) {
      console.error("PDF export error:", err)
    } finally {
      setExporting(false)
      setShowExportDialog(false)
    }
  }, [analytics, exporting, windowDays, selectedChild, exportChildFilter, exportChartSelection, t])

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
          {/* Primary: Export all to PDF — opens dialog */}
          <Button
            size="sm"
            onClick={() => {
              setExportChildFilter(selectedChild)
              setExportChartSelection(chartsConfig.map(() => true))
              setShowExportDialog(true)
            }}
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
              <div className="flex items-center gap-1.5 mt-1.5 ml-4">
                <Info className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <p className="text-xs text-muted-foreground leading-snug">
                  {t(chartsConfig[currentChart].descKey)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1 ml-4">
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
          <div key={chart.id} data-chart-export style={{ width: 900, minHeight: 480, padding: 24, backgroundColor: "#ffffff" }}>
            {/* Chart header embedded in export image */}
            <div style={{ marginBottom: 16, borderBottom: "2px solid #e5e7eb", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 28, borderRadius: 4, background: "linear-gradient(180deg, #8b5cf6, #6d28d9)" }} />
                <span data-chart-num style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6" }}>{idx + 1}</span>
                <span style={{ fontSize: 8, color: "#8b5cf6", fontWeight: 600 }}>.</span>
                <span data-chart-title style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{t(chart.titleKey)}</span>
              </div>
              <p data-chart-desc style={{ fontSize: 13, color: "#64748b", marginTop: 6, marginLeft: 40, lineHeight: 1.5 }}>
                {t(chart.descKey)}
              </p>
            </div>
            {renderChart(idx)}
          </div>
        ))}
      </div>

      {/* Hidden title page template for PDF export (rendered as HTML → image) */}
      <div ref={exportTitleRef} style={{ display: "none", width: 900, backgroundColor: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ padding: 48, minHeight: 500 }}>
          {/* Decorative header bar */}
          <div style={{ height: 6, borderRadius: 3, background: "linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981, #f59e0b)", marginBottom: 40 }} />

          {/* Title */}
          <h1 data-export-title style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", textAlign: "center", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
            {t('analytics.exportAll.reportTitle')}
          </h1>

          {/* Subtitle line */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center", marginBottom: 8 }}>
            <span data-export-subtitle style={{ fontSize: 16, color: "#64748b" }} />
            <span style={{ color: "#d1d5db" }}>•</span>
            <span data-export-date style={{ fontSize: 16, color: "#64748b" }} />
          </div>

          {/* Child label */}
          <p style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", padding: "6px 20px", borderRadius: 999, background: "linear-gradient(135deg, #ede9fe, #dbeafe)", fontSize: 15, fontWeight: 600, color: "#6d28d9" }}>
              <span data-export-child />
            </span>
          </p>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, marginTop: 48 }}>
            {[0, 1, 2, 3].map(i => {
              const colors = [
                { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
                { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb" },
                { bg: "#ecfdf5", border: "#a7f3d0", accent: "#059669" },
                { bg: "#fffbeb", border: "#fde68a", accent: "#d97706" },
              ]
              const c = colors[i]
              return (
                <div key={i} data-export-stat style={{ padding: 24, borderRadius: 16, backgroundColor: c.bg, border: `2px solid ${c.border}`, textAlign: "center" }}>
                  <p data-stat-label style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 8 }} />
                  <p data-stat-value style={{ fontSize: 32, fontWeight: 800, color: c.accent, margin: 0 }} />
                </div>
              )
            })}
          </div>

          {/* Footer bar */}
          <div style={{ height: 4, borderRadius: 2, background: "linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981, #f59e0b)", marginTop: 48 }} />
        </div>
      </div>

      {/* ── Export Settings Dialog ── */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-violet-500" />
              {t('analytics.exportDialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Child selector */}
            <div>
              <p className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                {t('analytics.exportDialog.selectChild')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={exportChildFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setExportChildFilter("all")}
                >
                  {t('analyticsDashboard.wholeFamily')}
                </Button>
                {analytics.childrenStats.map((child) => (
                  <Button
                    key={child.childId}
                    variant={exportChildFilter === child.childId ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setExportChildFilter(child.childId)}
                  >
                    {child.childName}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chart selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  {t('analytics.exportDialog.selectCharts')}
                </p>
                <button
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  onClick={() => {
                    const allSelected = exportChartSelection.every(Boolean)
                    setExportChartSelection(chartsConfig.map(() => !allSelected))
                  }}
                >
                  {exportChartSelection.every(Boolean) ? t('analytics.exportDialog.deselectAll') : t('analytics.exportDialog.selectAll')}
                </button>
              </div>
              <div className="space-y-1.5">
                {chartsConfig.map((chart, idx) => (
                  <button
                    key={chart.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left text-sm ${
                      exportChartSelection[idx]
                        ? 'border-violet-300 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-800'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                    onClick={() => {
                      setExportChartSelection(prev => {
                        const next = [...prev]
                        next[idx] = !next[idx]
                        return next
                      })
                    }}
                  >
                    {exportChartSelection[idx] ? (
                      <CheckSquare className="w-4 h-4 text-violet-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={`font-medium ${exportChartSelection[idx] ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {idx + 1}. {t(chart.titleKey)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={exportAllChartsToPdf}
              disabled={exporting || !exportChartSelection.some(Boolean)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {exporting ? t('analytics.exportAll.generating') : t('analytics.exportDialog.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
