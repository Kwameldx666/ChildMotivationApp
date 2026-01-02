"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppRoute } from "@/routes/AppRoute"
import { AppRouteId, routeRecord } from "@/routes/config"
import { useCreateTask } from "@/services/tasks-queries"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { LucideIcon } from "lucide-react"
import { Activity, ArrowLeft, CalendarDays, Check, Flame, Heart, Plus, Sparkles, Star, Wand2 } from "lucide-react"
import type { TaskEvidenceRequirement } from "@/services/tasks-service"

type CategoryValue = "home" | "study" | "care" | "sport"

const CATEGORY_OPTIONS = [
  { value: "home", label: "Дом" },
  { value: "study", label: "Учёба" },
  { value: "care", label: "Забота" },
  { value: "sport", label: "Активность" },
] as const satisfies Array<{ value: CategoryValue; label: string }>

const CONFIRM_OPTIONS = [
  { value: "none", label: "Без подтверждения" },
  { value: "photo", label: "Фото" },
  { value: "video", label: "Видео" },
  { value: "document", label: "Документ" },
] as const satisfies Array<{ value: TaskEvidenceRequirement; label: string }>

const QUICK_TEMPLATES = [
  {
    label: "Чистота",
    icon: Sparkles,
    title: "Навести порядок в комнате",
    description: "Сложи одежду, собери игрушки и пройдиcь пылесосом по ковру.",
    category: "home",
    confirmation: "photo",
    difficulty: 3,
  },
  {
    label: "Учёба",
    icon: Activity,
    title: "30 минут чтения",
    description: "Выбери книгу и расскажи 5 новых фактов, которые ты узнал.",
    category: "study",
    confirmation: "document",
    difficulty: 2,
  },
  {
    label: "Забота",
    icon: Heart,
    title: "Помочь накрыть на стол",
    description: "Подготовь стол перед ужином и убери после еды.",
    category: "care",
    confirmation: "photo",
    difficulty: 1,
  },
] satisfies Array<{
  label: string
  icon: LucideIcon
  title: string
  description: string
  category: (typeof CATEGORY_OPTIONS)[number]["value"]
  confirmation: (typeof CONFIRM_OPTIONS)[number]["value"]
  difficulty: number
}>

