"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bot,
  Check,
  Maximize2,
  MessageSquare,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat"
import type { AiAction } from "@/services/ai-service"
import { useTranslation } from "@/i18n/provider"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import { useUserSettings } from "@/hooks/use-user-settings"

/* ─── quick starters shown when conversation is empty ─── */
function QuickStarters({
  starters,
  onPick,
}: {
  starters: { emoji: string; label: string; prompt: string }[]
  onPick: (prompt: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-1">
      {starters.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => onPick(s.prompt)}
          className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/50 p-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-muted"
        >
          <span className="text-base leading-none">{s.emoji}</span>
          <span className="leading-snug text-foreground/80">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ─── lightweight inline markdown for AI responses ─── */
function renderMarkdown(text: string): React.ReactNode {
  // Split on newlines to handle line-level markdown
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Bullet lists
    if (/^\s*[-•*]\s/.test(line)) {
      const content = line.replace(/^\s*[-•*]\s/, "")
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="mt-1.5 h-1 w-1 rounded-full bg-current shrink-0 opacity-60" />
          <span>{inlineFormat(content)}</span>
        </div>
      )
      continue
    }

    // Numbered lists
    if (/^\s*\d+[.)]\s/.test(line)) {
      const num = line.match(/^\s*(\d+)/)?.[1] ?? ""
      const content = line.replace(/^\s*\d+[.)]\s/, "")
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-xs font-semibold opacity-70 mt-0.5 shrink-0">{num}.</span>
          <span>{inlineFormat(content)}</span>
        </div>
      )
      continue
    }

    // Empty lines → space
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1" />)
      continue
    }

    // Regular text
    elements.push(<div key={i}>{inlineFormat(line)}</div>)
  }

  return <div className="space-y-0.5">{elements}</div>
}

/** Format inline markdown: **bold**, *italic*, `code` */
function inlineFormat(text: string): React.ReactNode {
  // Pattern: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-foreground/10 px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

/* ─── single message bubble ─── */
function MessageBubble({
  message,
  t,
  onExecuteAction,
  onDismissAction,
  actionFilter,
}: {
  message: ChatMessage
  t: (key: string, params?: Record<string, string>) => string
  onExecuteAction: (a: AiAction) => Promise<void>
  onDismissAction: (a: AiAction) => void
  actionFilter?: (a: AiAction) => boolean
}) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[85%] flex-col gap-1">
        {/* avatar row */}
        {!isUser && (
          <div className="flex items-center gap-1.5 px-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {t("aiWidget.assistantName")}
            </span>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">
            {isUser ? message.content : renderMarkdown(message.content)}
          </p>
        </div>

        {/* inline actions */}
        {!isUser && message.actions && message.actions.length > 0 && (() => {
          const filtered = actionFilter ? message.actions.filter(actionFilter) : message.actions
          return filtered.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
              {filtered.map((action, idx) => (
                <WidgetActionButton
                  key={`${message.id}-a-${idx}`}
                  action={action}
                  onExecute={onExecuteAction}
                  onDismiss={onDismissAction}
                  t={t}
                />
              ))}
            </div>
          ) : null
        })()}

        <span className="px-1 text-[10px] text-muted-foreground/60">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

/* ─── compact action button ─── */
function WidgetActionButton({
  action,
  onExecute,
  onDismiss,
  t,
}: {
  action: AiAction
  onExecute: (a: AiAction) => Promise<void>
  onDismiss: (a: AiAction) => void
  t: (key: string) => string
}) {
  const [busy, setBusy] = useState(false)
  const handleClick = async () => {
    setBusy(true)
    try {
      await onExecute(action)
    } finally {
      setBusy(false)
    }
  }

  const icons: Record<string, React.ReactNode> = {
    CreateTask: <Check className="h-3 w-3" />,
    CreateTasks: <Check className="h-3 w-3" />,
    CreateReward: <Sparkles className="h-3 w-3" />,
    CreateRewards: <Sparkles className="h-3 w-3" />,
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        action.variant === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
          : action.variant === "secondary"
            ? "border-border bg-muted text-foreground hover:bg-muted/80"
            : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
      )}
    >
      {icons[action.type] ?? <Play className="h-3 w-3" />}
      {busy ? t("aiWidget.executing") : action.label}
    </button>
  )
}

/* ─── typing indicator ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Custom event to open widget from anywhere
   ═══════════════════════════════════════════════ */
const AI_WIDGET_OPEN_EVENT = "ai-widget:open"

/** Call this from any component to open the floating AI chat */
export function openAiChat() {
  window.dispatchEvent(new CustomEvent(AI_WIDGET_OPEN_EVENT))
}

/* ═══════════════════════════════════════════════
   Main floating widget
   ═══════════════════════════════════════════════ */
