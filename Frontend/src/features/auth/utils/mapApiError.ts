import { ApiErrorResponse, isAxiosError } from '@/api/api'
import { ApiError } from '@/services/api/http-client'

/**
 * Список технических ошибок, которые не нужно показывать пользователю
 */
const TECHNICAL_ERROR_KEYWORDS = [
  'The request contains invalid data',
  'Correct the request data',
  'BadRequest',
  'relation',
  'could not',
  'failed to',
  'unable to',
  'internal server error',
  'unexpected error',
  'exception',
  'stack trace',
  'at line',
  'in file',
  'connection timeout',
  'database',
]

/**
 * Проверяет, является ли сообщение об ошибке техническим
 */
function isTechnicalError(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return TECHNICAL_ERROR_KEYWORDS.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
}

function extractErrorMessages(source: unknown): string[] {
  if (!source) return []

  if (typeof source === 'string') {
    const trimmed = source.trim()
    return trimmed && !isTechnicalError(trimmed) ? [trimmed] : []
  }

  if (Array.isArray(source)) {
    return source.flatMap((item) => extractErrorMessages(item))
  }

  if (typeof source === 'object') {
    const record = source as Record<string, unknown>
    const collected: string[] = []

    if ('message' in record && typeof record.message === 'string' && !isTechnicalError(record.message)) {
      collected.push(...extractErrorMessages(record.message))
    }

    if ('errors' in record) {
      collected.push(...extractErrorMessages(record.errors))
    }

    // Ищем пользовательские сообщения об ошибках
    for (const [key, value] of Object.entries(record)) {
      if (key === 'message' || key === 'errors' || key === 'error' || key === 'detail' || key === 'details') continue
      
      // Пропускаем технические поля
      if (['statusCode', 'status', 'code', 'type', 'stack', 'trace'].includes(key.toLowerCase())) continue
      
      collected.push(...extractErrorMessages(value))
    }

    return collected
  }

  return []
}

function normalizeErrorMessages(messages: string[]): string | null {
  // Фильтруем технические ошибки
  const userFriendlyMessages = messages
    .map((message) => message.trim())
    .filter(msg => msg && !isTechnicalError(msg))
    .filter(Boolean)

  const normalized = Array.from(new Set(userFriendlyMessages))
  
  if (normalized.length === 0) return null
  
  // Показываем максимум 2 ошибки, чтобы не перегружать UI
  return normalized.slice(0, 2).join('\n')
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

  if (error instanceof Error) {
    // Фильтруем технические детали из Error messages
    const message = error.message
    if (message && !isTechnicalError(message)) {
      return message
    }
    return fallback
  }
  
  return fallback
}
