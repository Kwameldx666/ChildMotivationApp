"use client"

import { FormEvent, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateTask } from "@/services/tasks-queries"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Sparkles, Camera, CameraOff, User, Clock, Zap, Tag, FileText } from "lucide-react"
import { aiService } from "@/services/ai-service"
import { useFamilyMembers } from "@/services/family-queries"

const QUICK_IDEAS = [
  { emoji: "🧹", text: "Убрать в комнате" },
  { emoji: "📚", text: "Почитать книгу" },
  { emoji: "🍽️", text: "Помочь с ужином" },
  { emoji: "🏃", text: "Сделать зарядку" },
  { emoji: "🛏️", text: "Заправить кровать" },
  { emoji: "🧺", text: "Сложить вещи" },
]

const DIFFICULTY_POINTS: Record<number, number> = {
  1: 5, 2: 10, 3: 15, 4: 25, 5: 40,
}

const CATEGORIES = [
  { id: 'home', label: 'Домашние дела', emoji: '🏠' },
  { id: 'study', label: 'Учёба', emoji: '📚' },
  { id: 'health', label: 'Здоровье', emoji: '💪' },
  { id: 'creativity', label: 'Творчество', emoji: '🎨' },
  { id: 'social', label: 'Общение', emoji: '🤝' },
  { id: 'other', label: 'Другое', emoji: '✨' },
] as const

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
  const { toast } = useToast()
  const createTask = useCreateTask()

  const [description, setDescription] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("home")
  const [dueDate, setDueDate] = useState("")
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useAi, setUseAi] = useState(true)
  const [difficulty, setDifficulty] = useState(2)

  const { data: familyMembers = [] } = useFamilyMembers()
  const children = familyMembers.filter(member => member.role === 'child')

  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    if (children.length === 1) {
      setSelectedChild(children[0].id)
    }
  }, [children])

  // Сброс при закрытии
  useEffect(() => {
    if (!open) {
      setDescription("")
      setTitle("")
      setCategory("home")
      setDueDate("")
      setDifficulty(2)
    }
  }, [open])

  // Разрешаем создание:
  // - С ИИ: описание >= 3 символов
  // - Без ИИ: название >= 3 и описание >= 3
  const canSubmit = useAi 
    ? (description.trim().length >= 3 && (children.length === 0 || children.length === 1 || !!selectedChild))
    : (title.trim().length >= 3 && description.trim().length >= 3 && (children.length === 0 || children.length === 1 || !!selectedChild))

  const handleQuickIdea = (idea: typeof QUICK_IDEAS[0]) => {
    setDescription(idea.text)
  }

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!canSubmit || isSubmitting) return

    try {
      setIsSubmitting(true)

      let finalTitle = useAi ? description.trim() : title.trim()
      let finalDescription = description.trim()
      let finalDifficulty = difficulty

      if (useAi) {
        try {
          const childInfo = children.find(c => c.id === selectedChild) ?? children[0]
          const suggestionsResp = await aiService.getTaskSuggestions({
            childId: childInfo?.id,
            childAge: (childInfo as any)?.age ?? undefined,
            tone: 'дружелюбный',
            language: 'ru',
            taskDescription: description.trim()
          })

          const first = suggestionsResp?.suggestions?.[0]
          if (first) {
            finalTitle = first.title || finalTitle
            finalDescription = first.description || finalDescription
            finalDifficulty = Math.min(Math.max(first.difficulty ?? difficulty, 1), 5)
          }
        } catch (err) {
          // Если AI не сработал - используем введённый текст
          console.warn('[create-task] AI failed, using raw input', err)
        }
      }

      await createTask.mutateAsync({
        title: finalTitle.length > 50 ? finalTitle.substring(0, 50) : finalTitle,
        description: finalDescription,
        confirmationType: requiresConfirmation ? "photo" : "none",
        difficulty: finalDifficulty,
        dueDate: dueDate || undefined,
        assignedToUserId: selectedChild || undefined,
      })

      toast({ title: "✓ Задача создана" })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        {/* Заголовок */}
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-base font-medium">Новая задача</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* С ИИ: одно поле для описания идеи */}
          {useAi ? (
            <>
              <div className="px-5 pb-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Опишите задачу, ИИ сформулирует детали..."
                  rows={2}
                  className="resize-none border-0 bg-muted/30 p-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50"
                  autoFocus
                />
              </div>

              {/* Быстрые идеи */}
              {description.length === 0 && (
                <div className="px-5 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_IDEAS.map((idea) => (
                      <button
                        key={idea.text}
                        type="button"
                        onClick={() => handleQuickIdea(idea)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                      >
                        <span>{idea.emoji}</span>
                        <span>{idea.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Без ИИ: название задачи */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Название</span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Краткое название задачи"
                  className="border-0 bg-muted/30 p-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50"
                  autoFocus
                />
              </div>

              {/* Без ИИ: описание */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Описание</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробное описание задачи..."
                  rows={2}
                  className="resize-none border-0 bg-muted/30 p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50"
                />
              </div>

              {/* Без ИИ: категория */}
              <div className="border-t border-border/40 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-xs text-muted-foreground">Категория</span>
                </div>
              </div>
            </>
          )}

          {/* Выбор ребёнка (всегда показываем если есть дети) */}
          {children.length > 0 && (
            <div className="border-t border-border/40 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {children.length === 1 ? (
                  <span className="text-sm text-muted-foreground">
                    Для: {children[0].name} {children[0].lastName || ''}
                  </span>
                ) : (
                  <Select value={selectedChild ?? ''} onValueChange={(v) => setSelectedChild(v || undefined)}>
                    <SelectTrigger className="h-8 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                      <SelectValue placeholder="Выберите ребёнка" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name} {child.lastName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Срок выполнения (обязательно) */}
          <div className="border-t border-border/40 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  placeholder="Выберите дату и время"
                />
              </div>
              <span className="text-xs text-muted-foreground">Срок</span>
            </div>
          </div>

          {/* Фото-подтверждение (обязательно) */}
          <div className="border-t border-border/40 px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  requiresConfirmation ? "bg-primary/10" : "bg-muted"
                )}>
                  {requiresConfirmation 
                    ? <Camera className="h-3.5 w-3.5 text-primary" />
                    : <CameraOff className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </div>
                <span className="text-sm">Фото-подтверждение</span>
              </div>
              <Switch
                checked={requiresConfirmation}
                onCheckedChange={setRequiresConfirmation}
              />
            </div>
          </div>

          {/* Сложность (только без ИИ) */}
          {!useAi && (
            <div className="border-t border-border/40 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <Select value={difficulty.toString()} onValueChange={(v) => setDifficulty(parseInt(v))}>
                    <SelectTrigger className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">⭐ Очень легко</SelectItem>
                      <SelectItem value="2">⭐⭐ Легко</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ Средне</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ Сложно</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ Очень сложно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs text-muted-foreground">{computedXP} XP • {computedPoints} очков</span>
              </div>
            </div>
          )}

          {/* Футер */}
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-5 py-3">
            {/* AI toggle */}
            <button
              type="button"
              onClick={() => setUseAi(!useAi)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all",
                useAi 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {useAi ? <Sparkles className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {useAi ? "С ИИ" : "Быстро"}
            </button>

            <Button 
              type="submit" 
              size="sm"
              disabled={!canSubmit || isSubmitting}
              className="gap-1.5 px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {useAi ? "ИИ думает..." : "Создаём..."}
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Создать
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
