"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Wifi, Search, Home, Lock } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

export type ErrorType = "no-internet" | "not-found" | "no-family" | "family-not-found" | "invalid-code" | "no-tasks"

interface ErrorScreenProps {
  type: ErrorType
  onRetry?: () => void
  onGoHome?: () => void
}

const ERROR_CONFIGS = {
  "no-internet": {
    icon: Wifi,
    titleKey: "errorScreens.noInternetTitle",
    descriptionKey: "errorScreens.noInternetDescription",
    illustration: "🌐",
  },
  "not-found": {
    icon: Search,
    titleKey: "errorScreens.notFoundTitle",
    descriptionKey: "errorScreens.notFoundDescription",
    illustration: "🔍",
  },
  "no-family": {
    icon: Home,
    titleKey: "errorScreens.noFamilyTitle",
    descriptionKey: "errorScreens.noFamilyDescription",
    illustration: "👨‍👩‍👧‍👦",
  },
  "family-not-found": {
    icon: AlertCircle,
    titleKey: "errorScreens.familyNotFoundTitle",
    descriptionKey: "errorScreens.familyNotFoundDescription",
    illustration: "❌",
  },
  "invalid-code": {
    icon: Lock,
    titleKey: "errorScreens.invalidCodeTitle",
    descriptionKey: "errorScreens.invalidCodeDescription",
    illustration: "🔐",
  },
  "no-tasks": {
    icon: AlertCircle,
    titleKey: "errorScreens.noTasksTitle",
    descriptionKey: "errorScreens.noTasksDescription",
    illustration: "📭",
  },
}

export default function ErrorScreen({ type, onRetry, onGoHome }: ErrorScreenProps) {
  const { t } = useTranslation()
  const config = ERROR_CONFIGS[type]
  const Icon = config.icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 text-center pb-12">
          <div className="text-6xl mb-6">{config.illustration}</div>

          <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2">{t(config.titleKey)}</h1>
          <p className="text-muted-foreground mb-8">{t(config.descriptionKey)}</p>

          <div className="flex gap-3">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                {t("errorScreens.retry")}
              </Button>
            )}
            {onGoHome && (
              <Button onClick={onGoHome} variant="outline" className="flex-1 bg-transparent">
                {t("errorScreens.goHome")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
