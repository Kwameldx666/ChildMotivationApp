"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Sparkles, Lightbulb } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const SUGGESTIONS = [
  {
    icon: "📋",
    title: "Какие задачи создать?",
    description: "Получи идеи для эффективных домашних дел",
  },
  {
    icon: "🎯",
    title: "Как мотивировать?",
    description: "Советы по повышению мотивации ребёнка",
  },
  {
    icon: "🏆",
    title: "Система наград",
    description: "Рекомендации для справедливой системы",
  },
  {
    icon: "📊",
    title: "Анализ прогресса",
    description: "Советы по улучшению результатов",
  },
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Привет! Я ваш ИИ помощник в управлении семьей. Я могу помочь вам с идеями задач, советами по мотивации, рекомендациями по системе наград и многим другим. Что вас интересует?",
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Спасибо за вопрос! На основе вашего вопроса "${input}", вот мои рекомендации:\n\n1. Начните с малого - создавайте 2-3 задачи в день\n2. Варьируйте сложность для интереса\n3. Проверяйте прогресс еженедельно\n4. Награждайте достижения незамедлительно\n\nХотели бы вы подробнее узнать о каком-то из этих пунктов?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-accent" />
          ИИ помощник
        </h1>
        <p className="text-muted-foreground">Получите рекомендации по управлению семейными задачами</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {SUGGESTIONS.map((suggestion, idx) => (
          <Card
            key={idx}
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleSuggestion(suggestion.title)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{suggestion.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-96 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            Диалог с ИИ
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Задайте вопрос..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
