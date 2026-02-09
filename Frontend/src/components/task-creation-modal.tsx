"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { CreateTaskPayload } from "@/services/tasks-service"
import { CalendarDays, Check, Plus, Sparkles, Star, Wand2, Users } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import { useTranslation } from "@/i18n/provider"

interface TaskCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateTaskPayload) => Promise<void> | void
}

const QUICK_TEMPLATES: Array<{
  labelKey: string
  descriptionKey: string
  emoji: string
}> = [
  {
    labelKey: "taskCreation.templates.cleaning",
    descriptionKey: "taskCreation.templates.cleaningDesc",
    emoji: "🧹",
  },
  {
    labelKey: "taskCreation.templates.study",
    descriptionKey: "taskCreation.templates.studyDesc",
    emoji: "📚",
  },
  {
    labelKey: "taskCreation.templates.care",
    descriptionKey: "taskCreation.templates.careDesc",
    emoji: "🍽️",
  },
  {
    labelKey: "taskCreation.templates.activity",
    descriptionKey: "taskCreation.templates.activityDesc",
    emoji: "🏃",
  },
]

// Difficulty -> points mapping
const DIFFICULTY_POINTS: Record<number, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 20,
  5: 50,
}

// Temporary AI generation function (will be replaced by backend)
const generateAiSuggestion = async (description: string, t: (key: string, params?: Record<string, string | number>) => string): Promise<{
  title: string
  fullDescription: string
  difficulty: number
  reward: number
}> => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const words = description.toLowerCase()
  let difficulty = 2
  let category = t("taskCreation.categories.home")
  
  if (words.includes("уборк") || words.includes("порядок") || words.includes("пылесос")) {
    difficulty = 3
    category = t("taskCreation.templates.cleaning")
  } else if (words.includes("чита") || words.includes("книг") || words.includes("урок") || words.includes("учи")) {
    difficulty = 2
    category = t("taskCreation.templates.study")
  } else if (words.includes("помо") || words.includes("стол") || words.includes("посуд")) {
    difficulty = 1
    category = t("taskCreation.templates.care")
  } else if (words.includes("зарядк") || words.includes("спорт") || words.includes("бег")) {
    difficulty = 2
    category = t("taskCreation.templates.activity")
  }
  
  const reward = 60 + 20 * difficulty
  
  const title = description.length > 30 
    ? description.substring(0, 30).trim() + "..."
    : description.trim()
  
  const fullDescription = `${description}\n\n✨ ${t("taskCreation.categoryLabel", { category })}`
  
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    fullDescription: description,
    difficulty,
    reward,
  }
}

