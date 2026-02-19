"use client"

import type { LucideIcon } from "lucide-react"
import {
  Edit, Eye, Upload, CheckCircle2, AlertCircle, FileCheck, BookOpen,
  Zap, Trophy, ZoomIn, Clock, CalendarDays, Camera, Video, FileText,
  Trash2, Sparkles, ChevronRight, Shield, Star
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"
import { tasksService } from "@/services/tasks-service"
import { useTranslation } from "@/i18n/provider"
import { useEffect, useRef, useState } from "react"

// Local minimal type that matches decorated task shape produced in `TasksList`
type DecoratedTask = TaskDto & {
  status?: string
  difficulty?: number
  xpReward?: number
  pointsReward?: number
  accent?: { gradient?: string; ring?: string; highlight?: string }
  createdLabel?: string
  dueLabel?: string
  progressValue?: number
}

interface TaskRowProps {
  task: DecoratedTask
  userType: "parent" | "child"
  streakMultiplier?: number
  onConfirm: (id: string) => void
  onReject: (task: TaskDto) => void
  onUploadEvidence: (task: DecoratedTask) => void
  onViewEvidence: (task: DecoratedTask) => void
  onEdit: (task: DecoratedTask) => void
  onDelete: (id: string) => void
  confirmLoading?: boolean
  updateLoading?: boolean
  downloadLoading?: boolean
  deleteLoading?: boolean
}

/* ──────────────── status theme palettes ──────────────── */
const STATUS_THEME = {
  completed: {
    border: "border-emerald-200/80 dark:border-emerald-800/40",
    bg: "from-emerald-50/60 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10",
    accent: "bg-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    progress: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-200/50 dark:shadow-emerald-900/30",
  },
  in_progress: {
    border: "border-blue-200/80 dark:border-blue-800/40",
    bg: "from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/10",
    accent: "bg-blue-500",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    progress: "from-blue-400 to-indigo-500",
    glow: "shadow-blue-200/50 dark:shadow-blue-900/30",
  },
  overdue: {
    border: "border-red-200/80 dark:border-red-800/40",
    bg: "from-red-50/50 via-white to-orange-50/30 dark:from-red-950/20 dark:via-background dark:to-orange-950/10",
    accent: "bg-red-500",
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    progress: "from-red-400 to-orange-500",
    glow: "shadow-red-200/50 dark:shadow-red-900/30",
  },
  pending: {
    border: "border-slate-200/80 dark:border-slate-700/40",
    bg: "from-slate-50/40 via-white to-slate-50/20 dark:from-slate-900/20 dark:via-background dark:to-slate-900/10",
    accent: "bg-slate-400",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300",
    progress: "from-slate-300 to-slate-400",
    glow: "shadow-slate-200/40 dark:shadow-slate-900/20",
  },
} as const

type StatusKey = keyof typeof STATUS_THEME

export default function TaskRow({ 
  task, 
  userType,
  streakMultiplier,
  onConfirm, 
  onReject, 
  onUploadEvidence, 
  onViewEvidence, 
  onEdit,
  onDelete,
  confirmLoading,
  updateLoading,
  downloadLoading,
  deleteLoading
}: TaskRowProps) {
  const { t } = useTranslation()

  const EVIDENCE_META: Record<TaskEvidenceRequirement, { label: string; icon: any; color: string }> = {
    none: { label: t("taskRow.evidenceNone"), icon: FileCheck, color: "text-emerald-600" },
    photo: { label: t("taskRow.evidencePhoto"), icon: Camera, color: "text-blue-600" },
    video: { label: t("taskRow.evidenceVideo"), icon: Video, color: "text-purple-600" },
    document: { label: t("taskRow.evidenceDocument"), icon: FileText, color: "text-orange-600" },
  }

  const resolveEvidenceRequirement = (value?: string | number | null): TaskEvidenceRequirement => {
    if (typeof value === "number") {
      switch (value) {
        case 1: return "photo"
        case 2: return "video"
        case 3: return "document"
        default: return "none"
      }
    }
    const normalized = typeof value === "string" ? value.toLowerCase() : "none"
    return normalized in EVIDENCE_META ? (normalized as TaskEvidenceRequirement) : "none"
  }

  const evidence = task.evidence ?? { requirement: "none", isSubmitted: false }
  const evidenceRequirement = resolveEvidenceRequirement(evidence.requirement)
  const evidenceMeta = EVIDENCE_META[evidenceRequirement]
  const requiresEvidence = evidenceRequirement !== "none"
  const evidenceReady = Boolean(evidence.isSubmitted)
  
  // Lazy-load thumbnail for image evidence
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const thumbnailUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (evidenceReady && (evidenceRequirement === 'photo' || evidence.contentType?.startsWith('image/'))) {
      tasksService.downloadEvidence(task.id)
        .then(blob => {
          if (!cancelled) {
            if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current)
            const url = URL.createObjectURL(blob)
            thumbnailUrlRef.current = url
            setThumbnailUrl(url)
          }
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
      if (thumbnailUrlRef.current) {
        URL.revokeObjectURL(thumbnailUrlRef.current)
        thumbnailUrlRef.current = null
      }
    }
  }, [task.id, evidenceReady, evidenceRequirement, evidence.contentType])

  const statusKey: StatusKey = (task.status && task.status in STATUS_THEME)
    ? task.status as StatusKey
    : "pending"
  const theme = STATUS_THEME[statusKey]
  const progress = Math.round(task.progressValue ?? 0)
  const IconComponent = evidenceMeta?.icon || FileCheck

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br transition-all duration-300",
      "hover:shadow-xl hover:-translate-y-1",
      theme.border,
      theme.bg,
      theme.glow,
      task.completed && "opacity-80"
    )}>
      {/* ───── Colored accent stripe (left edge) ───── */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", theme.accent)} />

      {/* ───── Card body ───── */}
      <div className="flex flex-col gap-3.5 p-5 pl-5">

        {/* ── Row 1: Header ── */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-bold leading-snug text-foreground line-clamp-2" title={task.title}>
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Status badge with dot */}
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shrink-0",
            theme.badge
          )}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", theme.dot)} />
            {task.status === "in_progress" ? t("tasks.inProgress") : 
             task.status === "completed" ? t("tasks.completed") :
             task.status === "overdue" ? t("tasks.overdue") :
             t("tasks.pending")}
          </div>
        </div>

        {/* ── Row 2: Rewards + Dates ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* XP chip */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/80 dark:bg-violet-900/30 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{task.xpReward} XP</span>
          </div>

          {/* Points chip */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1">
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{task.pointsReward} PTS</span>
          </div>

          {/* Streak multiplier */}
          {streakMultiplier && streakMultiplier > 1 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-100/80 dark:bg-orange-900/30 px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">×{streakMultiplier}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Dates */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.createdLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {task.dueLabel}
            </span>
          </div>
        </div>

        {/* ── Row 3: Progress ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t("taskRow.progress")}
            </span>
            <span className="text-xs font-bold tabular-nums text-foreground">{progress}%</span>
          </div>
          {/* Custom gradient progress bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/40">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
                theme.progress
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Row 4: Evidence ── */}
        {requiresEvidence && (
          <div className="flex items-center gap-3">
            {/* Evidence thumbnail (if image & ready) */}
            {thumbnailUrl && (
              <button
                type="button"
                onClick={() => onViewEvidence(task)}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group/thumb"
              >
                <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors">
                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                </div>
              </button>
            )}

            {/* Evidence status pill */}
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
              evidenceReady
                ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            )}>
              <IconComponent className="h-3.5 w-3.5" />
              <span>
                {evidenceReady
                  ? `✓ ${evidenceMeta.label} — ${t("taskRow.evidenceSubmitted")}`
                  : `${t("taskRow.evidenceRequired")} — ${evidenceMeta.label}`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ───── Footer: Action bar ───── */}
      <div className={cn(
        "flex flex-wrap items-center gap-2 border-t px-5 py-3",
        "border-slate-100 dark:border-slate-800/60",
        "bg-slate-50/50 dark:bg-slate-900/20"
      )}>
        {/* ─ Utility actions (left) ─ */}
        {evidenceReady && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 rounded-lg"
            onClick={() => onViewEvidence(task)} 
            disabled={downloadLoading}
          >
            <Eye className="h-3.5 w-3.5" />
            {t("taskRow.viewEvidence")}
          </Button>
        )}

        {userType === "child" && requiresEvidence && !task.completed && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1.5 text-xs font-medium rounded-lg"
            onClick={() => onUploadEvidence(task)}
          >
            <Upload className="h-3.5 w-3.5" />
            {evidenceReady ? t("taskRow.changeEvidence") : t("taskRow.submitEvidence")}
          </Button>
        )}

        {userType === "parent" && !task.completed && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1.5 text-xs font-medium rounded-lg"
              onClick={() => onEdit(task)}
              disabled={updateLoading}
            >
              <Edit className="h-3.5 w-3.5" />
              {t("taskRow.edit")}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg"
              onClick={() => onDelete(task.id)}
              disabled={deleteLoading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("taskRow.delete")}
            </Button>
          </>
        )}

        {/* ─ Spacer ─ */}
        <div className="flex-1" />

        {/* ─ Primary actions (right) ─ */}
        {!task.completed && userType === "child" && (
          <Button 
            size="sm" 
            className={cn(
              "h-9 gap-2 rounded-xl px-5 text-sm font-semibold text-white",
              "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
              "shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30",
              "transition-all duration-200"
            )}
            onClick={() => onConfirm(task.id)} 
            disabled={confirmLoading}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("taskRow.complete")}
          </Button>
        )}

        {!task.completed && userType === "parent" && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-9 rounded-xl px-4 text-sm font-medium",
                "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300",
                "dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              )}
              onClick={() => onReject(task)}
            >
              {t("taskRow.reject")}
            </Button>
            <Button 
              size="sm" 
              className={cn(
                "h-9 gap-2 rounded-xl px-5 text-sm font-semibold text-white",
                "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
                "shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30",
                "transition-all duration-200"
              )}
              onClick={() => onConfirm(task.id)} 
              disabled={confirmLoading}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("taskRow.approve")}
            </Button>
          </div>
        )}

        {task.completed && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {t("taskRow.completed")}
          </div>
        )}
      </div>
    </div>
  )
}
