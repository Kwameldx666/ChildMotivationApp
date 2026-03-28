"use client"

import type { LucideIcon } from "lucide-react"
import {
  Edit, Eye, Upload, CheckCircle2, AlertCircle, FileCheck, BookOpen,
  Zap, Trophy, ZoomIn, Clock, CalendarDays, Camera, Video, FileText,
  Trash2, Sparkles, ChevronRight, Shield, Star, MoreHorizontal, X, Pencil,
  Bot, MessageCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"
import { tasksService } from "@/services/tasks-service"
import { useTranslation } from "@/i18n/provider"
import { useEffect, useRef, useState } from "react"
import { openAiChat } from "@/components/ai-chat-widget"

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
  onAskParent?: (task: DecoratedTask) => void
  confirmLoading?: boolean
  updateLoading?: boolean
  downloadLoading?: boolean
  deleteLoading?: boolean
}

/* ──────────────── status theme palettes ──────────────── */
const STATUS_THEME = {
  completed: {
    border: "border-emerald-300/60 dark:border-emerald-700/40",
    bg: "from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/15",
    accent: "bg-gradient-to-b from-emerald-400 to-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    progress: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500",
    glow: "shadow-emerald-200/50 dark:shadow-emerald-900/30",
    emoji: "✅",
    headerGrad: "from-emerald-400/20 to-teal-400/10 dark:from-emerald-500/10 dark:to-teal-500/5",
  },
  in_progress: {
    border: "border-blue-300/60 dark:border-blue-700/40",
    bg: "from-blue-50/80 via-white to-indigo-50/50 dark:from-blue-950/30 dark:via-background dark:to-indigo-950/15",
    accent: "bg-gradient-to-b from-blue-400 to-blue-500",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    progress: "from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500",
    glow: "shadow-blue-200/50 dark:shadow-blue-900/30",
    emoji: "🔨",
    headerGrad: "from-blue-400/20 to-indigo-400/10 dark:from-blue-500/10 dark:to-indigo-500/5",
  },
  overdue: {
    border: "border-red-300/60 dark:border-red-700/40",
    bg: "from-red-50/80 via-white to-orange-50/50 dark:from-red-950/30 dark:via-background dark:to-orange-950/15",
    accent: "bg-gradient-to-b from-red-400 to-red-500",
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    progress: "from-red-500 to-orange-600 dark:from-red-400 dark:to-orange-500",
    glow: "shadow-red-200/50 dark:shadow-red-900/30",
    emoji: "⚠️",
    headerGrad: "from-red-400/20 to-orange-400/10 dark:from-red-500/10 dark:to-orange-500/5",
  },
  pending: {
    border: "border-slate-200/60 dark:border-slate-700/40",
    bg: "from-slate-50/60 via-white to-slate-50/30 dark:from-slate-900/25 dark:via-background dark:to-slate-900/15",
    accent: "bg-gradient-to-b from-slate-300 to-slate-400",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300",
    progress: "from-slate-500 to-slate-600 dark:from-slate-300 dark:to-slate-400",
    glow: "shadow-slate-200/40 dark:shadow-slate-900/20",
    emoji: "⏳",
    headerGrad: "from-slate-300/20 to-slate-200/10 dark:from-slate-600/10 dark:to-slate-500/5",
  },
  pending_approval: {
    border: "border-amber-300/60 dark:border-amber-700/40",
    bg: "from-amber-50/80 via-white to-yellow-50/50 dark:from-amber-950/30 dark:via-background dark:to-yellow-950/15",
    accent: "bg-gradient-to-b from-amber-400 to-amber-500",
    dot: "bg-amber-500 animate-pulse",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    progress: "from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-500",
    glow: "shadow-amber-200/50 dark:shadow-amber-900/30",
    emoji: "⏰",
    headerGrad: "from-amber-400/20 to-yellow-400/10 dark:from-amber-500/10 dark:to-yellow-500/5",
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
  onAskParent,
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
      "group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-gradient-to-br transition-all duration-300",
      "child-card-hover",
      theme.border,
      theme.bg,
      theme.glow,
      task.completed && "opacity-85"
    )}>
      {/* ───── Colored accent stripe (left edge — thicker, gradient) ───── */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl", theme.accent)} />

      {/* ───── Fun status emoji corner ───── */}
      <div className="absolute top-3 right-3 text-lg select-none pointer-events-none">
        {theme.emoji}
      </div>

      {/* ───── Card body ───── */}
      <div className="flex flex-col gap-3.5 p-5 pl-5">

        {/* ── Row 1: Header ── */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-[15px] font-black leading-snug text-foreground line-clamp-2" title={task.title}>
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Row 2: Rewards as cute chips ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Points chip — treasure style */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1.5 ring-1 ring-amber-200/50 dark:ring-amber-700/30">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-300">{task.pointsReward} ⭐</span>
          </div>

          {/* Streak multiplier — fire style */}
          {streakMultiplier && streakMultiplier > 1 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-100/80 dark:bg-orange-900/30 px-2.5 py-1.5 ring-1 ring-orange-200/50 dark:ring-orange-700/30">
              <Sparkles className="h-3 w-3 text-orange-500 animate-star-twinkle" />
              <span className="text-[11px] font-black text-orange-600 dark:text-orange-400">×{streakMultiplier}</span>
            </div>
          )}

          {/* Status badge */}
          <div className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0",
            theme.badge
          )}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", theme.dot)} />
            {task.status === "in_progress" ? t("tasks.inProgress") : 
             task.status === "completed" ? t("tasks.completed") :
             task.status === "pending_approval" ? t("tasks.pendingApproval") :
             task.status === "overdue" ? t("tasks.overdue") :
             t("tasks.pending")}
          </div>
        </div>

        {/* ── Row 3: Dates — subtle ── */}
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

        {/* ── Row 3: Progress — fun striped bar ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t("taskRow.progress")}
            </span>
            <span className="text-xs font-black tabular-nums text-foreground">{progress}%</span>
          </div>
          {/* Fun gradient progress bar with stripes */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-300/80 dark:bg-slate-700/70 ring-1 ring-slate-400/50 dark:ring-slate-600/60 shadow-inner">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out progress-stripes shadow-sm",
                theme.progress
              )}
              style={{
                width: progress > 0 ? `${progress}%` : "0%",
                minWidth: progress > 0 ? "0.5rem" : undefined,
              }}
            />
            {progress >= 100 && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] animate-success-pop">🎉</div>
            )}
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

      {/* ───── Footer: Action bar — more playful ───── */}
      <div className={cn(
        "flex items-center gap-3 border-t px-5 py-3.5",
        "border-slate-100 dark:border-slate-800/60",
        "bg-gradient-to-r from-slate-50/50 via-white/30 to-slate-50/50 dark:from-slate-900/20 dark:via-background/30 dark:to-slate-900/20"
      )}>
        {/* ─ Left: Evidence actions ─ */}
        <div className="flex items-center gap-1.5">
          {evidenceReady && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
                  onClick={() => onViewEvidence(task)}
                  disabled={downloadLoading}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("taskRow.viewEvidence")}
              </TooltipContent>
            </Tooltip>
          )}

          {userType === "child" && requiresEvidence && !task.completed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => onUploadEvidence(task)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {evidenceReady ? t("taskRow.changeEvidence") : t("taskRow.submitEvidence")}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Child: Ask AI about this task */}
          {userType === "child" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-primary/10"
                  onClick={() => {
                    const detail = `${task.title}${task.description ? ': ' + task.description : ''}`
                    window.dispatchEvent(new CustomEvent("ai-widget:open-with-message", { detail }))
                    openAiChat()
                  }}
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("taskRow.askAi")}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Child: Ask parent about this task */}
          {userType === "child" && onAskParent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                  onClick={() => onAskParent(task)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("taskRow.askParent")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ─ Spacer ─ */}
        <div className="flex-1" />

        {/* ─ Right: Actions ─ */}
        <div className="flex items-center gap-2">
          {/* ─ Parent: context menu for Edit / Delete ─ */}
          {userType === "parent" && !task.completed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem
                  onClick={() => onEdit(task)}
                  disabled={updateLoading}
                  className="gap-2 cursor-pointer"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  {t("taskRow.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  disabled={deleteLoading}
                  className="gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("taskRow.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* ─ Primary actions ─ */}
          {/* Child: show "Complete" only if NOT pending_approval and NOT completed */}
          {!task.completed && !task.pendingApproval && userType === "child" && (
            requiresEvidence && !evidenceReady ? (
              <Button
                size="sm"
                className={cn(
                  "h-10 gap-2 rounded-2xl px-6 text-sm font-black text-white btn-bounce",
                  "bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600",
                  "shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35",
                  "transition-all duration-200 hover:scale-[1.03]"
                )}
                onClick={() => onUploadEvidence(task)}
              >
                <Upload className="h-4 w-4" />
                {t("taskRow.submitEvidence")} 📎
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "h-10 gap-2 rounded-2xl px-6 text-sm font-black text-white btn-bounce",
                  "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600",
                  "shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35",
                  "transition-all duration-200 hover:scale-[1.03]"
                )}
                onClick={() => onConfirm(task.id)}
                disabled={confirmLoading}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("taskRow.complete")} ✨
              </Button>
            )
          )}

          {/* Child: show "Waiting for approval" badge when pending */}
          {!task.completed && task.pendingApproval && userType === "child" && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30 px-4 py-2 text-sm font-black text-amber-700 dark:text-amber-300 shadow-sm animate-pulse">
              <Clock className="h-4 w-4" />
              {t("taskRow.waitingApproval")} ⏰
            </div>
          )}

          {/* Parent: show approve/reject only when pending_approval */}
          {!task.completed && task.pendingApproval && userType === "parent" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0 rounded-xl",
                      "text-red-500 hover:text-white hover:bg-red-500",
                      "dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600",
                      "border border-red-200 dark:border-red-800/60",
                      "transition-all duration-200"
                    )}
                    onClick={() => onReject(task)}
                  >
                    <X className="h-4.5 w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("taskRow.reject")}
                </TooltipContent>
              </Tooltip>
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
            </>
          )}

          {task.completed && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 px-4 py-2 text-sm font-black text-emerald-700 dark:text-emerald-300 shadow-sm animate-success-pop">
              <CheckCircle2 className="h-4 w-4" />
              {t("taskRow.completed")} 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