export default function TaskCreationModal({ open, onClose, onSubmit: _onSubmit }: TaskCreationModalProps) {
  const { t } = useTranslation()
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  

  // Родители могут назначать задачу ребёнку; если детей больше одного — выбор обязателен;
  const { data: familyMembers = [] } = useFamilyMembers()
  const children = familyMembers.filter(member => member.role === 'child')
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (children.length === 1) setSelectedChildId(children[0].id)
  }, [children])


  // Selected difficulty and derived values (parent can change difficulty only)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(2)
  const [selectedReward, setSelectedReward] = useState<number>(60 + 20 * 2)
  const [selectedPoints, setSelectedPoints] = useState<number>(DIFFICULTY_POINTS[2])


  const resetForm = useCallback(() => {
    setDescription("")
    setDueDate("")
    setRequiresConfirmation(true)
    setSubmitError(null)
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setDescription(t(template.descriptionKey))
  }

  const summary = useMemo(() => {
    const d = selectedDifficulty
    return {
      title: description.trim() ? (description.length > 30 ? description.substring(0, 30) + "..." : description) : t("taskCreation.newTask"),
      description: description.trim() || t("taskCreation.describeTask"),
      difficulty: d,
      reward: 60 + 20 * d,
    }
  }, [description, selectedDifficulty])

  const handleSubmit = async () => {
    const trimmedDescription = description.trim()
    if (!trimmedDescription) {
      setSubmitError(t("taskCreation.describeWhatToDo"))
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      // Генерируем описание задачи автоматически перед отправкой
      const finalSuggestion = await generateAiSuggestion(trimmedDescription, t)

      // Если детей больше одного — выбор обязателен
      if (children.length > 1 && !selectedChildId) {
        setSubmitError(t("taskCreation.selectAssignee"))
        return
      }
      
      await _onSubmit({
        title: finalSuggestion.title,
        description: trimmedDescription,
        confirmationType: requiresConfirmation ? "photo" : "none",
        difficulty: selectedDifficulty,
        dueDate: dueDate || undefined,
        assignedToUserId: selectedChildId || undefined,
      })
      resetForm()
      onClose()
    } catch (error) {
      console.error("[task-creation-modal] Failed to create task", error)
      setSubmitError(t("taskCreation.submitError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl h-[80vh] overflow-hidden rounded-3xl border border-border/60 bg-background p-0 shadow-xl">
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-4 bg-gradient-to-r from-background via-background to-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold leading-tight">{t("taskCreation.title")}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t("taskCreation.subtitle")}</DialogDescription>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-[11px] uppercase tracking-wide">Quick</Badge>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] h-[calc(80vh-150px)] px-5 pb-4 pt-3">
          <ScrollArea className="h-full rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="space-y-5">
              {/* Основное поле — описание задачи */}
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("taskCreation.whatToDo")}</p>
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("taskCreation.placeholder")}
                    rows={4}
                    className="resize-none text-sm"
                  />
                </div>
              </section>

              {/* Опциональные настройки */}
              <section className="grid gap-3 md:grid-cols-3">
                {/* Срок */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                  <Label className="text-xs text-muted-foreground">{t("taskCreation.deadline")}</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Подтверждение */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                  <Label className="text-xs text-muted-foreground">{t("taskCreation.confirmation")}</Label>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-sm text-foreground">
                      {requiresConfirmation ? t("taskCreation.confirmationPhoto") : t("taskCreation.noConfirmation")}
                    </span>
                    <Switch
                      checked={requiresConfirmation}
                      onCheckedChange={setRequiresConfirmation}
                    />
                  </div>
                </div>

                {/* Назначение ребёнку */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                  <Label className="text-xs text-muted-foreground">{t("taskCreation.assignChild")}</Label>
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("taskCreation.noChildren")}</p>
                  ) : (
                    <select
                      value={selectedChildId ?? ''}
                      onChange={(e) => setSelectedChildId(e.target.value || undefined)}
                      disabled={children.length === 1}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">{t("taskCreation.selectChild")}</option>
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.lastName || ''}{c.age ? ` (${c.age} ${t("taskCreation.yearsOld")})` : ''}</option>
                      ))}
                    </select>
                  )}
                  {children.length > 1 ? (
                    <p className="text-xs text-destructive">{t("taskCreation.selectChildRequired")}</p>
                  ) : children.length === 1 ? (
                    <p className="text-xs text-muted-foreground">{t("taskCreation.taskAssignedTo", { name: children[0].name })}</p>
                  ) : null}
                </div>
              </section>

              {/* Быстрые шаблоны */}
              <section className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> {t("taskCreation.quickIdeas")}</span>
                  <span className="text-xs text-muted-foreground">{t("taskCreation.oneClick")}</span>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  {QUICK_TEMPLATES.map((template) => (
                    <Button
                      key={template.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={cn(
                        "justify-start gap-2 rounded-lg border border-border/60 bg-white/95 text-left text-sm hover:border-primary/40",
                        description === t(template.descriptionKey) && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleTemplate(template)}
                    >
                      <span className="text-lg">{template.emoji}</span>
                      <span className="truncate">{t(template.descriptionKey)}</span>
                    </Button>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Превью справа */}
          <div className="flex flex-col gap-3 pr-1">
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sticky top-0">
              <div className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                <span>{t("taskCreation.preview")}</span>
                <Badge variant="outline" className="rounded-full border-primary/40 px-2 py-1 text-[11px]">
                  {dueDate ? t("taskCreation.hasDueDate") : t("taskCreation.noDueDate")}
                </Badge>
              </div>
              
              <h3 className="mt-3 text-lg font-semibold leading-snug">{summary.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{summary.description}</p>
              
              {/* Сложность звёздами */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("tasks.difficulty")}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Star
                        key={level}
                        className={cn(
                          "h-4 w-4 cursor-pointer",
                          level <= selectedDifficulty 
                            ? "text-amber-400 fill-amber-400" 
                            : "text-muted-foreground/20"
                        )}
                        onClick={() => setSelectedDifficulty(level)}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(parseInt(e.target.value))}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm"
                  >
                    <option value={1}>⭐ {t("tasks.difficultyLevels.1")}</option>
                    <option value={2}>⭐⭐ {t("tasks.difficultyLevels.2")}</option>
                    <option value={3}>⭐⭐⭐ {t("tasks.difficultyLevels.3")}</option>
                    <option value={4}>⭐⭐⭐⭐ {t("tasks.difficultyLevels.4")}</option>
                    <option value={5}>⭐⭐⭐⭐⭐ {t("tasks.difficultyLevels.5")}</option>
                  </select>
                </div>
              </div>

              {/* Награда: показываем XP и очки (очки нельзя редактировать) */}
              <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                <p className="flex items-center gap-2 font-medium text-primary">
                  <Sparkles className="h-4 w-4" /> {t("taskCreation.reward", { xp: selectedReward })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{t("taskCreation.formula")}</p>
                <p className="text-[13px] mt-2">{t("taskCreation.points")} <span className="font-semibold">{selectedPoints}</span></p>
                <p className="text-[11px] text-muted-foreground mt-1">{t("taskCreation.pointsHint")}</p>
              </div>

              {/* Подтверждение */}
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className={cn("h-4 w-4", requiresConfirmation ? "text-green-500" : "text-muted-foreground/40")} />
                <span>{requiresConfirmation ? t("taskCreation.requiresConfirmation") : t("taskCreation.noConfirmation")}</span>
              </div>

              {selectedChildId && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{(() => {
                    const child = children.find(c => c.id === selectedChildId)
                    return t("taskCreation.assignedTo", { name: child ? `${child.name} ${child.lastName || ''}`.trim() : t("taskCreation.unknown") })
                  })()}</span>
                </div>
              )}
            </div>


          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-2 sm:flex-row px-5 pb-5">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={isSubmitting || !description.trim()}>
            <Plus className="h-4 w-4" />
            {isSubmitting ? t("taskCreation.creating") : t("tasks.createTask")}
          </Button>
        </div>
        {submitError && <p className="px-5 pb-4 text-sm text-destructive">{submitError}</p>}
      </DialogContent>
    </Dialog>
  )
}
