"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import type { TaskDto, TaskEvidenceRequirement } from "@/services/tasks-service"
import { tasksService } from "@/services/tasks-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileIcon,
  FileText,
  Film,
  Image as PhotoIcon,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

interface EvidenceGalleryProps {
  tasks: TaskDto[]
  userType: "parent" | "child"
}

type TaskStatusFilter = "all" | "pending" | "in_progress" | "completed" | "overdue"
type MediaFilter = "all" | "photo" | "video" | "document"
type EvidenceKind = Exclude<MediaFilter, "all">

interface EvidenceItem {
  task: TaskDto
  previewUrl: string
  contentType: string
  kind: EvidenceKind
  uploadedAt?: string | null
  loadingError?: boolean
}

const STATUS_LABEL_KEYS: Record<TaskStatusFilter, string> = {
  all: "tasksList.filters.all",
  pending: "tasksList.filters.pending",
  in_progress: "tasksList.filters.inProgress",
  completed: "tasksList.filters.completed",
  overdue: "tasksList.filters.overdue",
}

function resolveEvidenceRequirement(value?: string | number | null): TaskEvidenceRequirement {
  if (typeof value === "number") {
    switch (value) {
      case 1:
        return "photo"
      case 2:
        return "video"
      case 3:
        return "document"
      default:
        return "none"
    }
  }

  const normalized = typeof value === "string" ? value.toLowerCase() : "none"
  if (normalized === "photo" || normalized === "video" || normalized === "document") {
    return normalized
  }
  return "none"
}

function resolveEvidenceKind(task: TaskDto, contentType?: string | null): EvidenceKind {
  const normalizedType = (contentType ?? "").toLowerCase()
  if (normalizedType.startsWith("image/")) return "photo"
  if (normalizedType.startsWith("video/")) return "video"

  const requirement = resolveEvidenceRequirement(task.evidence?.requirement)
  if (requirement === "photo" || requirement === "video" || requirement === "document") {
    return requirement
  }

  return "document"
}

function mapTaskStatus(task: TaskDto): Exclude<TaskStatusFilter, "all"> {
  if (task.completed) return "completed"
  if (task.pendingApproval || task.startedByChild) return "in_progress"

  const createdAt = new Date(task.createdAt)
  if (!Number.isNaN(createdAt.getTime())) {
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / 86_400_000
    if (daysSinceCreation > 10) return "overdue"
  }

  return "pending"
}

