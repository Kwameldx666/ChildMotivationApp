"use client"

import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubscriptionTiers } from "@/services/subscription-queries"

interface PricingTier {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  highlighted?: boolean
}

// Дополнительные данные для тарифов (features и descriptions)
const tierExtras: Record<string, { description: string; features: string[]; highlighted?: boolean }> = {
  free: {
    description: "Для начала",
    features: [
      "До 2 детей",
      "До 10 задач в день",
      "Семейный чат",
      "Базовые награды",
    ],
  },
  basic: {
    description: "Для активных семей",
    features: [
      "До 5 детей",
      "До 30 задач в день",
      "AI генерация задач",
      "Расширенные награды",
    ],
  },
  premium: {
    description: "Максимум возможностей",
    highlighted: true,
    features: [
      "До 10 детей",
      "До 100 задач в день",
      "Продвинутый AI помощник",
      "Детальная аналитика",
      "Приоритетная поддержка",
      "Офлайн режим",
    ],
  },
  family: {
    description: "Для больших семей",
    features: [
      "Без ограничений детей",
      "Без ограничений задач",
      "Все функции Premium",
      "Семейный доступ",
      "Персональный менеджер",
    ],
  }
}

interface PremiumPricingProps {
  currentTier?: string
  onSelectTier?: (tierId: string) => void
}

export default function PremiumPricing({ currentTier = "free", onSelectTier }: PremiumPricingProps) {
  const { data: apiTiers, isLoading } = useSubscriptionTiers()
  
  // Формируем тарифы на основе данных API
  const pricingTiers: PricingTier[] = apiTiers?.map(tier => {
    const tierId = tier.name.toLowerCase()
    const extras = tierExtras[tierId] || { description: "", features: [] }
    return {
      id: tierId,
      name: tier.displayName,
      price: tier.price,
      description: extras.description,
      features: extras.features,
      highlighted: extras.highlighted
    }
  }) || [
    // Fallback тарифы если API недоступен
    { id: "free", name: "Бесплатный", price: 0, description: "Для начала", features: tierExtras.free.features },
    { id: "basic", name: "Базовый", price: 299, description: "Для активных семей", features: tierExtras.basic.features },
    { id: "premium", name: "Премиум", price: 599, description: "Максимум возможностей", features: tierExtras.premium.features, highlighted: true },
    { id: "family", name: "Семейный", price: 999, description: "Для больших семей", features: tierExtras.family.features },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {pricingTiers.map((tier) => {
        const isCurrentTier = currentTier.toLowerCase() === tier.id
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
                <span className="text-3xl font-bold text-foreground">{tier.price === 0 ? "Бесплатно" : `${tier.price} ₽`}</span>
                {tier.price > 0 && <span className="text-sm text-muted-foreground">/мес</span>}
              </div>
              {!isFree && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {Math.floor(tier.price * 12 * 0.85)} ₽/год (-15%)
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
              {isCurrentTier 
                ? "Текущий план" 
                : isFree 
                  ? "Перейти на бесплатный" 
                  : "Выбрать"}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
