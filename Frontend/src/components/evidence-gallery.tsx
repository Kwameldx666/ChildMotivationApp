"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import type { TaskDto } from "@/services/tasks-service"
import { tasksService } from "@/services/tasks-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"
import { Eye, X, Download, ZoomIn, ZoomOut, Calendar, FileIcon, CheckCircle2 } from "lucide-react"

interface EvidenceItem {
  task: TaskDto
  thumbnailUrl: string
  loadingError?: boolean
}

interface EvidenceGalleryProps {
  tasks: TaskDto[]
  userType: "parent" | "child"
}

export default function EvidenceGallery({ tasks, userType }: EvidenceGalleryProps) {
  const { t } = useTranslation()
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([])
  const [viewingEvidence, setViewingEvidence] = useState<EvidenceItem | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "overdue">("all")
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set())

  // Filter tasks with evidence
  const tasksWithEvidence = useMemo(() => {
    return tasks.filter(task => 
      task.evidence?.isSubmitted && 
      (statusFilter === "all" || 
        (statusFilter === "completed" && task.completed) ||
        (statusFilter !== "completed" && !task.completed))
    )
  }, [tasks, statusFilter])

  // Load thumbnails
  useEffect(() => {
    const loadThumbnails = async (): Promise<void> => {
      for (const task of tasksWithEvidence) {
        if (loadedThumbnails.has(task.id)) continue
        
        try {
          const blob = await tasksService.downloadEvidence(task.id)
          const url = URL.createObjectURL(blob)
          setEvidenceItems((prev: EvidenceItem[]) => {
            const existing = prev.find((e: EvidenceItem) => e.task.id === task.id)
            if (existing) return prev
            return [...prev, { task, thumbnailUrl: url }]
          })
          setLoadedThumbnails((prev: Set<string>) => new Set([...prev, task.id]))
        } catch {
          setEvidenceItems((prev: EvidenceItem[]) => {
            const existing = prev.find((e: EvidenceItem) => e.task.id === task.id)
            if (existing) return prev
            return [...prev, { task, thumbnailUrl: "", loadingError: true }]
          })
        }
      }
    }

    loadThumbnails()
  }, [tasksWithEvidence, loadedThumbnails])

  const handleCloseViewer = () => {
    if (viewingEvidence?.thumbnailUrl) {
      URL.revokeObjectURL(viewingEvidence.thumbnailUrl)
    }
    setViewingEvidence(null)
    setImageZoom(1)
  }

  const handleNextImage = () => {
    if (!viewingEvidence) return
    const currentIndex = evidenceItems.findIndex((e: EvidenceItem) => e.task.id === viewingEvidence.task.id)
    if (currentIndex < evidenceItems.length - 1) {
      setViewingEvidence(evidenceItems[currentIndex + 1])
      setImageZoom(1)
    }
  }

  const handlePrevImage = () => {
    if (!viewingEvidence) return
    const currentIndex = evidenceItems.findIndex((e: EvidenceItem) => e.task.id === viewingEvidence.task.id)
    if (currentIndex > 0) {
      setViewingEvidence(evidenceItems[currentIndex - 1])
      setImageZoom(1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-foreground">{t("gallery.title") || "Галерея подтверждений"}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t("gallery.filter") || "Фильтр"}:</span>
          {["all", "pending", "in_progress", "completed", "overdue"].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status as any)}
              className="text-xs"
            >
              {t(`tasksList.filters.${status}`) || status}
              <span className="ml-1 text-[10px] opacity-70">
                ({evidenceItems.filter((e: EvidenceItem) => 
                  status === "all" ? true : 
                  status === "completed" ? e.task.completed : 
                  !e.task.completed
                ).length})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {evidenceItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {evidenceItems.map((item: EvidenceItem) => (
            <button
              key={item.task.id}
              onClick={() => setViewingEvidence(item)}
              className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
              title={item.task.title}
            >
              {item.loadingError ? (
                <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : item.thumbnailUrl ? (
                <>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.task.title}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="w-full aspect-square bg-muted animate-pulse" />
              )}

              {/* Status badge */}
              <div className="absolute top-1 right-1">
                <Badge
                  className={cn(
                    "text-[8px] font-bold rounded-full px-1.5 py-0.5",
                    item.task.completed 
                      ? "bg-emerald-500/80 text-white" 
                      : "bg-amber-500/80 text-white"
                  )}
                >
                  {item.task.completed ? "✓" : "!"}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileIcon className="h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">{t("gallery.noEvidence") || "Нет доказательств для отображения"}</p>
        </div>
      )}

      {/* Evidence Viewer Modal */}
      {viewingEvidence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={handleCloseViewer}
        >
          {/* Close button */}
          <button
            onClick={handleCloseViewer}
            className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows */}
          {evidenceItems.length > 1 && (
            <>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handlePrevImage() }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!evidenceItems.find((e: EvidenceItem) => e.task.id === viewingEvidence?.task.id) || 
                  evidenceItems.findIndex((e: EvidenceItem) => e.task.id === viewingEvidence?.task.id) === 0}
              >
                ←
              </button>
              <button
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleNextImage() }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!evidenceItems.find((e: EvidenceItem) => e.task.id === viewingEvidence?.task.id) || 
                  evidenceItems.findIndex((e: EvidenceItem) => e.task.id === viewingEvidence?.task.id) === evidenceItems.length - 1}
              >
                →
              </button>
            </>
          )}

          {/* Main container */}
          <div
            className="relative w-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-300"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Media viewer */}
            <div className="relative bg-black/50 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
              {viewingEvidence.thumbnailUrl ? (
                <div className="flex items-center justify-center bg-black max-h-[70vh]">
                  <img
                    src={viewingEvidence.thumbnailUrl}
                    alt={viewingEvidence.task.title}
                    className="transition-transform duration-200 max-w-full max-h-[70vh] object-contain"
                    style={{ transform: `scale(${imageZoom})` }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-black/50 text-white/50">
                  <FileIcon className="h-12 w-12" />
                </div>
              )}

              {/* Zoom controls */}
              {viewingEvidence.thumbnailUrl && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 rounded-lg p-2 ring-1 ring-white/10 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                    disabled={imageZoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-white/70 px-2 tabular-nums min-w-[3ch]">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                    disabled={imageZoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={() => setImageZoom(1)}
                    title="Reset zoom"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Task info */}
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-xl border border-white/10 p-4 backdrop-blur-sm">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  {viewingEvidence.task.title}
                </h3>
                {viewingEvidence.task.description && (
                  <p className="text-xs text-white/60">
                    {viewingEvidence.task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Badge
                    className={cn(
                      "text-[10px] font-bold rounded-full px-2 py-0.5",
                      viewingEvidence.task.completed
                        ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
                        : "bg-blue-500/30 text-blue-300 border-blue-500/50"
                    )}
                  >
                    {viewingEvidence.task.completed ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("tasksList.status.completed")}</> 
                    ) : (
                      <>⏳ {t("tasksList.status.inProgress")}</>
                    )}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(viewingEvidence.task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {evidenceItems.length > 1 && (
              <div className="text-xs text-white/50 text-center">
                {evidenceItems.findIndex(e => e.task.id === viewingEvidence.task.id) + 1} / {evidenceItems.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
