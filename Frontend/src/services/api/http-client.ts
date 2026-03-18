const browserBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'
const serverBaseUrl = process.env.INTERNAL_API_URL ?? browserBaseUrl

export const DEFAULT_API_BASE_URL = typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl

export const STORAGE_TOKEN_KEY = 'familyapp_token'
export const STORAGE_REFRESH_TOKEN_KEY = 'familyapp_refresh_token'

export interface HttpClientConfig {
  baseUrl?: string
}

export interface RequestOptions extends RequestInit {
  auth?: boolean
  responseType?: 'json' | 'text' | 'blob'
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

import { clearSession, setSession } from '@/features/auth/store/authSlice'
import { appStore } from '@/store/appStore'
import { resolveDemoRequest } from '@/services/api/demo-mock'

const AUTH_REFRESH_PATH = '/api-gateway/auth/refresh'

interface TokenPairResponse {
  accessToken: string
  refreshToken?: string | null
}

export class HttpClient {
  private readonly baseUrl: string
  private refreshPromise: Promise<string | null> | null = null

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_API_BASE_URL
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

  private isChildSession() {
    const role = appStore.getState().auth.session?.profile?.role?.toLowerCase()
    return role === 'child'
  }

  private buildChildFallback(path: string, method?: string) {
    if (!this.isChildSession()) return undefined

    const normalizedMethod = (method ?? 'GET').toUpperCase()
    const pathname = path.split('?')[0]

    if (normalizedMethod === 'GET' && pathname === '/api-gateway/user-service/subscription/me') {
      return {
        tier: 'Free',
        status: 'Active',
        startDate: new Date().toISOString(),
        endDate: null,
        pricePerMonth: 0,
        autoRenew: false,
        maxChildren: 1,
        maxTasksPerDay: 20,
        hasAIAssistant: true,
        hasAdvancedAnalytics: false,
        hasCustomRewards: false,
        hasPrioritySupport: false,
        hasFamilySharing: false,
        hasOfflineMode: false,
        daysRemaining: null,
      }
    }

    if (normalizedMethod === 'GET' && /^\/api-gateway\/family-chat\/[^/]+$/.test(pathname)) {
      return []
    }

    if (normalizedMethod === 'POST' && /^\/api-gateway\/family-chat\/[^/]+\/messages$/.test(pathname)) {
      return {
        id: `mock-${Date.now()}`,
        familyId: pathname.split('/')[3] ?? 'mock-family',
        sentAt: new Date().toISOString(),
        isMock: true,
      }
    }

    if (normalizedMethod === 'GET' && (
      pathname === '/api-gateway/tasks'
      || pathname === '/api-gateway/missions'
      || pathname === '/api-gateway/achievements'
      || pathname === '/api-gateway/shop/products'
      || pathname === '/api-gateway/shop/orders'
      || pathname === '/api-gateway/notifications'
      || pathname === '/api-gateway/notifications/unread')) {
      return []
    }

    if (normalizedMethod === 'GET' && pathname === '/api-gateway/notifications/unread/count') {
      return { count: 0 }
    }

    if (normalizedMethod !== 'GET' && pathname.startsWith('/api-gateway/notifications/')) {
      return {}
    }

    return undefined
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, headers: incomingHeaders, body, responseType = 'json', ...rest } = options
    const headers = new Headers(incomingHeaders)

    // Guard & auto-fix: rewrite `/api/*` -> `/api-gateway/*` and warn (show stack in dev)
    let requestPath = path

    if (typeof requestPath === 'string' && requestPath.startsWith('/api/') && !requestPath.startsWith('/api-gateway/')) {
      console.warn('[http-client] Request uses /api/* path — rewriting to /api-gateway/* so requests go through the Gateway:', requestPath)
      if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        console.warn(new Error().stack)
      }
      requestPath = requestPath.replace(/^\/api\//, '/api-gateway/')
    }

    const preparedBody = body

    if (this.shouldAttachJsonBody(preparedBody)) {
      headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')
    }

    if (auth && process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      // Dev-time hint: auth requested but cookies may be missing
      console.debug('[http-client] Auth requested; relying on HTTP-only cookies for auth:', requestPath)
    }

    const requestInit: RequestInit = {
      ...rest,
      headers,
      body: preparedBody,
      credentials: rest.credentials ?? 'include',
    }

    const demoResponse = resolveDemoRequest({
      path: requestPath,
      method: requestInit.method,
      body: preparedBody,
      responseType,
    })

    if (demoResponse) {
      if (demoResponse.status >= 400) {
        throw new ApiError('Demo API Error', demoResponse.status, demoResponse.data)
      }
      return demoResponse.data as T
    }

    const url = this.resolveUrl(requestPath)
    let response: Response

    try {
      response = await fetch(url, requestInit)
    } catch (error) {
      const fallback = this.buildChildFallback(requestPath, requestInit.method)
      if (fallback !== undefined) {
        return fallback as T
      }

      throw error
    }

    if (response.status === 401 && auth) {
      const retryResponse = await this.tryRefreshAndRetry(url, requestInit)
      if (retryResponse) {
        response = retryResponse
      }
    }

    const payload = await this.parsePayload(response, responseType)

    if (!response.ok) {
      const fallback = this.buildChildFallback(requestPath, requestInit.method)
      if (fallback !== undefined) {
        return fallback as T
      }

      if (response.status === 401) {
        this.resetSessionState()
      }
      throw new ApiError(response.statusText || 'API Error', response.status, payload)
    }

    return payload as T
  }

  private async parsePayload(response: Response, responseType: NonNullable<RequestOptions['responseType']>) {
    if (response.status === 204) return undefined

    if (responseType === 'blob') {
      return await response.blob()
    }

    if (responseType === 'text') {
      return await response.text().catch(() => undefined)
    }

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

  private resetSessionState() {
    appStore.dispatch(clearSession())
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await fetch(this.resolveUrl(AUTH_REFRESH_PATH), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (!response.ok) return null

          const data = (await response.json()) as TokenPairResponse
          if (!data.accessToken) return null

          const currentSession = appStore.getState().auth.session
          if (currentSession) {
            const nextSession = {
              ...currentSession,
              accessToken: data.accessToken ?? currentSession.accessToken,
              refreshToken: data.refreshToken ?? currentSession.refreshToken,
            }
            appStore.dispatch(setSession(nextSession))
          }

          return data.accessToken
        } catch (error) {
          console.warn('[http-client] Failed to refresh token', error)
          return null
        } finally {
          this.refreshPromise = null
        }
      })()
    }

    return this.refreshPromise
  }

  private async tryRefreshAndRetry(url: string, requestInit: RequestInit) {
    const newAccessToken = await this.refreshAccessToken()
    if (!newAccessToken) {
      this.resetSessionState()
      return null
    }

    return fetch(url, {
      ...requestInit,
    })
  }
}

export const httpClient = new HttpClient({
  baseUrl: DEFAULT_API_BASE_URL,
})
