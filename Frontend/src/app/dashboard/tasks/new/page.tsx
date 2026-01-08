"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppRoute } from "@/routes/AppRoute"
import { AppRouteId, routeRecord } from "@/routes/config"
import { useCreateTask } from "@/services/tasks-queries"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CalendarDays, Check, Loader2, Plus, Sparkles, Star, Wand2, Users } from "lucide-react"
import { aiService } from "@/services/ai-service"
import { useFamilyMembers } from "@/services/family-queries"

const QUICK_TEMPLATES = [
  {
    label: "Чистота",
    emoji: "🧹",
    description: "Навести порядок в комнате",
  },
  {
    label: "Учёба",
    emoji: "📚",
    description: "Почитать книгу 30 минут",
  },
  {
    label: "Забота",
    emoji: "🍽️",
    description: "Помочь накрыть на стол",
  },
  {
    label: "Активность",
    emoji: "🏃",
    description: "Сделать зарядку",
  },
]

// Функция для генерации AI-описания задачи через API
const generateAiDescription = async (userDescription: string): Promise<string> => {
  try {
    // Получаем уже нормализованную строку от aiService
    const description = await aiService.getTaskDescription({ taskDescription: userDescription, language: 'ru' })
    return description
  } catch (error) {
    console.error('Ошибка при генерации AI-описания:', error)
    return userDescription
  }
}

