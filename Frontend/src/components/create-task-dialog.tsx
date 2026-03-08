"use client"

import { FormEvent, useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCreateTask, useTasks } from "@/services/tasks-queries"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Sparkles, Camera, CameraOff, Star, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { aiService } from "@/services/ai-service"
import { useFamilyMembers } from "@/services/family-queries"
import { useTranslation } from "@/i18n/provider"
import { useSubscriptionGate } from "@/hooks/use-subscription-gate"
import { mapApiError } from "@/features/auth/utils/mapApiError"

const QUICK_IDEAS = [
  { emoji: "🧹", text: "createTaskDialog.quickIdeas.cleanRoom" },
  { emoji: "📚", text: "createTaskDialog.quickIdeas.readBook" },
  { emoji: "🍽️", text: "createTaskDialog.quickIdeas.helpWithDinner" },
  { emoji: "🏃", text: "createTaskDialog.quickIdeas.doExercise" },
  { emoji: "🛏️", text: "createTaskDialog.quickIdeas.makeBed" },
  { emoji: "🧺", text: "createTaskDialog.quickIdeas.foldClothes" },
]

const DIFFICULTY_POINTS: Record<number, number> = {
  1: 5, 2: 10, 3: 15, 4: 25, 5: 40,
}

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
  const { toast } = useToast()
  const { t, locale } = useTranslation()
  const createTask = useCreateTask()
  const { hasFeature, isWithinLimit, getLimit } = useSubscriptionGate()
  const canUseAi = hasFeature('aiAssistant')

  const { data: allTasks = [] } = useTasks()
  const todayTaskCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return allTasks.filter((task: any) => {
      const created = task.createdAt ?? task.created_at ?? ''
      return created.slice(0, 10) === today
    }).length
  }, [allTasks])
  const taskLimitReached = !isWithinLimit('maxTasksPerDay', todayTaskCount)
  const maxTasksPerDay = getLimit('maxTasksPerDay')

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [difficulty, setDifficulty] = useState(2)
  const [showExtra, setShowExtra] = useState(false)

  const { data: familyMembers = [] } = useFamilyMembers()
  const children = familyMembers.filter(member => member.role === 'child')
  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (children.length === 1) setSelectedChild(children[0].id)
  }, [children])

  useEffect(() => {
    if (!open) {
      setTitle("")
      setDescription("")
      setDueDate("")
      setDifficulty(2)
      setShowExtra(false)
      setIsAiGenerating(false)
    }
  }, [open])

  const canSubmit = !taskLimitReached
    && title.trim().length >= 2
    && (children.length <= 1 || !!selectedChild)

  /* Generate with AI — fills in title/description/difficulty from a short prompt */
  const handleAiGenerate = async () => {
    if (isAiGenerating) return
    const prompt = (title.trim() || description.trim())
    if (!prompt) return

    setIsAiGenerating(true)
    try {
      const childInfo = children.find(c => c.id === selectedChild) ?? children[0]
      const resp = await aiService.getTaskSuggestions({
        childId: childInfo?.id,
        childAge: (childInfo as any)?.age ?? undefined,
        tone: locale === 'ru' ? 'дружелюбный' : locale === 'ro' ? 'prietenos' : 'friendly',
        language: locale,
        taskDescription: prompt,
      })
      const first = resp?.suggestions?.[0]
      if (first) {
        if (first.title) setTitle(first.title)
        if (first.description) setDescription(first.description)
        if (first.difficulty) setDifficulty(Math.min(Math.max(first.difficulty, 1), 5))
        toast({ title: t("createTaskDialog.aiFilledToast") })
      }
    } catch (err) {
      console.warn('[create-task] AI generation failed', err)
      toast({ title: t("common.error"), description: t("createTaskDialog.aiError"), variant: "destructive" })
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!canSubmit || isSubmitting) return

    try {
      setIsSubmitting(true)

      await createTask.mutateAsync({
        title: title.trim().substring(0, 50),
        description: description.trim() || title.trim(),
        confirmationType: requiresConfirmation ? "photo" : "none",
        difficulty,
        dueDate: dueDate || undefined,
        assignedToUserId: selectedChild || undefined,
      })

      toast({ title: t("createTaskDialog.taskCreatedToast") })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: mapApiError(error, t("createTaskDialog.createError")),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit && !isSubmitting) {
      e.preventDefault()
      handleSubmit()
    }
  }, [canSubmit, isSubmitting, handleSubmit])

  const computedXP = 60 + 20 * difficulty
  const computedPoints = DIFFICULTY_POINTS[difficulty]
  const busy = isSubmitting || isAiGenerating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-semibold">{t("createTaskDialog.title")}</DialogTitle>
        </DialogHeader>

        {/* Task limit warning */}
        {taskLimitReached && (
          <div className="mx-5 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            {t("featureGate.taskLimitReached", { limit: maxTasksPerDay, count: todayTaskCount })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 pb-4 space-y-3">
            {/* Title */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("createTaskDialog.titleLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("createTaskDialog.titlePlaceholder")}
                className="rounded-xl bg-muted/30 h-11 text-base"
                disabled={busy}
                autoFocus
              />
            </div>

            {/* Quick ideas — shown when title is empty */}
            {title.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea.text}
                    type="button"
                    onClick={() => setTitle(t(idea.text))}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <span>{idea.emoji}</span>
                    <span>{t(idea.text)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("createTaskDialog.descriptionLabel")}</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("createTaskDialog.descriptionPlaceholder")}
                rows={2}
                className="resize-none rounded-xl bg-muted/30 p-3 text-sm"
                disabled={busy}
              />
            </div>

            {/* Difficulty stars */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t("createTaskDialog.difficultyLabel")}</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className="p-0.5 transition-transform hover:scale-110"
                    disabled={busy}
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        level <= difficulty
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/20"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">
                  {computedPoints} {t("createTaskDialog.pts")} · {computedXP} XP
                </span>
              </div>
            </div>

            {/* AI generate button — optional helper */}
            {canUseAi && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAiGenerate}
                disabled={busy || (!title.trim() && !description.trim())}
                className="w-full rounded-xl h-10 gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("createTaskDialog.aiThinking")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("createTaskDialog.generateWithAi")}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Child selector — only if multiple children */}
          {children.length > 1 && (
            <div className="border-t border-border/30 px-5 py-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("createTaskDialog.selectChild")}</label>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChild(child.id)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                      selectedChild === child.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {children.length === 1 && (
            <div className="border-t border-border/30 px-5 py-2.5">
              <span className="text-sm text-muted-foreground">
                {t("createTaskDialog.forChild")} <span className="font-medium text-foreground">{children[0].name}</span>
              </span>
            </div>
          )}

          {/* Collapsible extra options */}
          <div className="border-t border-border/30">
            <button
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex w-full items-center justify-between px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{t("createTaskDialog.extraOptions")}</span>
              {showExtra ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showExtra && (
              <div className="px-5 pb-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="h-9 rounded-lg text-sm flex-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {requiresConfirmation
                      ? <Camera className="h-4 w-4 text-primary" />
                      : <CameraOff className="h-4 w-4 text-muted-foreground" />
                    }
                    <span className="text-sm">{t("createTaskDialog.photoConfirmation")}</span>
                  </div>
                  <Switch
                    checked={requiresConfirmation}
                    onCheckedChange={setRequiresConfirmation}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="border-t border-border/30 p-4">
            <Button
              type="submit"
              disabled={!canSubmit || busy}
              className="w-full h-12 rounded-xl text-base font-medium gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("createTaskDialog.creating")}
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {t("common.create")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
