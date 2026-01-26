"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Users, Zap, Star, Shield, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingTier {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  limitations?: string[]
  icon: typeof Crown
  color: string
  gradient: string
  isBestValue?: boolean
  maxChildren: number
  maxTasks: number
}

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Бесплатный",
    price: 0,
    description: "Для начинающих семей",
    icon: Star,
    color: "text-slate-600",
    gradient: "from-slate-100 to-slate-200",
    maxChildren: 2,
    maxTasks: 10,
    features: [
      "До 2 детей",
      "До 10 задач в день",
      "Базовые награды",
      "Обычная поддержка",
      "Семейный чат",
    ],
    limitations: [
      "Без AI помощника",
      "Без продвинутой аналитики"
    ]
  },
  {
    id: "basic",
    name: "Базовый",
    price: 4.99,
    description: "Для активных семей",
    icon: Zap,
    color: "text-blue-600",
    gradient: "from-blue-100 to-cyan-200",
    maxChildren: 5,
    maxTasks: 50,
    features: [
      "До 5 детей",
      "До 50 задач в день",
      "AI помощник для задач",
      "Все базовые награды",
      "Персонализированные рекомендации",
      "Email поддержка",
    ]
  },
  {
    id: "premium",
    name: "Премиум",
    price: 9.99,
    description: "Максимум возможностей",
    icon: Crown,
    color: "text-purple-600",
    gradient: "from-purple-100 to-pink-200",
    maxChildren: 10,
    maxTasks: 100,
    isBestValue: true,
    features: [
      "До 10 детей",
      "До 100 задач в день",
      "Продвинутый AI помощник",
      "Детальная аналитика прогресса",
      "Кастомные награды и задачи",
      "Приоритетная поддержка 24/7",
      "Офлайн режим",
      "Эксклюзивные награды",
    ]
  },
  {
    id: "family",
    name: "Семейный",
    price: 14.99,
    description: "Для больших семей",
    icon: Users,
    color: "text-amber-600",
    gradient: "from-amber-100 to-orange-200",
    maxChildren: 999,
    maxTasks: 999,
    features: [
      "Неограниченно детей",
      "Неограниченно задач",
      "Все функции Premium",
      "Семейный доступ (до 10 родителей)",
      "Персональный менеджер",
      "Кастомная интеграция",
      "Расширенная аналитика для всей семьи",
      "Приоритетная разработка функций",
    ]
  }
]

interface PremiumPricingProps {
  currentTier?: string
  onSelectTier?: (tierId: string) => void
}

export default function PremiumPricing({ currentTier = "free", onSelectTier }: PremiumPricingProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pricingTiers.map((tier) => {
          const Icon = tier.icon
          const isCurrentTier = currentTier === tier.id
          const isFree = tier.price === 0

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                tier.isBestValue && "ring-2 ring-purple-500 shadow-lg scale-105",
                isCurrentTier && "border-green-500 border-2"
              )}
            >
              {tier.isBestValue && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-bl-lg rounded-tr-xl bg-gradient-to-r from-purple-600 to-pink-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Лучшее предложение
                  </Badge>
                </div>
              )}

              {isCurrentTier && (
                <div className="absolute top-0 left-0">
                  <Badge className="rounded-br-lg rounded-tl-xl bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Текущий
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br mb-3", tier.gradient)}>
                  <Icon className={cn("h-6 w-6", tier.color)} />
                </div>
                
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-xs">{tier.description}</CardDescription>
                
                <div className="pt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-sm text-muted-foreground">/мес</span>
                  </div>
                  {!isFree && (
                    <p className="text-xs text-muted-foreground mt-1">
                      или ${(tier.price * 12 * 0.85).toFixed(2)}/год (скидка 15%)
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Features */}
                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-xs leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  
                  {tier.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2 opacity-50">
                      <span className="text-xs line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="pt-3 border-t space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Детей</span>
                    <span className="font-semibold">
                      {tier.maxChildren === 999 ? "∞" : tier.maxChildren}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Задач в день</span>
                    <span className="font-semibold">
                      {tier.maxTasks === 999 ? "∞" : tier.maxTasks}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className={cn(
                    "w-full text-sm h-9",
                    tier.isBestValue && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  )}
                  variant={isCurrentTier ? "outline" : isFree ? "secondary" : "default"}
                  disabled={isCurrentTier}
                  onClick={() => onSelectTier?.(tier.id)}
                >
                  {isCurrentTier ? "Текущий тариф" : isFree ? "Начать бесплатно" : "Выбрать тариф"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Features Comparison */}
      <div className="pt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-600" />
              Зачем нужен Premium?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">Лучшие результаты</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI помощник создаёт персонализированные задачи, которые мотивируют детей развиваться быстрее
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-sm">Уникальные награды</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Создавайте кастомные награды специально для ваших детей и получайте доступ к эксклюзивным
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm">Полный контроль</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Продвинутая аналитика показывает детальный прогресс каждого ребёнка и помогает принимать решения
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
