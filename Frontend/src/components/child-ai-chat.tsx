"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bot,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat"
import { useTranslation } from "@/i18n/provider"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import { useUserSettings } from "@/hooks/use-user-settings"

/* ─── inline markdown ─── */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*[-•*]\s/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="mt-1.5 h-1 w-1 rounded-full bg-current shrink-0 opacity-60" />
          <span>{inlineFormat(line.replace(/^\s*[-•*]\s/, ""))}</span>
        </div>
      )
      continue
    }
    if (/^\s*\d+[.)]\s/.test(line)) {
      const num = line.match(/^\s*(\d+)/)?.[1] ?? ""
      elements.push(
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-xs font-semibold opacity-70 mt-0.5 shrink-0">{num}.</span>
          <span>{inlineFormat(line.replace(/^\s*\d+[.)]\s/, ""))}</span>
        </div>
      )
      continue
    }
    if (!line.trim()) { elements.push(<div key={i} className="h-1" />); continue }
    elements.push(<div key={i}>{inlineFormat(line)}</div>)
  }
  return <div className="space-y-0.5">{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-foreground/10 px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>
    return part
  })
}

/* ─── message bubble ─── */
function MessageBubble({ message, t }: { message: ChatMessage; t: (key: string) => string }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[80%] flex-col gap-1">
        {!isUser && (
          <div className="flex items-center gap-1.5 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              {t("aiWidget.assistantName")}
            </span>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              : "rounded-bl-md bg-card border border-border/40 text-foreground",
          )}
        >
          <div className="whitespace-pre-wrap">
            {isUser ? message.content : renderMarkdown(message.content)}
          </div>
        </div>
        <span className="px-1 text-[10px] text-muted-foreground/50">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

/* ─── typing dots ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card border border-border/40 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-violet-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Child AI Chat — gamified full-page tab
   ═══════════════════════════════════════════════ */
export default function ChildAiChat() {
  const { t, locale } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const { settings } = useUserSettings()

  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const role = session?.profile.role ?? "child"
  const userId = session?.user.id
  const userName = session?.profile.name
  const familyName = session?.family?.name ?? null

  const greeting = useMemo(() => {
    return `${t("aiWidget.greeting")}${userName ? `, ${userName}` : ""}! ${t("aiWidget.greetingSuffix")}`
  }, [t, userName])

  const context = useMemo(() => {
    const localeMap: Record<string, string> = { en: "en-US", ru: "ru-RU", ro: "ro-RO" }
    const base: Record<string, string> = { locale: localeMap[locale] ?? locale, audience: role }
    if (userId) base.userId = userId
    if (userName) base.displayName = userName
    if (familyName) base.familyName = familyName
    if (settings.aiTone) base.tone = settings.aiTone
    return base
  }, [role, userId, userName, familyName, locale, settings.aiTone])

  const {
    messages,
    sendMessage,
    isThinking,
    followUps,
    reset,
  } = useAiChat({
    greeting,
    context,
    maxHistory: 20,
    t,
    storageKey: session ? `familyquest:ai-chat:child:v2:${session.profile.role}:${session.user.id}` : undefined,
  })

  const starters = useMemo(
    () => [
      { emoji: "🎯", label: t("aiWidget.starters.tasks"), prompt: t("aiWidget.starters.tasksPrompt") },
      { emoji: "🏆", label: t("aiWidget.starters.rewards"), prompt: t("aiWidget.starters.rewardsPrompt") },
      { emoji: "💬", label: t("aiWidget.starters.talk"), prompt: t("aiWidget.starters.talkPrompt") },
      { emoji: "📊", label: t("aiWidget.starters.summary"), prompt: t("aiWidget.starters.summaryPrompt") },
    ],
    [t],
  )

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isThinking, scrollToBottom])

  // Listen for external task-context messages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail) void sendMessage(detail)
    }
    window.addEventListener("ai-widget:open-with-message", handler)
    return () => window.removeEventListener("ai-widget:open-with-message", handler)
  }, [sendMessage])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isThinking) return
    setInput("")
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }

  const hasRealMessages = messages.length > 1

  if (!session) return null
  if (!settings.aiChatEnabled) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        {t("aiControl.enableChatDesc")}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[420px] max-h-[720px] rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-gradient-to-r from-violet-500/5 via-pink-500/5 to-amber-500/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-500/20">
            <Bot className="h-5 w-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold">{t("aiWidget.title")}</p>
            <p className="text-xs text-muted-foreground">
              {isThinking ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                  {t("aiWidget.thinking")}
                </span>
              ) : t("aiWidget.online")}
            </p>
          </div>
        </div>
        {hasRealMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { reset(); setInput("") }}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("aiWidget.newChat")}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} t={t} />
          ))}
          {isThinking && <TypingDots />}

          {/* Quick starters */}
          {!hasRealMessages && !isThinking && (
            <div className="pt-4">
              <p className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
                {t("aiWidget.startersLabel")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {starters.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => { setInput(""); void sendMessage(s.prompt) }}
                    className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/80 p-3.5 text-left text-sm transition-all hover:border-primary/40 hover:bg-card hover:shadow-md hover:scale-[1.02] active:scale-95"
                  >
                    <span className="text-2xl leading-none mt-0.5">{s.emoji}</span>
                    <span className="leading-snug text-foreground/80 font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border/30 px-5 py-2.5 bg-muted/20">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setInput(""); void sendMessage(f) }}
              className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-card hover:text-foreground hover:shadow-sm"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/30 p-4 bg-muted/10">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("aiWidget.inputPlaceholder")}
            rows={1}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border-border/40 bg-card text-sm placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/40"
          />
          <Button
            size="icon"
            disabled={isThinking || !input.trim()}
            onClick={() => void handleSend()}
            className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-lg shadow-violet-500/20"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