export default function EvidenceGallery({ tasks, userType }: EvidenceGalleryProps) {
  const { t, locale } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all")
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all")
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([])
  const [loadedTaskIds, setLoadedTaskIds] = useState<Set<string>>(new Set())
  const [viewingEvidence, setViewingEvidence] = useState<EvidenceItem | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const objectUrlsRef = useRef<Set<string>>(new Set())

  const tt = (key: string, fallback: string, params?: Record<string, string | number>) => {
    const value = t(key, params)
    return value === key ? fallback : value
  }

  const sourceTasks = useMemo(() => {
    return tasks.filter((task) => task.evidence?.isSubmitted)
  }, [tasks])

  useEffect(() => {
    let cancelled = false
    const tasksToLoad = sourceTasks.filter((task) => !loadedTaskIds.has(task.id))
    if (tasksToLoad.length === 0) {
      return
    }

    const loadEvidence = async () => {
      for (const task of tasksToLoad) {
        try {
          const blob = await tasksService.downloadEvidence(task.id)
          if (cancelled) return

          const previewUrl = URL.createObjectURL(blob)
          objectUrlsRef.current.add(previewUrl)

          const contentType = (task.evidence?.contentType || blob.type || "application/octet-stream").toLowerCase()
          const kind = resolveEvidenceKind(task, contentType)

          setEvidenceItems((previous) => {
            if (previous.some((item) => item.task.id === task.id)) {
              return previous
            }
            return [
              ...previous,
              {
                task,
                previewUrl,
                contentType,
                kind,
                uploadedAt: task.evidence?.uploadedAt ?? task.updatedAt ?? task.createdAt,
              },
            ]
          })
        } catch {
          if (cancelled) return

          const contentType = (task.evidence?.contentType || "application/octet-stream").toLowerCase()
          const kind = resolveEvidenceKind(task, contentType)
          setEvidenceItems((previous) => {
            if (previous.some((item) => item.task.id === task.id)) {
              return previous
            }
            return [
              ...previous,
              {
                task,
                previewUrl: "",
                contentType,
                kind,
                uploadedAt: task.evidence?.uploadedAt ?? task.updatedAt ?? task.createdAt,
                loadingError: true,
              },
            ]
          })
        } finally {
          if (!cancelled) {
            setLoadedTaskIds((previous) => {
              const next = new Set(previous)
              next.add(task.id)
              return next
            })
          }
        }
      }
    }

    void loadEvidence()

    return () => {
      cancelled = true
    }
  }, [loadedTaskIds, sourceTasks])

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
      objectUrlsRef.current.clear()
    }
  }, [])

  const normalizedItems = useMemo(() => {
    const sourceTaskIds = new Set(sourceTasks.map((task) => task.id))
    return evidenceItems.filter((item) => sourceTaskIds.has(item.task.id))
  }, [evidenceItems, sourceTasks])

  const statusCounts = useMemo(() => {
    return normalizedItems.reduce(
      (acc, item) => {
        const status = mapTaskStatus(item.task)
        acc.all += 1
        acc[status] += 1
        return acc
      },
      { all: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 } as Record<TaskStatusFilter, number>,
    )
  }, [normalizedItems])

  const mediaCounts = useMemo(() => {
    return normalizedItems.reduce(
      (acc, item) => {
        acc.all += 1
        acc[item.kind] += 1
        return acc
      },
      { all: 0, photo: 0, video: 0, document: 0 } as Record<MediaFilter, number>,
    )
  }, [normalizedItems])

  const filteredItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const status = mapTaskStatus(item.task)
      const statusMatch = statusFilter === "all" || status === statusFilter
      const mediaMatch = mediaFilter === "all" || item.kind === mediaFilter
      return statusMatch && mediaMatch
    })
  }, [mediaFilter, normalizedItems, statusFilter])

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    const dateLocale = locale === "ru" ? "ru-RU" : locale === "ro" ? "ro-RO" : "en-US"
    return new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getTypeBadge = (kind: EvidenceKind) => {
    if (kind === "photo") {
      return {
        icon: <PhotoIcon className="h-3.5 w-3.5" />,
        label: tt("gallery.photoType", "Photo"),
        style: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
      }
    }
    if (kind === "video") {
      return {
        icon: <Film className="h-3.5 w-3.5" />,
        label: tt("gallery.videoType", "Video"),
        style: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
      }
    }

    return {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: tt("gallery.documentType", "Document"),
      style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    }
  }

  const closeViewer = () => {
    setViewingEvidence(null)
    setImageZoom(1)
  }

  const navigateEvidence = (direction: "next" | "prev") => {
    if (!viewingEvidence || filteredItems.length === 0) return
    const currentIndex = filteredItems.findIndex((item) => item.task.id === viewingEvidence.task.id)
    if (currentIndex < 0) return

    if (direction === "next" && currentIndex < filteredItems.length - 1) {
      setViewingEvidence(filteredItems[currentIndex + 1])
      setImageZoom(1)
    }

    if (direction === "prev" && currentIndex > 0) {
      setViewingEvidence(filteredItems[currentIndex - 1])
      setImageZoom(1)
    }
  }

  return (
    <div className="space-y-5 animate-slide-up" data-user-type={userType}>
      <div className="relative overflow-hidden rounded-3xl border border-pink-500/15 bg-gradient-to-r from-pink-500/8 via-rose-500/5 to-fuchsia-500/8 p-5 dark:from-pink-500/12 dark:via-rose-500/8 dark:to-fuchsia-500/12">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg shadow-pink-500/20">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black">{tt("gallery.mediaLibrary", tt("gallery.title", "Evidence Gallery"))}</h2>
            <p className="text-sm text-muted-foreground">{tt("gallery.mediaSubtitle", tt("gallery.subtitle", "All submitted photos, videos, and documents"))}</p>
          </div>
          <Badge className="rounded-full border-pink-400/30 bg-pink-500/10 text-pink-600 dark:text-pink-400">
            {tt("gallery.filesCount", "Files")}: {normalizedItems.length}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {tt("gallery.statusFilters", "Status")}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "pending", "in_progress", "completed", "overdue"] as TaskStatusFilter[]).map((status) => {
              const isActive = statusFilter === status
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                    isActive
                      ? "scale-105 bg-white text-foreground shadow-md ring-1 ring-pink-300/40 dark:bg-slate-800 dark:ring-pink-600/30"
                      : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-slate-800/60",
                  )}
                >
                  {t(STATUS_LABEL_KEYS[status])}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", isActive ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" : "bg-muted/50")}>
                    {statusCounts[status]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {tt("gallery.mediaFilters", "Media type")}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: "all", label: tt("gallery.allMedia", "All") },
              { id: "photo", label: tt("gallery.photoType", "Photo") },
              { id: "video", label: tt("gallery.videoType", "Video") },
              { id: "document", label: tt("gallery.documentType", "Document") },
            ] as { id: MediaFilter; label: string }[]).map((filter) => {
              const isActive = mediaFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setMediaFilter(filter.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                    isActive
                      ? "scale-105 bg-white text-foreground shadow-md ring-1 ring-pink-300/40 dark:bg-slate-800 dark:ring-pink-600/30"
                      : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-slate-800/60",
                  )}
                >
                  {filter.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", isActive ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" : "bg-muted/50")}>
                    {mediaCounts[filter.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, index) => {
            const typeBadge = getTypeBadge(item.kind)
            const status = mapTaskStatus(item.task)
            return (
              <button
                key={item.task.id}
                onClick={() => setViewingEvidence(item)}
                className="group overflow-hidden rounded-2xl border border-border/30 bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ animationDelay: `${index * 50}ms` }}
                title={item.task.title}
              >
                <div className="relative aspect-video bg-muted/20">
                  {item.loadingError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <FileIcon className="h-6 w-6" />
                      <span className="text-[11px]">{tt("gallery.fileUnavailable", "File unavailable")}</span>
                    </div>
                  ) : item.kind === "photo" ? (
                    <img src={item.previewUrl} alt={item.task.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : item.kind === "video" ? (
                    <video src={item.previewUrl} className="h-full w-full object-cover" muted preload="metadata" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-100/40 to-orange-100/30 dark:from-amber-900/20 dark:to-orange-900/10">
                      <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{tt("gallery.documentType", "Document")}</span>
                    </div>
                  )}

                  <div className="absolute left-2 top-2">
                    <Badge className={cn("inline-flex items-center gap-1 rounded-full border-0 text-[10px] font-bold", typeBadge.style)}>
                      {typeBadge.icon}
                      {typeBadge.label}
                    </Badge>
                  </div>

                  <div className="absolute right-2 top-2">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-white shadow",
                      status === "completed" ? "bg-emerald-500" : "bg-amber-500",
                    )}>
                      {status === "completed" ? "✓" : "!"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 p-3">
                  <p className="line-clamp-1 text-sm font-bold text-foreground">{item.task.title}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{tt("gallery.uploadedAt", "Uploaded")}: {formatDateTime(item.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t(STATUS_LABEL_KEYS[status])}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-border/30 py-16 text-center">
          <div className="mb-4 text-5xl">📷</div>
          <h3 className="mb-1 text-lg font-bold">{tt("gallery.noEvidence", "No evidence")}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {tt("gallery.emptyHint", "Upload photos, videos, or documents to build your media library.")}
          </p>
        </div>
      )}

      {viewingEvidence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={closeViewer}
        >
          <button
            onClick={closeViewer}
            className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {filteredItems.length > 1 && (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  navigateEvidence("prev")
                }}
                className="absolute left-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                ←
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  navigateEvidence("next")
                }}
                className="absolute right-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                →
              </button>
            </>
          )}

          <div
            className="relative flex w-full max-w-5xl flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-xl bg-black/50 shadow-2xl ring-1 ring-white/10">
              {viewingEvidence.loadingError ? (
                <div className="flex h-[60vh] items-center justify-center text-white/50">
                  <FileIcon className="h-12 w-12" />
                </div>
              ) : viewingEvidence.kind === "photo" ? (
                <div className="flex max-h-[70vh] items-center justify-center bg-black">
                  <img
                    src={viewingEvidence.previewUrl}
                    alt={viewingEvidence.task.title}
                    className="max-h-[70vh] max-w-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${imageZoom})` }}
                  />
                </div>
              ) : viewingEvidence.kind === "video" ? (
                <video src={viewingEvidence.previewUrl} controls className="max-h-[70vh] w-full object-contain" />
              ) : (
                <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-white/70">
                  <FileText className="h-14 w-14" />
                  <p className="text-sm">{tt("gallery.documentType", "Document")}</p>
                </div>
              )}

              {viewingEvidence.kind === "photo" && !viewingEvidence.loadingError && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-black/60 p-2 backdrop-blur-sm ring-1 ring-white/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                    disabled={imageZoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[3ch] px-2 text-xs font-medium tabular-nums text-white/70">{Math.round(imageZoom * 100)}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                    disabled={imageZoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 h-6 w-px bg-white/10" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(1)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-4 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <h3 className="text-sm font-semibold text-white">{viewingEvidence.task.title}</h3>
                  {viewingEvidence.task.description && (
                    <p className="text-xs text-white/70">{viewingEvidence.task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <Badge className="rounded-full border-white/10 bg-white/10 text-white">
                      {getTypeBadge(viewingEvidence.kind).label}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {tt("gallery.uploadedAt", "Uploaded")}: {formatDateTime(viewingEvidence.uploadedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-start md:justify-end">
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                    onClick={() => {
                      if (!viewingEvidence.previewUrl) return
                      const link = document.createElement("a")
                      link.href = viewingEvidence.previewUrl
                      link.download = viewingEvidence.task.evidence?.fileName || `evidence-${viewingEvidence.task.id}`
                      link.click()
                    }}
                  >
                    <Download className="h-4 w-4" />
                    {tt("gallery.download", "Download")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
