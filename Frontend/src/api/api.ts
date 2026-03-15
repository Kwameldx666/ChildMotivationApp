import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { DEFAULT_API_BASE_URL } from '@/services/api/http-client'
import { clearSession } from '@/features/auth/store/authSlice'
import { appStore } from '@/store/appStore'
import { createDemoAxiosAdapter, resolveDemoRequest } from '@/services/api/demo-mock'

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

let refreshPromise: Promise<string | null> | null = null

const resetSessionState = () => {
  appStore.dispatch(clearSession())
}

const refreshTokens = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data } = await refreshClient.post<TokenPairResponse>(`${AUTH_BASE_PATH}/refresh`)
        return data.accessToken ?? 'ok'
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

apiClient.interceptors.request.use((config) => {
  const mock = resolveDemoRequest({
    path: config.url ?? '',
    method: config.method,
    body: config.data,
  })

  if (!mock) return config

  return {
    ...config,
    adapter: createDemoAxiosAdapter(mock),
  }
})

export type ApiErrorResponse = {
  message?: string
  errors?: string[]
  [key: string]: unknown
}

export const isAxiosError = axios.isAxiosError
