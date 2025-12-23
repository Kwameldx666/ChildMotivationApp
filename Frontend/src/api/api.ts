import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { DEFAULT_API_BASE_URL, STORAGE_REFRESH_TOKEN_KEY, STORAGE_TOKEN_KEY } from '@/services/api/http-client'
import { clearSession, setSession } from '@/features/auth/store/authSlice'
import { appStore } from '@/store/appStore'

const API_BASE_URL = DEFAULT_API_BASE_URL
const AUTH_BASE_PATH = '/api-gateway/auth'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

interface TokenPairResponse {
  accessToken: string
  refreshToken?: string | null
  tokenType?: string | null
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = appStore.getState().auth.session?.accessToken
  if (!token) {
    return config
  }

  config.headers = config.headers ?? {}
  const maybeHeaders = config.headers as InternalAxiosRequestConfig['headers'] & {
    set?: (key: string, value: string) => void
  }

  if (typeof maybeHeaders.set === 'function') {
    maybeHeaders.set('Authorization', `Bearer ${token}`)
  } else {
    ;(maybeHeaders as Record<string, unknown>).Authorization = `Bearer ${token}`
  }

  return config
}

apiClient.interceptors.request.use(attachAuthHeader)

let refreshPromise: Promise<string | null> | null = null

const resetSessionState = () => {
  appStore.dispatch(clearSession())
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY)
  }
}

const refreshTokens = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const state = appStore.getState()
      const currentSession = state.auth.session
      const refreshToken = currentSession?.refreshToken
      if (!refreshToken) {
        return null
      }

      try {
        const { data } = await refreshClient.post<TokenPairResponse>(`${AUTH_BASE_PATH}/refresh`, {
          refreshToken,
        })

        const nextSession = currentSession
          ? {
              ...currentSession,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken ?? currentSession.refreshToken,
            }
          : null

        if (nextSession) {
          appStore.dispatch(setSession(nextSession))

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_TOKEN_KEY, nextSession.accessToken ?? '')
            if (nextSession.refreshToken) {
              localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, nextSession.refreshToken)
            }
          }

          return nextSession.accessToken
        }

        return null
      } catch (error) {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const statusCode = error?.response?.status
    const requestConfig = error.config as RetriableRequestConfig | undefined

    if (statusCode === 401 && requestConfig && !requestConfig._retry) {
      requestConfig._retry = true

      try {
        const newAccessToken = await refreshTokens()
        if (!newAccessToken) {
          resetSessionState()
          return Promise.reject(error)
        }

        requestConfig.headers = requestConfig.headers ?? {}
        const maybeHeaders = requestConfig.headers as RetriableRequestConfig['headers'] & {
          set?: (key: string, value: string) => void
        }

        if (typeof maybeHeaders.set === 'function') {
          maybeHeaders.set('Authorization', `Bearer ${newAccessToken}`)
        } else {
          ;(maybeHeaders as Record<string, unknown>).Authorization = `Bearer ${newAccessToken}`
        }

        return apiClient(requestConfig)
      } catch (refreshError) {
        resetSessionState()
        return Promise.reject(refreshError)
      }
    }

    if (statusCode === 401) {
      resetSessionState()
    }

    return Promise.reject(error)
  },
)

export type ApiErrorResponse = {
  message?: string
  errors?: string[]
  [key: string]: unknown
}

export const isAxiosError = axios.isAxiosError
