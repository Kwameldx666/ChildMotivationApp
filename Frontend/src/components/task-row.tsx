"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, ChevronUp, Edit, Eye, Upload, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"

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

const EVIDENCE_META: Record<TaskEvidenceRequirement, { label: string; hint: string }> = {
  none: { label: "Без подтверждения", hint: "Можно завершить сразу" },
  photo: { label: "Фото", hint: "Подойдёт любой снимок результата" },
  video: { label: "Видео", hint: "Короткий ролик или сторис" },
  document: { label: "Документ", hint: "PDF или скан отчёта" },
}

interface TaskRowProps {
  task: DecoratedTask
  index: number
  userType: "parent" | "child"
  onConfirm: (id: string) => void
  onReject: (task: TaskDto) => void
  onUpload: (task: DecoratedTask) => void
  onViewEvidence: (task: DecoratedTask) => void
  onEdit: (task: DecoratedTask) => void
  isConfirming?: boolean
  isDownloading?: boolean
}

export default function TaskRow({ task, index, userType, onConfirm, onReject, onUpload, onViewEvidence, onEdit, isConfirming, isDownloading }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)

  const evidence = task.evidence ?? { requirement: "none", isSubmitted: false }
  const evidenceRequirement = (typeof evidence.requirement === "string" ? (evidence.requirement as TaskEvidenceRequirement) : "none")
  const evidenceMeta = EVIDENCE_META[evidenceRequirement]
  const requiresEvidence = evidenceRequirement !== "none"
  const evidenceReady = Boolean(evidence.isSubmitted)
  const evidenceStatusText = requiresEvidence ? (evidenceReady ? `Файл получен${evidence.uploadedAt ? ` · ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(new Date(evidence.uploadedAt))}` : ""}` : "Ждём файл от ребёнка") : "Можно завершить сразу"

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-sm">
      <div className={cn("flex items-center gap-4 p-4 md:p-5", task.accent?.gradient ?? "")}> 
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <Badge className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">{task.status ?? "—"}</Badge>
            <h4 className="truncate text-lg font-semibold text-foreground" title={task.title}>{task.title}</h4>
            <div className="ml-2 hidden sm:inline text-sm text-muted-foreground">• До {task.dueLabel}</div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="text-xs">{task.xpReward} XP</div>
              <div className="text-xs">• {task.pointsReward} pts</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-40 max-w-[40%]"><Progress value={Math.round(task.progressValue ?? 0)} className="h-2" /></div>
              <div className="text-xs font-semibold">{Math.round(task.progressValue ?? 0)}%</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4" />
            Ред.
          </Button>

          {userType === "child" && !task.completed && (
            <Button size="sm" className="gap-2" onClick={() => onConfirm(task.id)} disabled={isConfirming}>
              <CheckCircle2 className="h-4 w-4" />
              Сделано
            </Button>
          )}

          <button aria-label="Развернуть" className="ml-2 inline-flex items-center rounded-full p-2 text-muted-foreground hover:bg-muted" onClick={() => setExpanded((s) => !s)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/60 bg-background/40 p-4 md:p-5">
          <div className="text-sm text-muted-foreground mb-3">{task.description?.trim() || "Добавьте подробности, чтобы ребёнку было проще понять шаги."}</div>

          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <div className="rounded-md border border-border/60 px-3 py-2">
              <p className="text-[11px] uppercase text-muted-foreground">Создана</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{task.createdLabel}</p>
            </div>
            <div className="rounded-md border border-border/60 px-3 py-2">
              <p className="text-[11px] uppercase text-muted-foreground">План</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{task.dueLabel}</p>
            </div>
            <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
              <p className="text-[11px] uppercase text-primary">Контроль</p>
              <p className="mt-1 text-sm font-semibold text-primary">{evidenceMeta.label}</p>
              <p className="text-xs text-primary/80">{evidenceStatusText}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {requiresEvidence && !task.completed && (
                <>
                  {evidenceReady && (
                    <Button variant="outline" size="sm" onClick={() => onViewEvidence(task)} disabled={isDownloading}>
                      <Eye className="h-4 w-4" />
                      Посмотреть
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={() => onUpload(task)}>
                    <Upload className="h-4 w-4" />
                    {evidenceReady ? "Заменить файл" : "Отправить файл"}
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {userType === "parent" && !task.completed && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onReject(task)}>
                    Отклонить
                  </Button>
                  <Button size="sm" className="gap-2" onClick={() => onConfirm(task.id)} disabled={isConfirming}>
                    <CheckCircle2 className="h-4 w-4" />
                    Подтвердить
                  </Button>
                </>
              )}

              {task.completed && (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">Задача закрыта</Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