export default function NewTaskPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createTask = useCreateTask()

  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [requiresConfirmation, setRequiresConfirmation] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined)

  // Получаем список детей в семье
  const { data: familyMembers = [] } = useFamilyMembers()
  const children = familyMembers.filter(member => member.role === 'child')

  // ИИ-генерация
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTaskDescription, setAiTaskDescription] = useState<string | null>(null)

  // Диалоги: подтверждение замены и ошибка AI
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [showAiErrorDialog, setShowAiErrorDialog] = useState(false)

  // Модальное окно подтверждения создания
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [editableTitle, setEditableTitle] = useState("")
  const [editableDescription, setEditableDescription] = useState("")
  const [editableDifficulty, setEditableDifficulty] = useState(2)
  const [editableReward, setEditableReward] = useState(80)

  const canSubmit = description.trim().length >= 5

  const handleAiAssist = async () => {
    if (!description.trim() || isGenerating) return
    
    try {
      setIsGenerating(true)
      const descriptionFromAi = await generateAiDescription(description.trim())
      setAiTaskDescription(descriptionFromAi)
      setShowReplaceDialog(true) // Показываем диалог замены
    } catch (error) {
      console.error("[new-task-page] AI generation failed", error)
      toast({
        title: "ИИ недоступен",
        description: "Пожалуйста, попробуйте позже",
        variant: "destructive",
      })
      setShowAiErrorDialog(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setDescription(template.description)
    setAiTaskDescription(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting || !canSubmit) return

    try {
      setIsSubmitting(true)
      // Генерируем AI-описание если ещё не было
      let finalDescription = aiTaskDescription || description.trim()
      if (!aiTaskDescription && description.trim()) {
        finalDescription = await generateAiDescription(description.trim())
      }
      
      // Подготавливаем данные для редактирования
      const title = description.trim().length > 50 
        ? description.trim().substring(0, 50) + "..."
        : description.trim()
      
      setEditableTitle(title)
      setEditableDescription(finalDescription)
      setEditableDifficulty(2)
      setEditableReward(80)
      
      // Показываем модальное окно для подтверждения
      setShowConfirmDialog(true)
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось обработать задачу",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCreate = async () => {
    try {
      setIsSubmitting(true)
      await createTask.mutateAsync({
        title: editableTitle,
        description: editableDescription,
        confirmationType: requiresConfirmation ? "photo" : "none",
        difficulty: editableDifficulty,
        reward: editableReward,
        dueDate: dueDate || undefined,
        assignedToUserId: selectedChildId && selectedChildId !== 'all' ? selectedChildId : undefined,
      })
      toast({ title: "Задача создана", description: "Она появится в вашем списке" })
      setShowConfirmDialog(false)
      router.push(routeRecord[AppRouteId.ParentDashboard].path)
    } catch (error) {
      toast({
        title: "Не удалось создать задачу",
        description: "Попробуйте ещё раз",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Принять или отклонить описание от ИИ
  const handleAcceptAiDescription = () => {
    if (aiTaskDescription) setDescription(aiTaskDescription)
    setAiTaskDescription(null)
    setShowReplaceDialog(false)
  }

  const handleDeclineAiDescription = () => {
    setShowReplaceDialog(false)
    setAiTaskDescription(null)
  }

  return (
    <AppRoute requiredRoles={["parent"]} redirectTo={routeRecord[AppRouteId.Welcome].path}>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-sm">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Создание задачи</p>
                <h1 className="text-xl font-semibold leading-tight">Просто опишите — ИИ сделает остальное</h1>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-[11px] uppercase">
              Quick
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
              {/* Основной блок — описание задачи */}
              <Card className="border-border/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold">Что нужно сделать?</CardTitle>
                  <p className="text-sm text-muted-foreground">Просто опишите задачу своими словами. Название, сложность и XP определит ИИ.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value)
                        setAiTaskDescription(null) // Сбрасываем при изменении
                      }}
                      placeholder="Например: Убрать игрушки и застелить кровать"
                      rows={4}
                      className="resize-none text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleAiAssist}
                        disabled={!description.trim() || isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        {isGenerating ? "ИИ обрабатывает..." : "Улучшить описание"}
                      </Button>
                      <span className={cn(
                        "text-[11px]",
                        description.trim().length >= 5 ? "text-emerald-600" : "text-muted-foreground"
                      )}>
                        {description.trim().length} символов
                      </span>
                    </div>
                  </div>

                  {/* Опциональные настройки */}
                  <div className="space-y-3">
                    {/* Выбор ребёнка */}
                    {children.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          Назначить ребёнку (необязательно)
                        </Label>
                        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Доступно всем детям" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Доступно всем детям</SelectItem>
                            {children.map((child) => (
                              <SelectItem key={child.id} value={child.id}>
                                {child.name} {child.lastName || ''} 
                                {child.age && ` (${child.age} лет)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Если не выбрать, задача будет доступна всем детям в семье
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                      {/* Срок */}
                      <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                        <Label className="text-xs text-muted-foreground">Срок (необязательно)</Label>
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
                        <Label className="text-xs text-muted-foreground">Подтверждение выполнения</Label>
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <span className="text-sm text-foreground">
                            {requiresConfirmation ? "Ребёнок прикрепит фото/видео" : "Без подтверждения"}
                          </span>
                          <Switch
                            checked={requiresConfirmation}
                            onCheckedChange={setRequiresConfirmation}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Быстрые шаблоны */}
              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wand2 className="h-4 w-4 text-primary" /> Быстрые идеи
                  </div>
                  <p className="text-xs text-muted-foreground">Выберите шаблон — и задача готова за секунду.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUICK_TEMPLATES.map((template) => {
                      const isActive = template.description === description
                      return (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => handleTemplate(template)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                            isActive ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/40",
                          )}
                        >
                          <span className="text-2xl">{template.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{template.description}</p>
                            <p className="text-[11px] text-muted-foreground">{template.label}</p>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Кнопка создания */}
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" type="button" onClick={() => router.back()}>
                  Отмена
                </Button>
                <Button type="submit" className="gap-2" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Обрабатываем..." : "Продолжить"}
                </Button>
              </div>
          </form>

          {/* Модальное окно подтверждения и редактирования */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Проверьте задачу перед созданием
                </DialogTitle>
                <DialogDescription>
                  ИИ обработал ваше описание. Вы можете изменить любые параметры перед созданием задачи.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Название */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Название задачи</Label>
                  <Input
                    id="edit-title"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    placeholder="Название задачи"
                  />
                </div>

                {/* Описание */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Описание</Label>
                  <Textarea
                    id="edit-description"
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    placeholder="Подробное описание задачи"
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    ИИ расширил ваше описание, чтобы ребёнок лучше понял задачу
                  </p>
                </div>

                {/* Сложность */}
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Сложность</Label>
                  <Select
                    value={editableDifficulty.toString()}
                    onValueChange={(value) => setEditableDifficulty(parseInt(value))}
                  >
                    <SelectTrigger id="edit-difficulty">
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

                {/* Награда */}
                <div className="space-y-2">
                  <Label htmlFor="edit-reward">Награда (XP)</Label>
                  <Input
                    id="edit-reward"
                    type="number"
                    min="10"
                    max="500"
                    step="10"
                    value={editableReward}
                    onChange={(e) => setEditableReward(parseInt(e.target.value) || 80)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Рекомендуем: {60 + editableDifficulty * 20} XP для сложности {editableDifficulty}
                  </p>
                </div>

                {/* Срок выполнения */}
                {dueDate && (
                  <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Срок выполнения</p>
                    <p className="text-sm font-medium">
                      {new Date(dueDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}

                {/* Назначено ребёнку */}
                {selectedChildId && selectedChildId !== 'all' && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Назначено ребёнку
                    </p>
                    <p className="text-sm font-medium">
                      {(() => {
                        const child = children.find(c => c.id === selectedChildId)
                        return child ? `${child.name} ${child.lastName || ''}` : 'Неизвестно'
                      })()}
                    </p>
                  </div>
                )}

                {/* Подтверждение */}
                <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Подтверждение выполнения</p>
                    <p className="text-xs text-muted-foreground">
                      {requiresConfirmation ? "Ребёнок прикрепит фото/видео" : "Без подтверждения"}
                    </p>
                  </div>
                  <Check className={cn(
                    "h-5 w-5",
                    requiresConfirmation ? "text-green-500" : "text-muted-foreground/40"
                  )} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleConfirmCreate}
                  disabled={isSubmitting || !editableTitle.trim() || !editableDescription.trim()}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Создаём...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Создать задачу
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Диалог — ИИ: улучшенное описание задачи */}
          <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  ИИ предлагает улучшенное описание
                </DialogTitle>
                <DialogDescription>
                  ИИ подготовил улучшенное описание для ребёнка. Просмотрите текст и решите, заменить ли текущее описание.
                </DialogDescription>
              </DialogHeader>

              <Card className="mt-4 border-border/60">
                <CardContent className="text-sm leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {aiTaskDescription ?? "(Пусто)"}
                </CardContent>
              </Card>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={handleDeclineAiDescription}>Оставить как есть</Button>
                <Button onClick={handleAcceptAiDescription}>Заменить</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Диалог — ошибка AI */}
          <Dialog open={showAiErrorDialog} onOpenChange={setShowAiErrorDialog}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>ИИ недоступен</DialogTitle>
                <DialogDescription>Пожалуйста, попробуйте позже или используйте своё описание.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowAiErrorDialog(false)}>ОК</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppRoute>
  )
}