const CATEGORY_ACCENTS = {
  home: { chip: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200/60" },
  study: { chip: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-200/60" },
  care: { chip: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-200/60" },
  sport: { chip: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-200/60" },
} as const satisfies Record<CategoryValue, { chip: string }>

export default function NewTaskPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createTask = useCreateTask()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<CategoryValue>("home")
  const [difficulty, setDifficulty] = useState(2)
  const [dueDate, setDueDate] = useState("")
  const [confirmationType, setConfirmationType] = useState<TaskEvidenceRequirement>("photo")
  const [rewardValue, setRewardValue] = useState("100")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const TITLE_MIN_LENGTH = 3
  const DESCRIPTION_MIN_LENGTH = 10

  const titleLength = title.trim().length
  const descriptionLength = description.trim().length
  const titleValid = titleLength >= TITLE_MIN_LENGTH
  const descriptionRecommended = descriptionLength === 0 || descriptionLength >= DESCRIPTION_MIN_LENGTH
  const canSubmit = titleValid

  const accent = CATEGORY_ACCENTS[category as CategoryValue]

  const summary = useMemo(
    () => ({
      title: title.trim() || "Новая задача",
      description: description.trim() || "Добавьте описание, чтобы ребёнок понял задачу",
      difficulty,
      reward: Number.parseInt(rewardValue || "0", 10) || 0,
    }),
    [description, difficulty, rewardValue, title],
  )

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return "Без срока"
    const parsed = new Date(dueDate)
    return Number.isNaN(parsed.getTime()) ? "Без срока" : parsed.toLocaleDateString("ru-RU")
  }, [dueDate])

  const handleTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setTitle(template.title)
    setDescription(template.description)
    setCategory(template.category)
    setConfirmationType(template.confirmation)
    setDifficulty(template.difficulty)
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!canSubmit || createTask.isPending || isSubmitting) return

    try {
      setIsSubmitting(true)
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        confirmationType,
      })
      toast({ title: "Задача создана", description: "Она появится в вашем списке" })
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

  return (
    <AppRoute requiredRoles={["parent"]} redirectTo={routeRecord[AppRouteId.Welcome].path}>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-sm">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Создание задачи</p>
                <h1 className="text-xl font-semibold leading-tight">2 минуты — и задача готова</h1>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-[11px] uppercase">
              Без ограничений
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <Card className="border-border/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold">Детали задачи</CardTitle>
                  <p className="text-sm text-muted-foreground">Заполняйте только нужное — остальные поля можно добавить позже.</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Название</Label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Например: Подготовить портфель к школе"
                        className="h-11 text-sm"
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Минимум {TITLE_MIN_LENGTH} символа</span>
                        <span className={cn("font-semibold", titleValid ? "text-emerald-600" : "text-destructive")}>{titleLength}/{TITLE_MIN_LENGTH}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Категория</Label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={option.value === category ? "default" : "outline"}
                            className={cn("rounded-full border px-4 text-xs", option.value === category && "shadow-sm")}
                            onClick={() => setCategory(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Описание</Label>
                    <Textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Опишите шаги, материалы или критерии проверки"
                      rows={5}
                      className="resize-none text-sm"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Необязательно, но {DESCRIPTION_MIN_LENGTH}+ символов снимают вопросы</span>
                      <span className={cn("font-semibold", descriptionRecommended ? "text-emerald-600" : "text-destructive")}>
                        {descriptionLength}/{DESCRIPTION_MIN_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Сложность</span>
                        <span className="font-semibold text-foreground">{difficulty}/5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            className="transition-transform hover:scale-110"
                            aria-label={`Сложность ${level}`}
                          >
                            <Star
                              className={cn(
                                "h-5 w-5",
                                level <= difficulty ? "text-amber-400 fill-amber-300" : "text-muted-foreground/30",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

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
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                      <Label className="text-xs text-muted-foreground">Тип подтверждения</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONFIRM_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={option.value === confirmationType ? "default" : "secondary"}
                            className="rounded-full px-4 text-xs"
                            onClick={() => setConfirmationType(option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
                      <Label className="text-xs text-muted-foreground">Вознаграждение (XP)</Label>
                      <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <Input
                          type="number"
                          min={0}
                          step={10}
                          value={rewardValue}
                          onChange={(event) => setRewardValue(event.target.value)}
                          className="w-28 text-sm"
                        />
                        <span className="text-[11px] text-muted-foreground">Больше XP за сложные задачи</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wand2 className="h-4 w-4 text-primary" /> Быстрые шаблоны
                  </div>
                  <p className="text-xs text-muted-foreground">Выберите заготовку и просто поправьте детали.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUICK_TEMPLATES.map((template) => {
                    const TemplateIcon = template.icon
                    const isActive = template.title === title
                    return (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => handleTemplate(template)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                          isActive ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <TemplateIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{template.title}</p>
                            <p className="text-[12px] text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                        <Check className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/40")} />
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-border/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Превью</p>
                      <CardTitle className="text-lg font-semibold">{summary.title}</CardTitle>
                    </div>
                    <Badge className={cn("rounded-full px-3 py-1 text-[11px] uppercase", accent.chip)}>
                      {CATEGORY_OPTIONS.find((c) => c.value === category)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{summary.description}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                      <p className="text-[11px] uppercase text-muted-foreground">Срок</p>
                      <p className="text-base font-semibold text-foreground">{formattedDueDate}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                      <p className="text-[11px] uppercase text-muted-foreground">Награда</p>
                      <p className="text-base font-semibold text-foreground">{summary.reward} XP</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <span>Сложность</span>
                      <span className="font-semibold text-foreground">{summary.difficulty}/5</span>
                    </div>
                    <Progress value={(summary.difficulty / 5) * 100} className="mt-2 h-2" />
                  </div>
                  <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-[12px] text-muted-foreground">
                    Тип подтверждения: {CONFIRM_OPTIONS.find((c) => c.value === confirmationType)?.label}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Как не тратить много времени</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-[13px] text-muted-foreground">
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-2">1. Начните с шаблона и поправьте только название.</p>
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-2">2. XP = 60 + 20 × сложность — ни о чём думать не нужно.</p>
                  <p className="rounded-lg border border-dashed border-border/70 px-3 py-2">3. Фото-подтверждение подходит почти всегда.</p>
                </CardContent>
              </Card>

              <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Готовы сохранить?</span>
                  <span className="text-muted-foreground">{titleLength}/{TITLE_MIN_LENGTH}</span>
                </div>
                <p className="text-xs text-muted-foreground">Название — единственное обязательное поле. Остальное можно уточнить позже.</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" type="button" className="flex-1" onClick={() => router.back()}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={!canSubmit || isSubmitting}>
                    <Plus className="h-4 w-4" />
                    {isSubmitting ? "Создаём..." : "Создать задачу"}
                  </Button>
                </div>
                {!canSubmit && (
                  <p className="mt-2 text-right text-[11px] text-muted-foreground">
                    Добавьте ещё {Math.max(0, TITLE_MIN_LENGTH - titleLength)} символа в название.
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppRoute>
  )
}
