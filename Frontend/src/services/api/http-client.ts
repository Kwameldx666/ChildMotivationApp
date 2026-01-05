const browserBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'
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

const AUTH_REFRESH_PATH = '/api-gateway/auth/refresh'
const isBrowser = typeof window !== 'undefined'

interface TokenPairResponse {
  accessToken: string
  refreshToken?: string | null
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly getToken?: () => string | null
  private refreshPromise: Promise<string | null> | null = null

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

    if (auth && this.getToken) {
      const token = this.getToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        // Dev-time hint: auth required but no token available
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
          console.warn('[http-client] Auth requested but no token available for request:', requestPath)
          console.warn(new Error().stack)
        }
      }
    }

    const requestInit: RequestInit = {
      ...rest,
      headers,
      body: preparedBody,
    }

    const url = this.resolveUrl(requestPath)
    let response = await fetch(url, requestInit)

    if (response.status === 401 && auth) {
      const retryResponse = await this.tryRefreshAndRetry(url, requestInit)
      if (retryResponse) {
        response = retryResponse
      }
    }

    const payload = await this.parsePayload(response, responseType)

    if (!response.ok) {
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

  private resolveRefreshToken() {
    const stateToken = appStore.getState().auth.session?.refreshToken
    if (stateToken) return stateToken
    return isBrowser ? localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY) : null
  }

  private persistTokens(accessToken: string, refreshToken?: string | null) {
    if (isBrowser) {
      localStorage.setItem(STORAGE_TOKEN_KEY, accessToken)
      if (refreshToken) {
        localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken)
      }
    }
  }

  private resetSessionState() {
    appStore.dispatch(clearSession())
    if (isBrowser) {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY)
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refreshToken = this.resolveRefreshToken()
        if (!refreshToken) return null

        try {
          const response = await fetch(this.resolveUrl(AUTH_REFRESH_PATH), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
          })

          if (!response.ok) return null

          const data = (await response.json()) as TokenPairResponse
          if (!data.accessToken) return null

          const currentSession = appStore.getState().auth.session
          if (currentSession) {
            const nextSession = {
              ...currentSession,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken ?? currentSession.refreshToken,
            }
            appStore.dispatch(setSession(nextSession))
            this.persistTokens(nextSession.accessToken ?? '', nextSession.refreshToken)
          } else {
            this.persistTokens(data.accessToken, data.refreshToken ?? refreshToken)
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

    const retryHeaders = new Headers(requestInit.headers as HeadersInit | undefined)
    retryHeaders.set('Authorization', `Bearer ${newAccessToken}`)

    return fetch(url, {
      ...requestInit,
      headers: retryHeaders,
    })
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
