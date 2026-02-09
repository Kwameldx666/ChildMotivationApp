"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface LevelUpAnimationProps {
  show: boolean
  level: number
  onComplete: () => void
}

export default function LevelUpAnimation({ show, level, onComplete }: LevelUpAnimationProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Card className="w-96 border-4 border-accent shadow-2xl animate-in zoom-in-95">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-32 h-32 text-accent animate-pulse" />
            </div>
            <div className="relative z-10 text-8xl font-bold text-primary animate-bounce">{level}</div>
          </div>
          <h2 className="text-3xl font-bold mb-2">{t("levelUp.title")}</h2>
          <p className="text-muted-foreground text-lg">{t("levelUp.congratulations")}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <span className="text-4xl animate-bounce delay-100">🎉</span>
            <span className="text-4xl animate-bounce delay-200">✨</span>
            <span className="text-4xl animate-bounce delay-300">🎊</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
