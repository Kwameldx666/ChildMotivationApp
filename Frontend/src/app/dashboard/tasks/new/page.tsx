"use client"

import { FormEvent, useMemo, useState, useEffect } from "react"
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

// Mapping: difficulty (1..5) -> reward points (очки). Parent can change difficulty only; points are derived.
const DIFFICULTY_POINTS: Record<number, number> = {
  1: 2,   // Очень легко
  2: 5,   // Легко
  3: 10,  // Средне
  4: 20,  // Сложно
  5: 50,  // Очень сложно
}

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

  // Получаем список детей в семье
  const { data: familyMembers = [] } = useFamilyMembers()
  const children = familyMembers.filter(member => member.role === 'child')

  // Выбор ребёнка (если детей больше одного — обязателен; если только один — выбираем автоматически)
  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (children.length === 1) {
      setSelectedChild(children[0].id)
    }
  }, [children])


  // Модальное окно подтверждения создания
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [editableTitle, setEditableTitle] = useState("")
  const [editableDescription, setEditableDescription] = useState("")
  const [editableDifficulty, setEditableDifficulty] = useState(2)
  const [editableReward, setEditableReward] = useState(80)
  const [editablePoints, setEditablePoints] = useState<number>(DIFFICULTY_POINTS[2])

  // Keep reward XP and points in sync with difficulty
  useEffect(() => {
    setEditableReward(60 + 20 * editableDifficulty)
    setEditablePoints(DIFFICULTY_POINTS[editableDifficulty] ?? 0)
  }, [editableDifficulty])

  // Препятствие: если у родителя нет детей — нельзя создавать задачи
  const canSubmit = description.trim().length >= 5 && children.length > 0 && (children.length <= 1 || Boolean(selectedChild))

  const handleTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setDescription(template.description)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting || !canSubmit) return

    // Если детей больше одного — выбор обязателен
    if (children.length > 1 && !selectedChild) {
      toast({ title: "Выберите ребёнка", description: "Пожалуйста, выберите, кому назначить задачу", variant: "destructive" })
      return
    }

    try {
      setIsSubmitting(true)

      // Попробуем сначала получить предложения задач (task-suggestions). Если есть — используем первую подсказку.
      const childInfo = children.find(c => c.id === selectedChild) ?? children[0]
      try {
        const suggestionsResp = await aiService.getTaskSuggestions({
          childId: childInfo?.id,
          childAge: (childInfo as any)?.age ?? undefined,
          tone: 'дружелюбный',
          language: 'ru',
          taskDescription: description.trim() || undefined
        })

        const first = suggestionsResp?.suggestions?.[0]
        if (first) {
          const difficulty = Math.min(Math.max(first.difficulty ?? 2, 1), 5)
          const title = first.title && first.title.length > 50 ? first.title.substring(0, 50) + "..." : (first.title ?? (description.trim().length > 50 ? description.trim().substring(0, 50) + "..." : description.trim()))

          setEditableTitle(title)
          setEditableDescription(first.description ?? description.trim())
          setEditableDifficulty(difficulty)
          setEditableReward(60 + 20 * difficulty)
          setEditablePoints(DIFFICULTY_POINTS[difficulty])

          setShowConfirmDialog(true)
          return
        }
      } catch (err) {
        // Fall back to description generation if suggestions fail
        console.warn('[new-task-page] Task suggestions failed, falling back to description', err)
      }

      // Fallback: генерируем описание через task-description
      const finalDescription = await generateAiDescription(description.trim())

      // Подготавливаем данные для редактирования (fallback)
      const title = description.trim().length > 50 
        ? description.trim().substring(0, 50) + "..."
        : description.trim()

      setEditableTitle(title)
      setEditableDescription(finalDescription)
      setEditableDifficulty(2)
      setEditableReward(60 + 20 * 2)
      setEditablePoints(DIFFICULTY_POINTS[2])

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
        reward: editableReward, // XP
        rewardPoints: editablePoints, // Очки (не редактируемые)
        dueDate: dueDate || undefined,
        assignedToUserId: selectedChild || undefined,
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
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Например: Убрать игрушки и застелить кровать"
                      rows={4}
                      className="resize-none text-sm"
                    />
                    <div className="flex items-center justify-between">
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
                        <Select value={selectedChild ?? ''} onValueChange={(v) => setSelectedChild(v || undefined)}>
                          <SelectTrigger className="text-sm" disabled={children.length === 1}>
                            <SelectValue placeholder={children.length === 1 ? `${children[0].name}` : "Выберите ребёнка"} />
                          </SelectTrigger>
                          <SelectContent>
                            {children.map((child) => (
                              <SelectItem key={child.id} value={child.id}>
                                {child.name} {child.lastName || ''} 
                                {child.age && ` (${child.age} лет)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {children.length > 1 ? (
                          <p className="text-xs text-destructive">Обязательно выберите, кому назначить задачу</p>
                        ) : children.length === 1 ? (
                          <p className="text-xs text-muted-foreground">Единственный ребёнок — задача будет назначена автоматически</p>
                        ) : (
                          <p className="text-xs text-destructive">У вас ещё нет добавленных детей — создать задачу нельзя</p>
                        )}

                        {/* Явное отображение выбранного ребёнка, чтобы было видно */}
                        {selectedChild && (
                          <p className="text-xs text-muted-foreground mt-2">Выбрано: {(() => {
                            const child = children.find(c => c.id === selectedChild)
                            return child ? `${child.name} ${child.lastName || ''}` : 'Неизвестно'
                          })()}</p>
                        )}
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
                <div className="flex items-center gap-3">
                  {description.trim().length < 5 && (
                    <p className="text-sm text-destructive mr-2">Описание должно быть не короче 5 символов</p>
                  )}
                  <Button type="submit" className="gap-2" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Обрабатываем..." : "Продолжить"}
                  </Button>
                </div>
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

                {/* Награда (XP + Очки). Очки нельзя редактировать, они вычисляются по сложности */}
                <div className="space-y-2">
                  <Label>Награда</Label>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <Label className="text-xs">XP</Label>
                      <Input
                        id="edit-reward"
                        type="number"
                        value={editableReward}
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground mt-1">Формула: 60 + 20 × сложность</p>
                    </div>

                    <div>
                      <Label className="text-xs">Очки</Label>
                      <Input id="edit-points" type="number" value={editablePoints} readOnly />
                      <p className="text-xs text-muted-foreground mt-1">Очки зависят только от выбранной сложности</p>
                    </div>
                  </div>
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
                {selectedChild && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Назначено ребёнку
                    </p>
                    <p className="text-sm font-medium">
                      {(() => {
                        const child = children.find(c => c.id === selectedChild)
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
                <div className="flex items-center gap-3">
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground mr-2">У вас ещё нет детей — пригласите их по инвайт-коду</p>
                  ) : children.length > 1 && !selectedChild ? (
                    <p className="text-sm text-destructive mr-2">Выберите ребёнка прежде чем создать задачу</p>
                  ) : null}
                  <Button
                    onClick={handleConfirmCreate}
                    disabled={
                      isSubmitting ||
                      !editableTitle.trim() ||
                      !editableDescription.trim() ||
                      (children.length > 1 && !selectedChild)
                    }
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
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>


        </div>
      </div>
    </AppRoute>
  )
}
