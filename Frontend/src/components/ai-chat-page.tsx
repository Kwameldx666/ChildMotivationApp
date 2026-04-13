"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Bot, Check, PenSquare, Play, RotateCcw, Send, Sparkles, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat"
import type { AiAction } from "@/services/ai-service"
import { useTranslation } from "@/i18n/provider"
import { useUserSettings } from "@/hooks/use-user-settings"

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

export default function AIChatPage({ userName, role = "parent", familyName, onBack }: AIChatPageProps) {
  const { t } = useTranslation()
  const { settings } = useUserSettings()

  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: t("aiChatPage.quickActions.taskSprint.title"),
      description: t("aiChatPage.quickActions.taskSprint.description"),
      prompt: t("aiChatPage.quickActions.taskSprint.prompt"),
      accent: "from-emerald-500/20 to-teal-500/10",
    },
    {
      title: t("aiChatPage.quickActions.rewardBoost.title"),
      description: t("aiChatPage.quickActions.rewardBoost.description"),
      prompt: t("aiChatPage.quickActions.rewardBoost.prompt"),
      accent: "from-amber-500/20 to-orange-500/10",
    },
    {
      title: t("aiChatPage.quickActions.childDialog.title"),
      description: t("aiChatPage.quickActions.childDialog.description"),
      prompt: t("aiChatPage.quickActions.childDialog.prompt"),
      accent: "from-purple-500/20 to-fuchsia-500/10",
    },
  ], [t])

  const starterIdeas = useMemo(() => [
    t("aiChatPage.starterIdeas.weeklySchedule"),
    t("aiChatPage.starterIdeas.microBonuses"),
    t("aiChatPage.starterIdeas.weekSummary"),
    t("aiChatPage.starterIdeas.morningChecklist"),
  ], [t])

  const [input, setInput] = useState("")
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const greeting = useMemo(() => {
    const persona = role === "child" ? t("aiChatPage.greeting.childPersona") : t("aiChatPage.greeting.parentPersona")
    const family = familyName ? ` ${t("aiChatPage.greeting.familySuffix", { familyName })}` : ""
    return `${persona}! ${userName ? `${userName},` : ""} ${t("aiChatPage.greeting.helpMessage")}${family}. ${t("aiChatPage.greeting.cta")}`
  }, [familyName, role, userName, t])

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

  const { messages, sendMessage, isThinking, followUps, pendingActions, lastReplyAt, conversationId, reset, executeAction, dismissAction } = useAiChat({
    greeting,
    context,
    maxHistory: 14,
    storageKey: `familyquest:ai-chat:page:${role}:${userName ?? 'anonymous'}:${familyName ?? 'none'}`,
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
    if (isThinking) return
    setInput("")
    void sendMessage(prompt)
  }

  const handleSuggestion = (prompt: string) => {
    if (isThinking) return
    setInput("")
    void sendMessage(prompt)
  }

  const actionFilter = useCallback((action: AiAction) => {
    const taskTypes = ["CreateTask", "CreateTasks", "UpdateTask", "CompleteTask"]
    const rewardTypes = ["CreateReward", "CreateRewards"]
    if (role === "child" && [...taskTypes, ...rewardTypes].includes(action.type)) return false
    if (taskTypes.includes(action.type) && !settings.aiCanCreateTasks) return false
    if (rewardTypes.includes(action.type) && !settings.aiCanCreateRewards) return false
    return true
  }, [role, settings.aiCanCreateTasks, settings.aiCanCreateRewards])

  const visiblePendingActions = pendingActions.filter(actionFilter)

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
              {t("aiChatPage.header.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-300/90">
              {t("aiChatPage.header.description")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            {onBack ? (
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            ) : null}
            <Badge variant="secondary" className={cn("flex items-center gap-2 border-0 bg-emerald-500/20 text-emerald-50", isThinking && "bg-yellow-500/20 text-yellow-100")}> 
              <Sparkles className="h-3 w-3" />
              {isThinking ? t("aiChatPage.status.thinking") : t("aiChatPage.status.online")}
            </Badge>
            <p className="text-xs text-slate-300/80">
              {lastReplyAt ? t("aiChatPage.status.lastReply", { time: lastReplyAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) }) : t("aiChatPage.status.dialogStart")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">{t("aiChatPage.dialog.label")}</p>
                <h2 className="text-xl font-semibold text-white">{t("aiChatPage.dialog.title")}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300/80">
                {conversationId ? <span className="rounded-full bg-white/5 px-3 py-1">Session: {conversationId.slice(0, 8)}</span> : null}
                <Button variant="ghost" size="sm" className="text-xs text-slate-200 hover:bg-white/10" onClick={reset}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> {t("aiChatPage.dialog.reset")}
                </Button>
              </div>
            </header>

            <div className="flex flex-col gap-4 px-4 py-6">
              <div ref={scrollerRef} className="h-[60vh] overflow-y-auto rounded-2xl bg-black/20 p-5 shadow-inner shadow-black/40">
                <div className="flex flex-col gap-4">
                  {messages.map(message => (
                    <div key={message.id} className={cn("flex w-full flex-col", message.role === "user" ? "items-end" : "items-start")}> 
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl border px-4 py-3 text-sm shadow-lg",
                          message.role === "user"
                            ? "rounded-br-sm border-emerald-400/40 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-50"
                            : "rounded-bl-sm border-white/10 bg-white/5 text-slate-100"
                        )}
                      >
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/60">
                          {message.role === "user" ? t("aiChatPage.messages.you") : message.role === "assistant" ? t("aiChatPage.messages.ai") : t("aiChatPage.messages.system")}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">{message.content}</p>
                        <p className="mt-3 text-[11px] text-white/50">
                          {message.timestamp.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      
                      {/* Render actions for assistant messages */}
                      {message.role === "assistant" && message.actions && (() => {
                        const visibleActions = message.actions.filter(actionFilter)
                        return visibleActions.length > 0 ? (
                          <div className="mt-2 flex max-w-[80%] flex-wrap gap-2">
                            {visibleActions.map((action, idx) => (
                              <ActionButton
                                key={`${message.id}-action-${idx}`}
                                action={action}
                                onExecute={executeAction}
                                onDismiss={dismissAction}
                              />
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <div className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                      <span>{t("aiChatPage.messages.preparing")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Actions Panel */}
              {visiblePendingActions.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    {t("aiChatPage.actions.available")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {visiblePendingActions.map((action, idx) => (
                      <ActionButton
                        key={`pending-${idx}`}
                        action={action}
                        onExecute={executeAction}
                        onDismiss={dismissAction}
                        showDismiss
                      />
                    ))}
                  </div>
                </div>
              )}

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
                    placeholder={t("aiChatPage.input.placeholder")}
                    className="min-h-[120px] resize-none border-none bg-transparent text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">{t("aiChatPage.input.shiftEnterHint")}</div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-slate-200 hover:bg-white/10"
                        onClick={() => handleSuggestion(starterIdeas[Math.floor(Math.random() * starterIdeas.length)])}
                      >
                        <Wand2 className="mr-1 h-3.5 w-3.5" /> {t("aiChatPage.input.randomIdea")}
                      </Button>
                      <Button
                        type="button"
                        disabled={isThinking || !input.trim()}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-emerald-500/40 hover:opacity-90"
                        onClick={handleSubmit}
                      >
                        {t("aiChatPage.input.send")}
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
                  {t("aiChatPage.sidebar.quickActions")}
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
                  {t("aiChatPage.sidebar.promptTemplates")}
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
                      {t("aiChatPage.sidebar.insertToField")}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle className="text-sm text-white">{t("aiChatPage.sidebar.contextInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-slate-300">{t("aiChatPage.context.roleLabel", { role: role === "child" ? t("aiChatPage.context.roleChild") : t("aiChatPage.context.roleParent") })}</p>
                  {userName ? <p className="text-slate-300">{t("aiChatPage.context.nameLabel", { name: userName })}</p> : null}
                  {familyName ? <p className="text-slate-300">{t("aiChatPage.context.familyLabel", { family: familyName })}</p> : null}
                </div>
                <Separator className="border-white/10" />
                <p className="text-slate-400">
                  {t("aiChatPage.context.description")}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

// Action Button Component
interface ActionButtonProps {
  action: AiAction
  onExecute: (action: AiAction) => Promise<void>
  onDismiss: (action: AiAction) => void
  showDismiss?: boolean
}

function ActionButton({ action, onExecute, onDismiss, showDismiss = false }: ActionButtonProps) {
  const { t } = useTranslation()
  const [isExecuting, setIsExecuting] = useState(false)

  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      await onExecute(action)
    } finally {
      setIsExecuting(false)
    }
  }

  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90",
    secondary: "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/20",
    destructive: "bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30",
  }

  const actionIcons: Record<string, React.ReactNode> = {
    CreateTask: <Check className="h-3.5 w-3.5" />,
    CreateTasks: <Check className="h-3.5 w-3.5" />,
    CreateReward: <Sparkles className="h-3.5 w-3.5" />,
    CreateRewards: <Sparkles className="h-3.5 w-3.5" />,
    Navigate: <Play className="h-3.5 w-3.5" />,
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        disabled={isExecuting}
        className={cn(
          "h-8 gap-1.5 rounded-full px-3 text-xs font-medium transition-all",
          variantStyles[action.variant] ?? variantStyles.primary
        )}
        onClick={handleExecute}
      >
        {actionIcons[action.type] ?? <Play className="h-3.5 w-3.5" />}
        {isExecuting ? t("aiChatPage.actions.executing") : action.label}
      </Button>
      {showDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(action)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
