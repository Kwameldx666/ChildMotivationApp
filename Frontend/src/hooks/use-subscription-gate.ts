"use client"

import { useMemo } from "react"
import { useCurrentSubscription } from "@/services/subscription-queries"
import type { SubscriptionDto } from "@/services/subscription-service"

/**
 * Feature keys that map to subscription boolean flags.
 */
export type SubscriptionFeature =
  | "aiAssistant"
  | "advancedAnalytics"
  | "customRewards"
  | "prioritySupport"
  | "familySharing"
  | "offlineMode"

/**
 * Limit keys that map to subscription numeric limits.
 */
export type SubscriptionLimit = "maxChildren" | "maxTasksPerDay"

/**
 * Minimum tier required for each feature.
 */
export const FEATURE_REQUIRED_TIER: Record<SubscriptionFeature, string> = {
  aiAssistant: "basic",
  advancedAnalytics: "premium",
  customRewards: "premium",
  prioritySupport: "premium",
  familySharing: "family",
  offlineMode: "premium",
}

const TIER_ORDER: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  family: 3,
}

const normalizeTierName = (tier: string | undefined | null) => {
  const normalized = (tier ?? "free").toLowerCase().trim()
  if (normalized === "trial") return "basic"
  return normalized
}

/**
 * Get the required tier label for a feature (for upgrade prompts).
 */
export function getRequiredTierForFeature(feature: SubscriptionFeature): string {
  return FEATURE_REQUIRED_TIER[feature]
}

/**
 * Map boolean feature key to the SubscriptionDto property name.
 */
function hasFeatureAccess(sub: SubscriptionDto | undefined | null, feature: SubscriptionFeature): boolean {
  if (!sub) return feature === "aiAssistant" ? false : false // free defaults

  const featureMap: Record<SubscriptionFeature, boolean> = {
    aiAssistant: sub.hasAIAssistant,
    advancedAnalytics: sub.hasAdvancedAnalytics,
    customRewards: sub.hasCustomRewards,
    prioritySupport: sub.hasPrioritySupport,
    familySharing: sub.hasFamilySharing,
    offlineMode: sub.hasOfflineMode,
  }

  return featureMap[feature]
}

/**
 * Get numeric limit from subscription.
 */
function getLimitValue(sub: SubscriptionDto | undefined | null, limit: SubscriptionLimit): number {
  if (!sub) {
    // Free defaults
    return limit === "maxChildren" ? 2 : 10
  }

  const limitMap: Record<SubscriptionLimit, number> = {
    maxChildren: sub.maxChildren,
    maxTasksPerDay: sub.maxTasksPerDay,
  }

  return limitMap[limit]
}

export interface SubscriptionGateResult {
  /** Current subscription data (may be undefined while loading) */
  subscription: SubscriptionDto | undefined
  /** Whether subscription data is still loading */
  isLoading: boolean
  /** Current tier name */
  currentTier: string
  /** Check if a boolean feature is available */
  hasFeature: (feature: SubscriptionFeature) => boolean
  /** Check if a numeric limit has been reached */
  isWithinLimit: (limit: SubscriptionLimit, currentCount: number) => boolean
  /** Get the max value for a numeric limit */
  getLimit: (limit: SubscriptionLimit) => number
  /** Get the required tier name for upgrading to access a feature */
  requiredTier: (feature: SubscriptionFeature) => string
  /** Check if current tier is at least the given tier */
  isAtLeastTier: (tier: string) => boolean
}

/**
 * Central hook for subscription-based feature gating.
 *
 * Usage:
 *   const { hasFeature, isWithinLimit, currentTier } = useSubscriptionGate()
 *   if (!hasFeature('aiAssistant')) { show upgrade prompt }
 *   if (!isWithinLimit('maxChildren', children.length)) { show limit warning }
 */
export function useSubscriptionGate(): SubscriptionGateResult {
  const { data: subscription, isLoading } = useCurrentSubscription()

  return useMemo(() => {
    const currentTier = normalizeTierName(subscription?.tier)

    return {
      subscription,
      isLoading,
      currentTier,

      hasFeature: (feature: SubscriptionFeature) => hasFeatureAccess(subscription, feature),

      isWithinLimit: (limit: SubscriptionLimit, currentCount: number) => {
        const max = getLimitValue(subscription, limit)
        // 0 or >= 1 billion (INT_MAX = 2147483647) = unlimited
        if (max === 0 || max >= 1_000_000_000) return true
        return currentCount < max
      },

      getLimit: (limit: SubscriptionLimit) => getLimitValue(subscription, limit),

      requiredTier: (feature: SubscriptionFeature) => getRequiredTierForFeature(feature),

      isAtLeastTier: (tier: string) => {
        const currentOrder = TIER_ORDER[currentTier] ?? 0
        const requiredOrder = TIER_ORDER[normalizeTierName(tier)] ?? 0
        return currentOrder >= requiredOrder
      },
    }
  }, [subscription, isLoading])
}
