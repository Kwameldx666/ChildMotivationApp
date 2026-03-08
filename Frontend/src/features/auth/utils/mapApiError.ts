import { ApiErrorResponse, isAxiosError } from '@/api/api'
import { ApiError } from '@/services/api/http-client'

/**
 * Список технических ошибок, которые не нужно показывать пользователю
 */
const TECHNICAL_ERROR_KEYWORDS = [
  'internal server error',
  'unexpected error',
  'exception',
  'stack trace',
  'at line',
  'in file',
  'connection timeout',
  'database',
  'relation "',
  'violation',
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

    // Извлекаем из известных полей с сообщениями
    for (const field of ['message', 'description', 'detail', 'details', 'errorDescription'] as const) {
      if (field in record && typeof record[field] === 'string' && !isTechnicalError(record[field] as string)) {
        collected.push(...extractErrorMessages(record[field]))
      }
    }

    if ('errors' in record) {
      collected.push(...extractErrorMessages(record.errors))
    }

    // Ищем пользовательские сообщения об ошибках
    const SKIP_KEYS = new Set(['message', 'description', 'errors', 'error', 'detail', 'details', 'errordescription',
      'statuscode', 'status', 'code', 'type', 'stack', 'trace', 'errortype', 'recoverable', 'impact', 'resolution'])
    for (const [key, value] of Object.entries(record)) {
      if (SKIP_KEYS.has(key.toLowerCase())) continue
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
    // Фильтруем технические детали и дефолтные сообщения Axios
    const message = error.message
    if (message && !isTechnicalError(message) && !/^Request failed with status code \d+$/.test(message)) {
      return message
    }
    return fallback
  }
  
  return fallback
}
