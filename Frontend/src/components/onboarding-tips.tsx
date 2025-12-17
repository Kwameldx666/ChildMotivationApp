"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"

interface OnboardingTipsProps {
  onComplete: () => void
}

const tips = [
  {
    title: "Добро пожаловать в FamilyTask!",
    description: "Приложение для превращения домашних обязанностей в увлекательную игру для всей семьи",
    icon: "🎮",
    details: [
      "✓ Создавай задания для детей",
      "✓ Устанавливай награды за выполнение",
      "✓ Следи за прогрессом в реальном времени",
    ],
  },
  {
    title: "Как работают задания?",
    description: "Задания – это способ структурировать обязанности и мотивировать ребёнка",
    icon: "📋",
    details: [
      "✓ Родитель создаёт задание с описанием",
      "✓ Устанавливает сложность (1-5 звёзд)",
      "✓ Выбирает способ проверки (фото/чек-лист)",
    ],
  },
  {
    title: "Система наград",
    description: "Дети зарабатывают очки и покупают желаемые призы в магазине",
    icon: "🎁",
    details: [
      "✓ За каждое задание ребёнок получает очки",
      "✓ Может использовать их в магазине",
      "✓ Получает бейджи и достижения",
    ],
  },
  {
    title: "Геймификация",
    description: "Дополнительная мотивация через уровни, стикеры и таблицу лидеров",
    icon: "🏆",
    details: ["✓ Повышай уровень выполняя задания", "✓ Собирай стикеры по сериям", "✓ Соревнуйся в таблице лидеров"],
  },
  {
    title: "Ежедневные миссии",
    description: "Специальные задачи, которые дают дополнительные награды",
    icon: "⚡",
    details: ["✓ Выполняй дневные и недельные миссии", "✓ Получай бонусный опыт и очки", "✓ Разблокируй новые стикеры"],
  },
  {
    title: "Готово! Начинайте приключение!",
    description: "Теперь вы готовы использовать FamilyTask в полной мере",
    icon: "🚀",
    details: ["✓ Создавайте задачи и награды", "✓ Вовлекайте детей в процесс", "✓ Наслаждайтесь семейным временем"],
  },
]

export default function OnboardingTips({ onComplete }: OnboardingTipsProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

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
                Назад
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
                    Начать!
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Далее
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Шаг {currentSlide + 1} из {tips.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
