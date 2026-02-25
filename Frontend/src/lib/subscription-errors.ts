import { ApiError } from '@/services/api/http-client'

/**
 * Subscription-required error details returned by the Gateway.
 */
export interface SubscriptionRequiredError {
  type: 'subscription_required'
  title: string
  detail: string
  feature: string
  currentTier: string
  status: 403
}

/**
 * Check if an error is a subscription-required error from the Gateway.
 */
export function isSubscriptionError(error: unknown): error is ApiError<SubscriptionRequiredError> {
  if (!(error instanceof ApiError)) return false
  if (error.status !== 403) return false

  const details = error.details as Record<string, unknown> | undefined
  return details?.type === 'subscription_required'
}

/**
 * Extract subscription error details for showing upgrade prompts.
 */
export function getSubscriptionErrorDetails(error: unknown): SubscriptionRequiredError | null {
  if (!isSubscriptionError(error)) return null
  return error.details as SubscriptionRequiredError
}
