"use client"

import type { LucideIcon } from "lucide-react"
import { Edit, Eye, Upload, CheckCircle2, AlertCircle, FileCheck, BookOpen, Zap, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"
import { useTranslation } from "@/i18n/provider"

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

export default function TaskRow({ 
  task, 
  userType, 
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
    photo: { label: t("taskRow.evidencePhoto"), icon: Eye, color: "text-blue-600" },
    video: { label: t("taskRow.evidenceVideo"), icon: FileCheck, color: "text-purple-600" },
    document: { label: t("taskRow.evidenceDocument"), icon: BookOpen, color: "text-orange-600" },
  }

  const evidence = task.evidence ?? { requirement: "none", isSubmitted: false }
  const evidenceRequirement = (typeof evidence.requirement === "string" ? (evidence.requirement as TaskEvidenceRequirement) : "none")
  const evidenceMeta = EVIDENCE_META[evidenceRequirement]
  const requiresEvidence = evidenceRequirement !== "none"
  const evidenceReady = Boolean(evidence.isSubmitted)
  
  // Status color mapping
  const getStatusColors = (status?: string) => {
    switch(status) {
      case "completed": return { badge: "bg-emerald-100 text-emerald-800", border: "border-emerald-200" }
      case "in_progress": return { badge: "bg-blue-100 text-blue-800", border: "border-blue-200" }
      case "overdue": return { badge: "bg-red-100 text-red-800", border: "border-red-200" }
      default: return { badge: "bg-slate-100 text-slate-800", border: "border-slate-200" }
    }
  }

  const statusColors = getStatusColors(task.status)
  const IconComponent = evidenceMeta?.icon || FileCheck

  return (
    <div className={cn(
      "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
      statusColors.border,
      task.status === "completed" 
        ? "from-emerald-50/50 via-white to-emerald-50/30 opacity-75" 
        : task.status === "overdue"
        ? "from-red-50/50 via-white to-orange-50/30"
        : "from-white via-white to-muted/30"
    )}>
      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-foreground line-clamp-2" title={task.title}>
            {task.title}
          </h4>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <Badge className={cn("rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-wide flex-shrink-0", statusColors.badge)}>
          {task.status === "in_progress" ? t("tasks.inProgress") : 
           task.status === "completed" ? t("tasks.completed") :
           task.status === "overdue" ? t("tasks.overdue") :
           t("tasks.pending")}
        </Badge>
      </div>

      {/* Info Grid: Points, XP, Progress, Dates */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-primary">{task.xpReward} XP</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-100/50 px-2 py-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-semibold text-amber-700">{task.pointsReward} PTS</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-xs text-slate-600">{t("taskRow.created")}: {task.createdLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-xs text-slate-600">{t("taskRow.dueTo", { date: task.dueLabel })}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Progreso</span>
          <span className="text-xs font-bold text-foreground">{Math.round(task.progressValue ?? 0)}%</span>
        </div>
        <Progress value={Math.round(task.progressValue ?? 0)} className="h-2.5 rounded-full" />
      </div>

      {/* Evidence Status */}
      {requiresEvidence && (
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
          evidenceReady 
            ? "bg-emerald-100/70 text-emerald-700" 
            : "bg-amber-100/70 text-amber-700"
        )}>
          <IconComponent className="h-4 w-4" />
          <span>{evidenceReady ? `✓ ${evidenceMeta.label} Enviado` : `⚠ Requiere ${evidenceMeta.label}`}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-2">
          {/* Evidence actions for child */}
          {userType === "child" && requiresEvidence && !task.completed && (
            <>
              {evidenceReady && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => onViewEvidence(task)} 
                  disabled={downloadLoading}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => onUploadEvidence(task)}
              >
                <Upload className="h-3.5 w-3.5" />
                {evidenceReady ? "Cambiar" : "Enviar"}
              </Button>
            </>
          )}

          {/* Edit & Delete for parent */}
          {userType === "parent" && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => onEdit(task)}
                disabled={updateLoading}
              >
                <Edit className="h-3.5 w-3.5" />
                Editar
              </Button>
              {!task.completed && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={() => onDelete(task.id)}
                  disabled={deleteLoading}
                >
                  Eliminar
                </Button>
              )}
            </>
          )}
        </div>

        {/* Completion action */}
        <div className="flex gap-2">
          {!task.completed && userType === "child" && (
            <Button 
              size="sm" 
              className="h-8 gap-1 text-xs font-semibold"
              onClick={() => onConfirm(task.id)} 
              disabled={confirmLoading}
            >
              <CheckCircle2 className="h-4 w-4" />
              Completar
            </Button>
          )}

          {!task.completed && userType === "parent" && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => onReject(task)}
              >
                Rechazar
              </Button>
              <Button 
                size="sm" 
                className="h-8 gap-1 text-xs font-semibold"
                onClick={() => onConfirm(task.id)} 
                disabled={confirmLoading}
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprobar
              </Button>
            </div>
          )}

          {task.completed && (
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold h-fit">
              ✓ Completado
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
