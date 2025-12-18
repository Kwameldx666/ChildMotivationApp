import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession } from '@/features/auth/store/authSlice'
import { appStore } from '@/store/appStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = appStore.getState().auth.session?.token
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

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      appStore.dispatch(clearSession())
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
