"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Sparkles, Lightbulb, Bot, User, Zap, TrendingUp, Target, Award } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/provider"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const SUGGESTION_KEYS = [
  { icon: Target, color: "from-blue-500 to-cyan-500", key: "createTasks" },
  { icon: Zap, color: "from-orange-500 to-yellow-500", key: "motivate" },
  { icon: Award, color: "from-purple-500 to-pink-500", key: "rewards" },
  { icon: TrendingUp, color: "from-emerald-500 to-teal-500", key: "progress" },
]

export default function AIAssistant() {
  const { t, locale } = useTranslation()
  const suggestions = SUGGESTION_KEYS.map(s => ({
    ...s,
    title: t(`aiAssistant.suggestions.${s.key}.title`),
    description: t(`aiAssistant.suggestions.${s.key}.description`),
    prompt: t(`aiAssistant.suggestions.${s.key}.prompt`),
  }))

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t("aiAssistant.welcomeMessage"),
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (customInput?: string) => {
    const messageText = customInput || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("aiAssistant.mockResponse", { query: messageText }),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestion = (prompt: string) => {
    if (isLoading) return
    setInput("")
    void handleSend(prompt)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {t("aiAssistant.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("aiAssistant.subtitle")}
          </p>
          <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-slate-900/50">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("aiAssistant.onlineStatus")}
          </Badge>
        </div>

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon
              return (
                <Card
                  key={idx}
                  className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-violet-200 dark:hover:border-violet-800 overflow-hidden"
                  onClick={() => handleSuggestion(suggestion.prompt)}
                >
                  <div className={`h-2 bg-gradient-to-r ${suggestion.color}`} />
                  <CardContent className="pt-5 pb-4">
                    <div className="space-y-3">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${suggestion.color} shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Chat Container */}
        <Card className="shadow-2xl border-2 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Bot className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">{t("aiAssistant.chatTitle")}</h2>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {messages.length - 1} {messages.length === 2 ? t("aiAssistant.messageCountOne") : t("aiAssistant.messageCountMany")}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto bg-gradient-to-b from-white to-violet-50/30 dark:from-slate-900 dark:to-purple-950/30">
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom duration-300`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-10 w-10 border-2 border-violet-200 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600">
                        <Bot className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] ${message.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-1 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                      {message.timestamp.toLocaleTimeString(locale === "ru" ? "ru-RU" : locale === "ro" ? "ro-RO" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-10 w-10 border-2 border-violet-200 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                        <User className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start animate-in slide-in-from-bottom">
                  <Avatar className="h-10 w-10 border-2 border-violet-200 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600">
                      <Bot className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-900 px-5 py-3 rounded-2xl rounded-bl-sm shadow-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-white dark:bg-slate-900 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  placeholder={t("aiAssistant.inputPlaceholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  disabled={isLoading}
                  className="pr-12 py-6 text-base border-2 focus:border-violet-300 dark:focus:border-violet-700 rounded-xl"
                />
                <Lightbulb className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()} 
                size="lg"
                className="h-14 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/60"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
