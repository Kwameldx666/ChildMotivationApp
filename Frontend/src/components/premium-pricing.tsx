"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingTier {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  highlighted?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Бесплатный",
    price: 0,
    description: "Для начала",
    features: [
      "Базовые задачи и награды",
      "Семейный чат",
      "Статистика за неделю",
    ],
  },
  {
    id: "basic",
    name: "Базовый",
    price: 4.99,
    description: "Для активных семей",
    features: [
      "AI генерация задач",
      "Персональные рекомендации",
      "Расширенные награды",
      "Статистика за месяц",
    ],
  },
  {
    id: "premium",
    name: "Премиум",
    price: 9.99,
    description: "Максимум возможностей",
    highlighted: true,
    features: [
      "Продвинутый AI помощник",
      "Детальная аналитика прогресса",
      "Эксклюзивные награды",
      "Поддержка 24/7",
      "Офлайн режим",
    ],
  },
  {
    id: "family",
    name: "Семейный",
    price: 14.99,
    description: "Для больших семей",
    features: [
      "Все функции Premium",
      "Несколько родителей",
      "Персональный менеджер",
      "Без ограничений",
    ],
  }
]

interface PremiumPricingProps {
  currentTier?: string
  onSelectTier?: (tierId: string) => void
}

export default function PremiumPricing({ currentTier = "free", onSelectTier }: PremiumPricingProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {pricingTiers.map((tier) => {
        const isCurrentTier = currentTier === tier.id
        const isFree = tier.price === 0

        return (
          <div
            key={tier.id}
            className={cn(
              "relative rounded-2xl p-5 transition-all duration-200 flex flex-col",
              "bg-card/50 backdrop-blur border",
              tier.highlighted 
                ? "border-purple-500/50 bg-purple-500/5" 
                : "border-border/50 hover:border-border",
              isCurrentTier && "ring-2 ring-green-500/50"
            )}
          >
            {/* Highlighted Badge */}
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                  Популярный
                </span>
              </div>
            )}

            {/* Current Badge */}
            {isCurrentTier && !tier.highlighted && (
              <div className="absolute -top-3 left-4">
                <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Текущий
                </span>
              </div>
            )}

            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
              <p className="text-xs text-muted-foreground">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">${tier.price}</span>
                <span className="text-sm text-muted-foreground">/мес</span>
              </div>
              {!isFree && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  ${(tier.price * 12 * 0.85).toFixed(0)}/год (-15%)
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-5 flex-1">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <div className="rounded-full bg-green-500/10 p-0.5 mt-0.5">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-sm text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <Button
              className={cn(
                "w-full",
                tier.highlighted && !isCurrentTier && "bg-purple-500 hover:bg-purple-600"
              )}
              variant={isCurrentTier ? "outline" : isFree ? "secondary" : "default"}
              size="sm"
              disabled={isCurrentTier}
              onClick={() => onSelectTier?.(tier.id)}
            >
              {isCurrentTier ? "Текущий план" : isFree ? "Текущий" : "Выбрать"}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
