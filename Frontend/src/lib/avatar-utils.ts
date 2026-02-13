import { DEFAULT_API_BASE_URL } from '@/services/api/http-client'

/**
 * Resolves an avatar value from the API into a displayable URL or fallback.
 *
 * Avatar values from the backend can be:
 * - A full URL (http://... or https://...) → returned as-is
 * - A relative path like `/avatars/xxx.png` → rewritten to full gateway URL
 * - An emoji or short string → returned as-is (treated as fallback symbol, not an image)
 * - null/undefined/empty → returns null
 */
export function resolveAvatarUrl(avatar: string | null | undefined): string | null {
  const value = avatar?.trim()
  if (!value) return null

  // Already a full URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  // data: URI (e.g. from FileReader preview)
  if (value.startsWith('data:')) {
    return value
  }

  // Relative path from user-service static files → full gateway URL
  if (value.startsWith('/avatars/')) {
    const fileName = value.replace('/avatars/', '')
    const base = DEFAULT_API_BASE_URL.replace(/\/$/, '')
    return `${base}/api-gateway/profile/avatars/${fileName}`
  }

  // Anything else (emoji, initials, etc.) — return as-is
  return value
}

/**
 * Checks whether an avatar value is a displayable image URL (vs emoji/text fallback).
 */
export function isAvatarImage(avatar: string | null | undefined): boolean {
  const resolved = resolveAvatarUrl(avatar)
  if (!resolved) return false

  return (
    resolved.startsWith('http://') ||
    resolved.startsWith('https://') ||
    resolved.startsWith('data:')
  )
}
