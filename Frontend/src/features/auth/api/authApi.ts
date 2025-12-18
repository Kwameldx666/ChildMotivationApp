import { apiClient, isAxiosError } from '@/api/api'
import type {
  AuthPayload,
  AuthSession,
  LoginPayload,
  OAuthProvider,
  RegisterPayload,
} from '@/features/auth/types'

const AUTH_BASE_PATH = '/api-gateway/auth'

const toSession = (payload: AuthPayload): AuthSession => ({
  token: payload.token ?? null,
  user: payload.user,
  profile: payload.profile,
  family: payload.family,
})

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/login`, payload)
    return toSession(data)
  },

  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/register`, payload)
    return toSession(data)
  },

  async oauthSignIn(provider: OAuthProvider) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/oauth`, { provider })
    return toSession(data)
  },

  async me() {
    try {
      const { data } = await apiClient.get<AuthPayload>(`${AUTH_BASE_PATH}/me`)
      return toSession(data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        return null
      }
      throw error
    }
  },

  async logout() {
    await apiClient.post(`${AUTH_BASE_PATH}/logout`)
  },
}
