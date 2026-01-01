"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AppRouteId, routeRecord } from "@/routes/config"
import { CalendarDays, Check, Flame, Plus, Sparkles, Star, Wand2 } from "lucide-react"

interface TaskCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (task: any) => void
}

const CATEGORY_OPTIONS = [
  { value: "home", label: "Дом" },
  { value: "study", label: "Учёба" },
  { value: "care", label: "Забота" },
  { value: "sport", label: "Активность" },
]

const CONFIRM_OPTIONS = [
  { value: "photo", label: "Фото" },
  { value: "checklist", label: "Чек-лист" },
  { value: "note", label: "Комментарий" },
]

const QUICK_TEMPLATES = [
  {
    label: "Чистота",
    title: "Навести порядок в комнате",
    description: "Сложи одежду, собери игрушки и пройдиcь пылесосом по ковру.",
    category: "home",
    confirmation: "photo",
    difficulty: 3,
  },
  {
    label: "Учёба",
    title: "30 минут чтения",
    description: "Выбери книгу и расскажи 5 новых фактов, которые ты узнал.",
    category: "study",
    confirmation: "checklist",
    difficulty: 2,
  },
  {
    label: "Забота",
    title: "Помочь накрыть на стол",
    description: "Подготовь стол перед ужином и убери после еды.",
    category: "care",
    confirmation: "photo",
    difficulty: 1,
  },
]

export default function TaskCreationModal({ open, onClose, onSubmit: _onSubmit }: TaskCreationModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("home")
  const [difficulty, setDifficulty] = useState(2)
  const [dueDate, setDueDate] = useState("")
  const [confirmationType, setConfirmationType] = useState("photo")
  const [rewardValue, setRewardValue] = useState("100")

  const summary = useMemo(
    () => ({
      title: title.trim() || "Новая задача",
      description: description.trim() || "Добавьте описание, чтобы ребёнок понял задачу",
      difficulty,
      reward: Number.parseInt(rewardValue || "0", 10) || 0,
    }),
    [description, difficulty, rewardValue, title],
  )

  const handleTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setTitle(template.title)
    setDescription(template.description)
    setCategory(template.category)
    setConfirmationType(template.confirmation)
    setDifficulty(template.difficulty)
  }

  const handleSubmit = () => {
    onClose()
    router.push(routeRecord[AppRouteId.TaskCreate].path)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl lg:max-w-6xl h-[88vh] overflow-hidden rounded-3xl border border-border/60 bg-background p-0 shadow-xl">
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-4 bg-gradient-to-r from-background via-background to-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold leading-tight">Новая семейная миссия</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Заполните поля слева, результат — справа.</DialogDescription>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-[11px] uppercase tracking-wide">Quick</Badge>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr] h-[calc(88vh-150px)] px-5 pb-4 pt-3">
          <ScrollArea className="h-full rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="space-y-5">
              <section className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Основное</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Название</Label>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Например: Подготовить портфель к школе"
                      className="h-11 text-sm"
                    />
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
                          className={cn(
                            "rounded-full border px-4 text-xs",
                            option.value === category && "shadow-sm",
                          )}
                          onClick={() => setCategory(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <Label className="text-xs text-muted-foreground">Описание</Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Опишите шаги, материалы или критерии проверки"
                  rows={4}
                  className="resize-none text-sm"
                />
              </section>

              <section className="grid gap-3 md:grid-cols-2">
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
              </section>

              <section className="grid gap-3 md:grid-cols-2">
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
              </section>

              <section className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Быстрые шаблоны</span>
                  <span className="text-xs text-muted-foreground">1 клик — заполнено</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {QUICK_TEMPLATES.map((template) => (
                    <Button
                      key={template.label}
                      type="button"
                      variant="secondary"
                      className="justify-between rounded-lg border border-border/60 bg-white/95 text-left text-sm hover:border-primary/40"
                      onClick={() => handleTemplate(template)}
                    >
                      <span className="space-y-0.5">
                        <span className="block font-semibold text-foreground">{template.title}</span>
                        <span className="text-[12px] text-muted-foreground">{template.description}</span>
                      </span>
                      <Check className={cn("h-4 w-4", title === template.title ? "text-primary" : "text-muted-foreground/40")} />
                    </Button>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>

          <div className="flex flex-col gap-3 pr-1">
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sticky top-0">
              <div className="flex items-center justify-between text-[11px] uppercase text-muted-foreground">
                <span>Превью</span>
                <Badge variant="outline" className="rounded-full border-primary/40 px-2 py-1 text-[11px]">
                  {dueDate ? "Есть срок" : "Свободно"}
                </Badge>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug">{summary.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summary.description}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Wand2 className="h-4 w-4 text-primary" />
                <span>Категория: {CATEGORY_OPTIONS.find((c) => c.value === category)?.label}</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>Сложность</span>
                  <span className="font-semibold">{summary.difficulty}/5</span>
                </div>
                <Progress value={(summary.difficulty / 5) * 100} />
              </div>
              <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                <p className="flex items-center gap-2 font-medium text-primary">
                  <Sparkles className="h-4 w-4" /> Награда: {summary.reward} XP
                </p>
                <p className="text-[12px] text-muted-foreground">XP добавится при подтверждении.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground shadow-sm">
              <p className="font-medium text-foreground">Подсказка</p>
              <p className="text-[12px]">Слева есть скролл: проходите блоки по порядку, справа сразу видно итог.</p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-2 sm:flex-row px-5 pb-5">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            <Plus className="h-4 w-4" />
            Создать задачу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
