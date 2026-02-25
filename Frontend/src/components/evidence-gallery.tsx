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
    <div className="space-y-6 animate-slide-up">
      {/* Fun header with filters */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500/8 via-rose-500/5 to-fuchsia-500/8 dark:from-pink-500/12 dark:via-rose-500/8 dark:to-fuchsia-500/12 border border-pink-500/15 p-5">
        <div className="absolute -top-4 -right-4 text-6xl opacity-[0.06] select-none pointer-events-none animate-hero-float">📸</div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black">{t("gallery.title") || "Галерея подтверждений"}</h2>
            <p className="text-sm text-muted-foreground">{t("gallery.subtitle") || "Все твои доказательства выполненных заданий"}</p>
          </div>
          {evidenceItems.length > 0 && (
            <div className="shrink-0 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-400/20">
              <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                📷 {evidenceItems.length}
              </span>
            </div>
          )}
        </div>
        
        {/* Filters as cute pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "pending", "in_progress", "completed", "overdue"].map(status => {
            const isActive = statusFilter === status
            const emoji = status === "all" ? "🌈" : status === "completed" ? "✅" : status === "pending" ? "⏳" : status === "in_progress" ? "🔨" : "⚠️"
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 btn-bounce",
                  isActive
                    ? "bg-white dark:bg-slate-800 shadow-md shadow-pink-500/10 scale-105 text-foreground ring-1 ring-pink-300/40 dark:ring-pink-600/30"
                    : "text-muted-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-foreground",
                )}
              >
                <span>{emoji}</span>
                {t(`tasksList.filters.${status}`) || status}
                <span className={cn(
                  "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold",
                  isActive ? "bg-pink-500/15 text-pink-600 dark:text-pink-400" : "bg-muted/50"
                )}>
                  {evidenceItems.filter((e: EvidenceItem) => 
                    status === "all" ? true : 
                    status === "completed" ? e.task.completed : 
                    !e.task.completed
                  ).length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Gallery Grid — scrapbook style */}
      {evidenceItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {evidenceItems.map((item: EvidenceItem, index: number) => (
            <button
              key={item.task.id}
              onClick={() => setViewingEvidence(item)}
              className="group relative overflow-hidden rounded-2xl border-2 border-border/20 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 child-card-hover animate-card-appear bg-card"
              style={{ animationDelay: `${index * 60}ms` }}
              title={item.task.title}
            >
              {item.loadingError ? (
                <div className="w-full aspect-square bg-gradient-to-br from-muted/50 to-muted/30 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-medium">Ошибка</span>
                </div>
              ) : item.thumbnailUrl ? (
                <>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.task.title}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
                    <div className="w-full">
                      <p className="text-white text-xs font-bold line-clamp-1 mb-1">{item.task.title}</p>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-white/80" />
                        <span className="text-[10px] text-white/80">{t("gallery.view") || "Посмотреть"}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary/5 to-muted/20 animate-pulse flex items-center justify-center">
                  <div className="text-2xl animate-kid-bounce">📷</div>
                </div>
              )}

              {/* Status badge — cute sticker style */}
              <div className="absolute top-2 right-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md",
                  item.task.completed 
                    ? "bg-emerald-400 text-white" 
                    : "bg-amber-400 text-white"
                )}>
                  {item.task.completed ? "✓" : "!"}
                </div>
              </div>

              {/* Fun bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/40 to-transparent opacity-100 group-hover:opacity-0 transition-opacity">
                <p className="text-white text-[10px] font-bold line-clamp-1">{item.task.title}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-border/30 py-16 text-center">
          <div className="text-5xl mb-4 animate-kid-bounce">📷</div>
          <h3 className="text-lg font-bold mb-1">{t("gallery.noEvidence") || "Пока пусто"}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Выполняй задания и загружай фото — здесь появится твоя галерея!
          </p>
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
