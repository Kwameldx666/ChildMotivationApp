"use client"

// cspell:disable

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, ArrowLeft, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AIChatPageProps {
  onBack: () => void
}

export default function AIChatPage({ onBack }: AIChatPageProps) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content:
        "Привет! Я твой AI-помощник. Помогу придумать задания, награды и подсказать идеи. Расскажи, что нужно.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const suggestions = [
    "Предложи задания для ребёнка 10–12 лет на неделю.",
    "Идеи наград за учёбу и помощь по дому.",
    "Какие эмблемы можно придумать для семьи?",
    "Как быстро заработать XP в приложении?",
  ]

  const handleSend = async () => {
    await sendMessage(input)
  }

  const handleSuggestion = async (suggestion: string) => {
    if (isLoading) return
    await sendMessage(suggestion)
  }

  const sendMessage = async (rawMessage: string) => {
    const userMessage = rawMessage.trim()
    if (!userMessage) return

    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const aiResponses: Record<string, string> = {
      задан: "Вот идеи заданий: 1) Помочь по дому (уборка/посуда). 2) Учёба: 20–30 минут чтения или математики. 3) Творчество: рисунок или поделка. 4) Спорт: 15–30 минут активности. Добавь чёткие сроки и баллы, чтобы было понятнее.",
      награ: "Популярные награды: дополнительное время на игры, выбор фильма, маленькая покупка, совместная прогулка или квест. Привяжи награды к уровню сложности заданий, чтобы мотивация была выше.",
      эмблем: "Эмблема семьи: выбери символ, цвета и девиз. Нарисуйте вместе на бумаге, сфотографируйте и загрузите. Можно взять животное-тотем или первую букву фамилии.",
      xp: "XP растёт за выполненные задачи. Сделай ежедневные мелкие задания, чтобы получать стабильные очки, и добавь недельные цели с крупными бонусами.",
    }

    const lowerMessage = userMessage.toLowerCase()
    let response = "Я готов помочь! Уточни, что именно нужно: задания, награды, эмблемы или что-то ещё."

    for (const [key, value] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(key)) {
        response = value
        break
      }
    }

    setMessages((prev) => [...prev, { role: "ai", content: response }])
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="sticky top-0 z-40 bg-linear-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          AI Помощник
        </h1>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card className={`max-w-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="pt-4">
                <p className="text-sm">{msg.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        {isLoading && <div className="text-center text-muted-foreground">AI думает...</div>}
      </ScrollArea>

      {messages.length === 1 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Попробуй один из вариантов:</p>
          <div className="space-y-2">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestion(sug)}
                className="w-full text-left text-sm p-2 rounded border border-border hover:bg-muted transition-colors"
                disabled={isLoading}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-4 bg-muted">
        <div className="flex gap-2">
          <Input
            placeholder="Напиши, что хочешь обсудить..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// cspell:enable
