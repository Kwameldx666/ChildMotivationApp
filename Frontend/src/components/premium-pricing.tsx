"use client"

import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubscriptionTiers } from "@/services/subscription-queries"
import { useTranslation } from "@/i18n/provider"

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
    description: "subscription.plans.free.tagline",
    features: [
      "subscription.plans.free.features.0",
      "subscription.plans.free.features.1",
      "subscription.plans.free.features.2",
      "subscription.plans.free.features.3",
    ],
  },
  basic: {
    description: "subscription.plans.basic.tagline",
    features: [
      "subscription.plans.basic.features.0",
      "subscription.plans.basic.features.1",
      "subscription.plans.basic.features.2",
      "subscription.plans.basic.features.3",
    ],
  },
  premium: {
    description: "subscription.plans.premium.tagline",
    highlighted: true,
    features: [
      "subscription.plans.premium.features.0",
      "subscription.plans.premium.features.1",
      "subscription.plans.premium.features.2",
      "subscription.plans.premium.features.3",
      "subscription.plans.premium.features.4",
      "subscription.plans.premium.features.5",
    ],
  },
  family: {
    description: "subscription.plans.family.tagline",
    features: [
      "subscription.plans.family.features.0",
      "subscription.plans.family.features.1",
      "subscription.plans.family.features.2",
      "subscription.plans.family.features.3",
      "subscription.plans.family.features.4",
    ],
  }
}

interface PremiumPricingProps {
  currentTier?: string
  onSelectTier?: (tierId: string) => void
}

export default function PremiumPricing({ currentTier = "free", onSelectTier }: PremiumPricingProps) {
  const { data: apiTiers, isLoading } = useSubscriptionTiers()
  const { t } = useTranslation()
  
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
    { id: "free", name: "Free", price: 0, description: "subscription.plans.free.tagline", features: tierExtras.free.features },
    { id: "basic", name: "Basic", price: 299, description: "subscription.plans.basic.tagline", features: tierExtras.basic.features },
    { id: "premium", name: "Premium", price: 599, description: "subscription.plans.premium.tagline", features: tierExtras.premium.features, highlighted: true },
    { id: "family", name: "Family", price: 999, description: "subscription.plans.family.tagline", features: tierExtras.family.features },
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
                  {t("subscription.mostPopular")}
                </span>
              </div>
            )}

            {/* Current Badge */}
            {isCurrentTier && !tier.highlighted && (
              <div className="absolute -top-3 left-4">
                <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {t("subscription.currentlyActive")}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">{t(`subscription.${tier.id}`)}</h3>
              <p className="text-xs text-muted-foreground">{t(tier.description)}</p>
            </div>

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{t(`subscription.plans.${tier.id}.price`)}</span>
                {tier.price > 0 && <span className="text-sm text-muted-foreground">{t("subscription.perMonth")}</span>}
              </div>
              {!isFree && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {t(`subscription.plans.${tier.id}.yearlyPrice`)} {t("subscription.perYear")} ({t(`subscription.plans.${tier.id}.yearlyDiscount`)})
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
                  <span className="text-sm text-foreground/80">{t(feature)}</span>
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
                ? t("subscription.currentPlan") 
                : isFree 
                  ? t("subscription.free") 
                  : t("subscription.selectPlan")}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
