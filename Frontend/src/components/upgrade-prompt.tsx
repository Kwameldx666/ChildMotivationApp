"use client"

import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"

interface UpgradePromptProps {
  /** The feature that requires upgrade */
  feature: string
  /** The minimum tier required */
  requiredTier: string
  /** Optional callback when user clicks upgrade */
  onUpgrade?: () => void
  /** Compact mode — smaller card without detailed description */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * A beautiful card shown when the user tries to access a feature
 * that requires a higher subscription tier.
 */
export function UpgradePrompt({
  feature,
  requiredTier,
  onUpgrade,
  compact = false,
  className,
}: UpgradePromptProps) {
  const { t } = useTranslation()

  const tierColors: Record<string, string> = {
    basic: "from-blue-500 to-indigo-600",
    premium: "from-amber-500 to-orange-600",
    family: "from-purple-500 to-pink-600",
  }

  const tierIcons: Record<string, typeof Crown> = {
    basic: Sparkles,
    premium: Crown,
    family: Crown,
  }

  const gradient = tierColors[requiredTier] ?? tierColors.premium
  const TierIcon = tierIcons[requiredTier] ?? Crown

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30",
          className
        )}
      >
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r text-white", gradient)}>
          <Lock className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {t("featureGate.requiresPlan", { plan: t(`subscription.${requiredTier}`) })}
          </p>
        </div>
        {onUpgrade && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUpgrade}
            className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
          >
            {t("featureGate.upgrade")}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden border-0 shadow-lg", className)}>
      <div className={cn("bg-gradient-to-r p-6 text-white", gradient)}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <TierIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{t("featureGate.lockedTitle")}</h3>
            <p className="text-sm text-white/80">
              {t("featureGate.requiresPlan", { plan: t(`subscription.${requiredTier}`) })}
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {t("featureGate.description", { feature })}
        </p>
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("featureGate.whatYouGet")}
          </p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {t(`featureGate.benefits.${requiredTier}1`)}
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {t(`featureGate.benefits.${requiredTier}2`)}
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {t(`featureGate.benefits.${requiredTier}3`)}
            </li>
          </ul>
        </div>
        {onUpgrade && (
          <Button
            onClick={onUpgrade}
            className={cn("w-full bg-gradient-to-r text-white hover:opacity-90", gradient)}
          >
            {t("featureGate.upgradeTo", { plan: t(`subscription.${requiredTier}`) })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
