"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"

/* ═══════════ Types ═══════════ */

export interface TourStep {
  /** CSS selector of the element to highlight (null = center modal) */
  target: string | null
  /** i18n key for step title */
  titleKey: string
  /** i18n key for step description */
  descriptionKey: string
  /** Emoji/icon shown in the tooltip */
  icon: string
  /** Preferred tooltip placement */
  placement?: "top" | "bottom" | "left" | "right"
  /** Callback before entering this step (e.g. switching tab) */
  onBeforeStep?: () => void
}

interface GuidedTourProps {
  steps: TourStep[]
  storageKey: string
  onComplete: () => void
}

/* ═══════════ Hook: first-visit check ═══════════ */

export function useFirstVisitTour(storageKey: string) {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = localStorage.getItem(storageKey)
    if (!seen) setShowTour(true)
  }, [storageKey])

  const completeTour = useCallback(() => {
    localStorage.setItem(storageKey, "1")
    setShowTour(false)
  }, [storageKey])

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey)
    setShowTour(true)
  }, [storageKey])

  return { showTour, completeTour, resetTour }
}

/* ═══════════ Component ═══════════ */

export default function GuidedTour({ steps, storageKey, onComplete }: GuidedTourProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[current]
  const isLast = current === steps.length - 1
  const isFirst = current === 0

  /* ---- resolve target element ---- */
  const resolveTarget = useCallback(() => {
    if (!step?.target) return null
    return document.querySelector(step.target)
  }, [step])

  /* ---- position spotlight ---- */
  const updateSpotlight = useCallback(() => {
    const el = resolveTarget()
    if (el) {
      const rect = el.getBoundingClientRect()
      setSpotlightRect(rect)
      el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    } else {
      setSpotlightRect(null)
    }
  }, [resolveTarget])

  useEffect(() => {
    step?.onBeforeStep?.()
    const timer = setTimeout(updateSpotlight, 200)
    return () => clearTimeout(timer)
  }, [current, step, updateSpotlight])

  useEffect(() => {
    window.addEventListener("resize", updateSpotlight)
    window.addEventListener("scroll", updateSpotlight, true)
    return () => {
      window.removeEventListener("resize", updateSpotlight)
      window.removeEventListener("scroll", updateSpotlight, true)
    }
  }, [updateSpotlight])

  /* ---- tooltip positioning ---- */
  const getTooltipStyle = useCallback((): React.CSSProperties => {
    if (!spotlightRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" }
    }

    const pad = 16
    const placement = step?.placement ?? "bottom"
    const cx = spotlightRect.left + spotlightRect.width / 2
    const tooltipWidth = 360

    const base: React.CSSProperties = { position: "fixed", maxWidth: tooltipWidth }

    switch (placement) {
      case "bottom":
        base.top = spotlightRect.bottom + pad
        base.left = Math.max(pad, Math.min(cx - tooltipWidth / 2, window.innerWidth - tooltipWidth - pad))
        break
      case "top":
        base.bottom = window.innerHeight - spotlightRect.top + pad
        base.left = Math.max(pad, Math.min(cx - tooltipWidth / 2, window.innerWidth - tooltipWidth - pad))
        break
      case "left":
        base.top = spotlightRect.top
        base.right = window.innerWidth - spotlightRect.left + pad
        break
      case "right":
        base.top = spotlightRect.top
        base.left = spotlightRect.right + pad
        break
    }

    return base
  }, [spotlightRect, step])

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrent((p) => p + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) setCurrent((p) => p - 1)
  }

  const handleSkip = () => {
    onComplete()
  }

  /* ---- SVG spotlight mask ---- */
  const padding = 8
  const radius = 12

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - padding}
                y={spotlightRect.top - padding}
                width={spotlightRect.width + padding * 2}
                height={spotlightRect.height + padding * 2}
                rx={radius}
                ry={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={handleSkip}
        />
      </svg>

      {/* Animated ring around target */}
      {spotlightRect && (
        <div
          className="fixed border-2 border-primary rounded-xl animate-pulse pointer-events-none"
          style={{
            top: spotlightRect.top - padding,
            left: spotlightRect.left - padding,
            width: spotlightRect.width + padding * 2,
            height: spotlightRect.height + padding * 2,
            boxShadow: "0 0 0 4px rgba(var(--primary-rgb, 99 102 241) / 0.3), 0 0 20px rgba(var(--primary-rgb, 99 102 241) / 0.15)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className={cn(
          "z-[10000] rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl p-5",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl">
              {step.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{t(step.titleKey)}</h3>
              <span className="text-[10px] text-muted-foreground">
                {current + 1} / {steps.length}
              </span>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {t(step.descriptionKey)}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-primary" : i < current ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted-foreground/20"
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1 text-xs">
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("common.back")}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground">
            {t("tour.skip")}
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1.5 text-xs bg-gradient-to-r from-primary to-primary/80"
          >
            {isLast ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {t("tour.finish")}
              </>
            ) : (
              <>
                {t("common.next")}
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
