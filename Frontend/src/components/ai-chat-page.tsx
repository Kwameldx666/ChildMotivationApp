"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Bot, PenSquare, RotateCcw, Send, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAiChat } from "@/hooks/use-ai-chat"

interface AIChatPageProps {
  userName?: string
  role?: "parent" | "child"
  familyName?: string | null
  onBack?: () => void
}

type QuickAction = {
  title: string
  description: string
  prompt: string
  accent: string
}

const quickActions: QuickAction[] = [
  {
    title: "Спринт задач",
    description: "Попроси ИИ собрать задачи под конкретную цель",
    prompt: "Составь недельный спринт задач для ребёнка, чтобы прокачать ответственность и помочь с уроками.",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "Наградный буст",
    description: "Пусть ИИ обновит магазин наград",
    prompt: "Предложи свежие награды до 400 очков с упором на семейные ритуалы.",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    title: "Диалог с ребёнком",
    description: "Получите сценарий беседы",
    prompt: "Подскажи, как поговорить с ребёнком о снижении мотивации, чтобы он не замкнулся.",
    accent: "from-purple-500/20 to-fuchsia-500/10",
  },
]

const starterIdeas = [
  "Смести расписание задач на неделю с указанием времени и XP",
  "Разбей награду 'поход в музей' на микро-бонусы",
  "Придумай тёплое сообщение для семейного чата с итогами недели",
  "Сделай чек-лист подготовки к утру для ребёнка 9 лет",
]

export default function AIChatPage({ userName, role = "parent", familyName, onBack }: AIChatPageProps) {
  const [input, setInput] = useState("")
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const greeting = useMemo(() => {
    const persona = role === "child" ? "Твой семейный наставник здесь" : "Готов построить семейную стратегию"
    const family = familyName ? ` семьи «${familyName}»` : ""
    return `${persona}! ${userName ? `${userName},` : ""} я помогу с задачами, наградами и коммуникацией${family}. Сформулируй запрос — и я сделаю остальное.`
  }, [familyName, role, userName])

  const context = useMemo(() => {
    const base: Record<string, string> = {
      locale: "ru-RU",
      audience: role,
    }

    if (userName) {
      base.displayName = userName
    }
    if (familyName) {
      base.familyName = familyName
    }

    return base
  }, [familyName, role, userName])

  const { messages, sendMessage, isThinking, followUps, lastReplyAt, conversationId, reset } = useAiChat({
    greeting,
    context,
    maxHistory: 14,
  })

  const autoScroll = useCallback(() => {
    const target = scrollerRef.current
    if (!target) return
    target.scrollTo({ top: target.scrollHeight, behavior: "smooth" })
  }, [])

  useEffect(() => {
    autoScroll()
  }, [autoScroll, messages, isThinking])

  const handleSubmit = async () => {
    const payload = input.trim()
    if (!payload) return
    setInput("")
    await sendMessage(payload)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput("")
    void sendMessage(prompt)
  }

  const handleSuggestion = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="relative min-h-screen bg-[#050914] text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">AI Command Room</p>
            <h1 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
              Интеллектуальный ассистент семьи
            </h1>
            <p className="mt-2 text-sm text-slate-300/90">
              Попроси создать набор задач, сводку недели или подготовить сообщение — ассистент выполнит запрос с учетом
              семейного контекста.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            {onBack ? (
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            ) : null}
            <Badge variant="secondary" className={cn("flex items-center gap-2 border-0 bg-emerald-500/20 text-emerald-50", isThinking && "bg-yellow-500/20 text-yellow-100")}> 
              <Sparkles className="h-3 w-3" />
              {isThinking ? "ИИ формирует ответ" : "Онлайн"}
            </Badge>
            <p className="text-xs text-slate-300/80">
              {lastReplyAt ? `Последний ответ ${lastReplyAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Диалог только стартует"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Диалог</p>
                <h2 className="text-xl font-semibold text-white">AI-оператор</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300/80">
                {conversationId ? <span className="rounded-full bg-white/5 px-3 py-1">Session: {conversationId.slice(0, 8)}</span> : null}
                <Button variant="ghost" size="sm" className="text-xs text-slate-200 hover:bg-white/10" onClick={reset}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Сбросить
                </Button>
              </div>
            </header>

            <div className="flex flex-col gap-4 px-4 py-6">
              <div ref={scrollerRef} className="h-[60vh] overflow-y-auto rounded-2xl bg-black/20 p-5 shadow-inner shadow-black/40">
                <div className="flex flex-col gap-4">
                  {messages.map(message => (
                    <div key={message.id} className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}> 
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-lg",
                          message.role === "user"
                            ? "rounded-br-sm border-emerald-400/40 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-50"
                            : "rounded-bl-sm border-white/10 bg-white/5 text-slate-100"
                        )}
                      >
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/60">
                          {message.role === "user" ? "Вы" : message.role === "assistant" ? "ИИ" : "Система"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{message.content}</p>
                        <p className="mt-3 text-[11px] text-white/50">
                          {message.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <div className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                      <span>Готовлю ответ…</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {followUps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {followUps.map(followUp => (
                      <button
                        key={followUp}
                        type="button"
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-400/40 hover:text-white"
                        onClick={() => handleSuggestion(followUp)}
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-lg shadow-black/40">
                  <Textarea
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Расскажи, что должен сделать ассистент. Например: “Подготовь письмо родителям с итогами недели и списком задач на понедельник.”"
                    className="min-h-[120px] resize-none border-none bg-transparent text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">Shift+Enter — перенос строки</div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-slate-200 hover:bg-white/10"
                        onClick={() => handleSuggestion(starterIdeas[Math.floor(Math.random() * starterIdeas.length)])}
                      >
                        <Wand2 className="mr-1 h-3.5 w-3.5" /> Случайная идея
                      </Button>
                      <Button
                        type="button"
                        disabled={isThinking || !input.trim()}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-emerald-500/40 hover:opacity-90"
                        onClick={handleSubmit}
                      >
                        Отправить
                        <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                  <Bot className="h-4 w-4" />
                  Быстрые действия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map(action => (
                  <button
                    key={action.title}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm transition hover:border-emerald-300/40",
                      `bg-gradient-to-r ${action.accent}`,
                    )}
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <p className="font-semibold text-white">{action.title}</p>
                    <p className="text-xs text-slate-200/90">{action.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/30 text-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-white">
                  <PenSquare className="h-4 w-4" />
                  Шаблоны запросов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-relaxed">
                {starterIdeas.map(prompt => (
                  <div key={prompt} className="rounded-2xl border border-white/5 bg-white/5 p-3">
                    <p>{prompt}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7 text-[11px] text-emerald-200 hover:bg-white/10"
                      onClick={() => handleSuggestion(prompt)}
                    >
                      Вставить в поле
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm text-white">Информация о контексте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-slate-300">Роль: {role === "child" ? "ребёнок" : "родитель"}</p>
                  {userName ? <p className="text-slate-300">Имя: {userName}</p> : null}
                  {familyName ? <p className="text-slate-300">Семья: {familyName}</p> : null}
                </div>
                <Separator className="border-white/10" />
                <p className="text-slate-400">
                  Ассистент использует контекст роли и семьи, чтобы формировать ответы во всех сценариях: постановка задач,
                  рекомендации по наградам, объяснение правил, текст для семейного чата.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
