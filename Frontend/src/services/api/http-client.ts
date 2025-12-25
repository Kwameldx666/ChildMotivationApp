const browserBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5147'
const serverBaseUrl = process.env.INTERNAL_API_URL ?? browserBaseUrl

export const DEFAULT_API_BASE_URL = typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl

export const STORAGE_TOKEN_KEY = 'familyapp_token'
export const STORAGE_REFRESH_TOKEN_KEY = 'familyapp_refresh_token'

export interface HttpClientConfig {
  baseUrl?: string
  getToken?: () => string | null
}

export interface RequestOptions extends RequestInit {
  auth?: boolean
}

export class ApiError<T = unknown> extends Error {
  public readonly status: number
  public readonly details?: T

  constructor(message: string, status: number, details?: T) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

import { appStore } from '@/store/appStore'

export class HttpClient {
  private readonly baseUrl: string
  private readonly getToken?: () => string | null

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_API_BASE_URL
    this.getToken = config.getToken
  }

  private resolveUrl(path: string) {
    if (path.startsWith('http')) return path
    const normalizedBase = this.baseUrl.replace(/\/$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${normalizedBase}${normalizedPath}`
  }

  private shouldAttachJsonBody(body: unknown) {
    if (!body) return false
    return !(body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer)
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, headers: incomingHeaders, body } = options
    const headers = new Headers(incomingHeaders)

    if (this.shouldAttachJsonBody(body)) {
      headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')
    }

    if (auth && this.getToken) {
      const token = this.getToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(this.resolveUrl(path), {
      ...options,
      headers,
    })

    const payload = await this.parsePayload(response)

    if (!response.ok) {
      throw new ApiError(response.statusText || 'API Error', response.status, payload)
    }

    return payload as T
  }

  private async parsePayload(response: Response) {
    if (response.status === 204) return undefined
    const contentType = response.headers.get('Content-Type') ?? ''

    if (contentType.includes('application/json')) {
      try {
        return await response.json()
      } catch (error) {
        console.error('[http-client] JSON parse error', error)
        return undefined
      }
    }

    return await response.text().catch(() => undefined)
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...(options ?? {}), method: 'GET' })
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: 'POST',
      body: this.shouldAttachJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
    })
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: 'PUT',
      body: this.shouldAttachJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
    })
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...(options ?? {}),
      method: 'PATCH',
      body: this.shouldAttachJsonBody(body) ? JSON.stringify(body) : (body as BodyInit | undefined),
    })
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...(options ?? {}), method: 'DELETE' })
  }
}

// Lazy import to avoid circular dependency at module evaluation time
const resolveAccessToken = () => {
  const stateToken = appStore.getState().auth.session?.accessToken ?? null
  if (stateToken) {
    return stateToken
  }

  return typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_TOKEN_KEY)
}

export const httpClient = new HttpClient({
  baseUrl: DEFAULT_API_BASE_URL,
  getToken: resolveAccessToken,
})
