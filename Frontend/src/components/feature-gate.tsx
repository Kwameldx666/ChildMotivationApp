"use client"

import type { ReactNode } from "react"
import { useSubscriptionGate, type SubscriptionFeature } from "@/hooks/use-subscription-gate"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { useTranslation } from "@/i18n/provider"
import { Loader2 } from "lucide-react"

interface FeatureGateProps {
  /** The feature required to access this content */
  feature: SubscriptionFeature
  /** Content to render when the feature is available */
  children: ReactNode
  /** Optional fallback content (default: UpgradePrompt) */
  fallback?: ReactNode
  /** If true, render children but with a locked overlay */
  blurred?: boolean
  /** Callback when user clicks upgrade in the prompt */
  onUpgrade?: () => void
  /** Additional classes for the wrapper */
  className?: string
}

/**
 * Wraps content that requires a specific subscription feature.
 * Shows UpgradePrompt if the user's subscription doesn't include the feature.
 *
 * Usage:
 *   <FeatureGate feature="aiAssistant">
 *     <AiChatWidget />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  blurred = false,
  onUpgrade,
  className,
}: FeatureGateProps) {
  const { hasFeature, requiredTier, isLoading } = useSubscriptionGate()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  const tier = requiredTier(feature)

  if (fallback) {
    return <>{fallback}</>
  }

  if (blurred) {
    return (
      <div className={className}>
        <div className="relative">
          <div className="pointer-events-none select-none blur-sm opacity-50">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <UpgradePrompt
              feature={t(`featureGate.featureNames.${feature}`)}
              requiredTier={tier}
              onUpgrade={onUpgrade}
              className="max-w-md"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <UpgradePrompt
      feature={t(`featureGate.featureNames.${feature}`)}
      requiredTier={tier}
      onUpgrade={onUpgrade}
      className={className}
    />
  )
}

/**
 * A lighter version that just hides content if the feature is not available.
 * No upgrade prompt — the content simply doesn't render.
 */
export function FeatureHide({
  feature,
  children,
}: {
  feature: SubscriptionFeature
  children: ReactNode
}) {
  const { hasFeature, isLoading } = useSubscriptionGate()

  if (isLoading || !hasFeature(feature)) {
    return null
  }

  return <>{children}</>
}
