"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Wifi, Search, Home, Lock } from "lucide-react"

export type ErrorType = "no-internet" | "not-found" | "no-family" | "family-not-found" | "invalid-code" | "no-tasks"

interface ErrorScreenProps {
  type: ErrorType
  onRetry?: () => void
  onGoHome?: () => void
}

const ERROR_CONFIGS = {
  "no-internet": {
    icon: Wifi,
    title: "Нет подключения к интернету",
    description: "Проверьте ваше соединение и попробуйте снова",
    illustration: "🌐",
  },
  "not-found": {
    icon: Search,
    title: "Страница не найдена",
    description: "К сожалению, эта страница больше не существует",
    illustration: "🔍",
  },
  "no-family": {
    icon: Home,
    title: "Семья не создана",
    description: "Сначала создайте семью, чтобы продолжить",
    illustration: "👨‍👩‍👧‍👦",
  },
  "family-not-found": {
    icon: AlertCircle,
    title: "Семья не найдена",
    description: "Код семьи неверный или семья удалена",
    illustration: "❌",
  },
  "invalid-code": {
    icon: Lock,
    title: "Неверный код",
    description: "Пожалуйста, проверьте код семьи и попробуйте снова",
    illustration: "🔐",
  },
  "no-tasks": {
    icon: AlertCircle,
    title: "Нет задач",
    description: "Задач пока нет. Родитель создаст их вскоре",
    illustration: "📭",
  },
}

export default function ErrorScreen({ type, onRetry, onGoHome }: ErrorScreenProps) {
  const config = ERROR_CONFIGS[type]
  const Icon = config.icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 text-center pb-12">
          <div className="text-6xl mb-6">{config.illustration}</div>

          <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
          <p className="text-muted-foreground mb-8">{config.description}</p>

          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                Попробовать снова
              </Button>
            )}
            {onGoHome && (
              <Button onClick={onGoHome} variant="outline" className="flex-1 bg-transparent">
                На главную
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
