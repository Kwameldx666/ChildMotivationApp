"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface OnboardingTipsProps {
  onComplete: () => void
}

export default function OnboardingTips({ onComplete }: OnboardingTipsProps) {
  const { t } = useTranslation()
  const [currentSlide, setCurrentSlide] = useState(0)

  const tips = [
    {
      title: t("onboarding.tip0Title"),
      description: t("onboarding.tip0Description"),
      icon: "🎮",
      details: [
        t("onboarding.tip0Detail0"),
        t("onboarding.tip0Detail1"),
        t("onboarding.tip0Detail2"),
      ],
    },
    {
      title: t("onboarding.tip1Title"),
      description: t("onboarding.tip1Description"),
      icon: "📋",
      details: [
        t("onboarding.tip1Detail0"),
        t("onboarding.tip1Detail1"),
        t("onboarding.tip1Detail2"),
      ],
    },
    {
      title: t("onboarding.tip2Title"),
      description: t("onboarding.tip2Description"),
      icon: "🎁",
      details: [
        t("onboarding.tip2Detail0"),
        t("onboarding.tip2Detail1"),
        t("onboarding.tip2Detail2"),
      ],
    },
    {
      title: t("onboarding.tip3Title"),
      description: t("onboarding.tip3Description"),
      icon: "🏆",
      details: [t("onboarding.tip3Detail0"), t("onboarding.tip3Detail1"), t("onboarding.tip3Detail2")],
    },
    {
      title: t("onboarding.tip4Title"),
      description: t("onboarding.tip4Description"),
      icon: "⚡",
      details: [t("onboarding.tip4Detail0"), t("onboarding.tip4Detail1"), t("onboarding.tip4Detail2")],
    },
    {
      title: t("onboarding.tip5Title"),
      description: t("onboarding.tip5Description"),
      icon: "🚀",
      details: [t("onboarding.tip5Detail0"), t("onboarding.tip5Detail1"), t("onboarding.tip5Detail2")],
    },
  ]

  const nextSlide = () => {
    if (currentSlide === tips.length - 1) {
      onComplete()
    } else {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const tip = tips[currentSlide]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        <Card className="border-2 shadow-2xl backdrop-blur">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">{tip.icon}</div>
              <h1 className="text-3xl font-bold mb-2">{tip.title}</h1>
              <p className="text-muted-foreground text-lg">{tip.description}</p>
            </div>

            <div className="bg-accent/10 border border-accent rounded-lg p-6 mb-8">
              <div className="space-y-3">
                {tip.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-lg">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={prevSlide}
                variant="outline"
                disabled={currentSlide === 0}
                className="flex-1 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t("common.back")}
              </Button>

              <div className="flex gap-2">
                {tips.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      idx === currentSlide ? "bg-primary w-8" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextSlide}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {currentSlide === tips.length - 1 ? (
                  <>
                    {t("onboarding.start")}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {t("onboarding.step", { current: currentSlide + 1, total: tips.length })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