export default function AiChatWidget() {
  const { t, locale } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const { settings } = useUserSettings()

  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /* ── listen for external open requests ── */
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(AI_WIDGET_OPEN_EVENT, handler)
    return () => window.removeEventListener(AI_WIDGET_OPEN_EVENT, handler)
  }, [])

  /* ── build greeting & context from session ── */
  const role = session?.profile.role ?? "parent"
  const userName = session?.profile.name
  const familyName = session?.family?.name ?? null

  const greeting = useMemo(() => {
    return `${t("aiWidget.greeting")}${userName ? `, ${userName}` : ""}! ${t("aiWidget.greetingSuffix")}`
  }, [t, userName])

  const context = useMemo(() => {
    const localeMap: Record<string, string> = { en: "en-US", ru: "ru-RU", ro: "ro-RO" }
    const base: Record<string, string> = { locale: localeMap[locale] ?? locale, audience: role }
    if (userName) base.displayName = userName
    if (familyName) base.familyName = familyName
    if (settings.aiTone) base.tone = settings.aiTone
    return base
  }, [role, userName, familyName, locale, settings.aiTone])

  const {
    messages,
    sendMessage,
    isThinking,
    followUps,
    pendingActions,
    conversationId,
    reset,
    executeAction,
    dismissAction,
  } = useAiChat({ greeting, context, maxHistory: 10, t })

  /* ── quick starters ── */
  const starters = useMemo(
    () => [
      { emoji: "🎯", label: t("aiWidget.starters.tasks"), prompt: t("aiWidget.starters.tasksPrompt") },
      { emoji: "🏆", label: t("aiWidget.starters.rewards"), prompt: t("aiWidget.starters.rewardsPrompt") },
      { emoji: "💬", label: t("aiWidget.starters.talk"), prompt: t("aiWidget.starters.talkPrompt") },
      { emoji: "📊", label: t("aiWidget.starters.summary"), prompt: t("aiWidget.starters.summaryPrompt") },
    ],
    [t],
  )

  /* ── auto‑scroll ── */
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking, scrollToBottom])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  /* ── handlers ── */
  const handleSend = async () => {
    const text = input.trim()
    if (!text || isThinking) return
    setInput("")
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleStarter = (prompt: string) => {
    setInput("")
    void sendMessage(prompt)
  }

  const handleReset = () => {
    reset()
    setInput("")
  }

  /* ── don't render for unauthenticated users or when AI is disabled ── */
  if (!session) return null
  if (!settings.aiChatEnabled) return null

  const unreadHint = messages.length > 1 && !open

  /* ── size classes ── */
  const panelW = expanded ? "w-[520px]" : "w-[380px]"
  const panelH = expanded ? "h-[600px]" : "h-[480px]"

  const hasRealMessages = messages.length > 1 // more than just the greeting

  return (
    <>
      {/* ── Floating Bubble ── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30",
            "transition-all duration-300 hover:scale-110 active:scale-95 animate-in fade-in zoom-in",
          )}
          aria-label={t("aiWidget.openChat")}
        >
          <MessageSquare className="h-6 w-6" />
          {unreadHint && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              !
            </span>
          )}
        </button>
      )}

      {/* ── Panel ── */}
      {open && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            "animate-in fade-in slide-in-from-bottom-4 duration-300",
            panelW,
            panelH,
            "max-h-[calc(100dvh-2.5rem)] max-w-[calc(100vw-2.5rem)]",
            "transition-[width,height] duration-300 ease-in-out",
          )}
        >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{t("aiWidget.title")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isThinking ? t("aiWidget.thinking") : t("aiWidget.online")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasRealMessages && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={t("aiWidget.newChat")}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
                  title={expanded ? t("aiWidget.collapse") : t("aiWidget.expand")}
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={t("aiWidget.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ─── Messages ─── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    t={t}
                    onExecuteAction={executeAction}
                    onDismissAction={dismissAction}
                    actionFilter={(a) => {
                      const taskTypes = ["CreateTask", "CreateTasks"]
                      const rewardTypes = ["CreateReward", "CreateRewards"]
                      if (taskTypes.includes(a.type) && !settings.aiCanCreateTasks) return false
                      if (rewardTypes.includes(a.type) && !settings.aiCanCreateRewards) return false
                      return true
                    }}
                  />
                ))}

                {isThinking && <TypingDots />}

                {/* quick starters — show when only greeting exists */}
                {!hasRealMessages && !isThinking && (
                  <div className="pt-2">
                    <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                      {t("aiWidget.startersLabel")}
                    </p>
                    <QuickStarters starters={starters} onPick={handleStarter} />
                  </div>
                )}
              </div>
            </div>

            {/* ─── Pending Actions (filtered by AI permissions) ─── */}
            {(() => {
              const taskTypes = ["CreateTask", "CreateTasks"]
              const rewardTypes = ["CreateReward", "CreateRewards"]
              const filtered = pendingActions.filter((a) => {
                if (taskTypes.includes(a.type) && !settings.aiCanCreateTasks) return false
                if (rewardTypes.includes(a.type) && !settings.aiCanCreateRewards) return false
                return true
              })
              return filtered.length > 0 ? (
                <div className="border-t bg-primary/5 px-3 py-2">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {t("aiWidget.actions")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {filtered.map((a, i) => (
                      <WidgetActionButton
                        key={`pa-${i}`}
                        action={a}
                        onExecute={executeAction}
                        onDismiss={dismissAction}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* ─── Follow‑ups ─── */}
            {followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
                {followUps.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setInput("")
                      void sendMessage(f)
                    }}
                    className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* ─── Input ─── */}
            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("aiWidget.inputPlaceholder")}
                  rows={1}
                  className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border-border/60 bg-muted/40 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
                />
                <Button
                  size="icon"
                  disabled={isThinking || !input.trim()}
                  onClick={() => void handleSend()}
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                {t("aiWidget.poweredBy")}
              </p>
            </div>
        </div>
      )}
    </>
  )
}
