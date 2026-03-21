"use client"

import { useState } from "react"
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

const TIER_ORDER: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  family: 3,
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
      "subscription.plans.basic.features.4",
      "subscription.plans.basic.features.5",
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
      "subscription.plans.premium.features.6",
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
      "subscription.plans.family.features.5",
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  
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
    { id: "basic", name: "Basic", price: 49, description: "subscription.plans.basic.tagline", features: tierExtras.basic.features },
    { id: "premium", name: "Premium", price: 99, description: "subscription.plans.premium.tagline", features: tierExtras.premium.features, highlighted: true },
    { id: "family", name: "Family", price: 149, description: "subscription.plans.family.tagline", features: tierExtras.family.features },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border bg-muted/50 p-1 gap-1 max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              billingCycle === "monthly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("paymentModal.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              billingCycle === "yearly"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("paymentModal.yearly")}
            <span className="ml-1.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-relaxed inline-block">
              -20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 pt-2">
      {pricingTiers.map((tier) => {
        const isCurrentTier = currentTier.toLowerCase() === tier.id
        const isFree = tier.price === 0
        const isLowerTier = (TIER_ORDER[tier.id] ?? 0) < (TIER_ORDER[currentTier.toLowerCase()] ?? 0)
        const isDisabled = isCurrentTier || isLowerTier
        const showTrial = currentTier.toLowerCase() === "free" && tier.id === "basic"

        return (
          <div
            key={tier.id}
            className={cn(
              "relative rounded-xl p-4 sm:p-5 transition-all duration-200 flex flex-col",
              "bg-card border shadow-sm",
              tier.highlighted 
                ? "border-purple-500/50 bg-purple-500/5" 
                : "border-border/50 hover:border-border",
              isCurrentTier && "ring-2 ring-green-500/50",
              isLowerTier && "opacity-70"
            )}
          >
            {/* Badges */}
            {tier.highlighted && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-purple-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                  {t("subscription.mostPopular")}
                </span>
              </div>
            )}
            {isCurrentTier && !tier.highlighted && (
              <div className="absolute -top-2.5 left-3">
                <span className="bg-green-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {t("subscription.currentlyActive")}
                </span>
              </div>
            )}
            {showTrial && !tier.highlighted && (
              <div className="absolute -top-2.5 right-3">
                <span className="bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full animate-pulse">
                  {t("subscription.trial.badge")}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="mb-3 pt-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">{t(`subscription.${tier.id}`)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug truncate">{t(tier.description)}</p>
            </div>

            {/* Price */}
            <div className="mb-3">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-lg sm:text-xl font-bold text-foreground">
                  {billingCycle === "yearly" && tier.price > 0
                    ? t(`subscription.plans.${tier.id}.yearlyMonthlyPrice`)
                    : isFree
                      ? t(`subscription.plans.${tier.id}.price`)
                      : t(`subscription.plans.${tier.id}.priceAmount`)}
                </span>
                {tier.price > 0 && <span className="text-[11px] sm:text-xs text-muted-foreground">{t("subscription.perMonth")}</span>}
              </div>
              {!isFree && billingCycle === "yearly" && (
                <p className="text-xs text-muted-foreground/70">
                  {t(`subscription.plans.${tier.id}.yearlyPrice`)} {t("subscription.currency")} {t("subscription.perYear")}
                </p>
              )}
              {!isFree && billingCycle === "monthly" && (
                <p className="text-xs text-green-600">
                  {t("subscription.switchToYearlySave")}
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-3 flex-1">
              {tier.features.map((feature, index) => (
                <li key={index} className={cn("flex items-start gap-2", index > 2 && "hidden sm:flex")}>
                  <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground leading-snug">{t(feature)}</span>
                </li>
              ))}
            </ul>

            {tier.features.length > 3 && (
              <p className="text-[11px] text-muted-foreground sm:hidden mb-2">
                +{tier.features.length - 3}
              </p>
            )}

            {/* Trial note */}
            {showTrial && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 text-center font-medium">
                {t("subscription.trial.trialDescription")}
              </p>
            )}

            {/* Button */}
            <Button
              className={cn(
                "w-full h-9 text-sm",
                tier.highlighted && !isDisabled && "bg-purple-500 hover:bg-purple-600",
                showTrial && "bg-amber-500 hover:bg-amber-600"
              )}
              variant={isCurrentTier ? "outline" : isLowerTier ? "ghost" : isFree ? "secondary" : "default"}
              size="sm"
              disabled={isDisabled}
              onClick={() => onSelectTier?.(tier.id)}
            >
              {isCurrentTier 
                ? t("subscription.currentPlan") 
                : isLowerTier
                  ? t("subscription.downgradeBlocked")
                  : showTrial
                    ? t("subscription.trial.startTrial")
                    : isFree 
                      ? t("subscription.free") 
                      : t("subscription.selectPlan")}
            </Button>
          </div>
        )
      })}
    </div>
    </div>
  )
}
