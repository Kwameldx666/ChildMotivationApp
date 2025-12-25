import { ApiErrorResponse, isAxiosError } from '@/api/api'
import { ApiError } from '@/services/api/http-client'

function extractErrorMessages(source: unknown): string[] {
  if (!source) return []

  if (typeof source === 'string') {
    const trimmed = source.trim()
    return trimmed ? [trimmed] : []
  }

  if (Array.isArray(source)) {
    return source.flatMap((item) => extractErrorMessages(item))
  }

  if (typeof source === 'object') {
    const record = source as Record<string, unknown>
    const collected: string[] = []

    if ('message' in record) {
      collected.push(...extractErrorMessages(record.message))
    }

    if ('errors' in record) {
      collected.push(...extractErrorMessages(record.errors))
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === 'message' || key === 'errors') continue
      collected.push(...extractErrorMessages(value))
    }

    return collected
  }

  return []
}

function normalizeErrorMessages(messages: string[]): string | null {
  const normalized = Array.from(new Set(messages.map((message) => message.trim()).filter(Boolean)))
  if (normalized.length === 0) return null
  return normalized.join('\n')
}

export function mapApiError(error: unknown, fallback: string) {
  const mapPayload = (payload: unknown, status?: number) => {
    if (status && status >= 500) {
      return null
    }

    const messages = extractErrorMessages(payload)
    return normalizeErrorMessages(messages)
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status
    const mapped = mapPayload(error.response?.data, status)
    if (mapped) return mapped
    if (status && status >= 500) return fallback
  }

  if (error instanceof ApiError) {
    const mapped = mapPayload(error.details, error.status)
    if (mapped) return mapped
    if (error.status >= 500) return fallback
  }

  if (error instanceof Error) return error.message
  return fallback
}
