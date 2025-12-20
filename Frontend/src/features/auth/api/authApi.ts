import { apiClient, isAxiosError } from '@/api/api'
import type {
  AuthPayload,
  AuthSession,
  LoginPayload,
  OAuthProvider,
  RegisterPayload,
  UserProfile,
} from '@/features/auth/types'

const AUTH_BASE_PATH = '/api-gateway/auth'

const toSession = (payload: AuthPayload): AuthSession => {
  const profile: UserProfile = {
    name: payload.profile?.name ?? payload.user.name,
    lastName: payload.profile?.lastName ?? payload.user.lastName,
    avatar: payload.profile?.avatar ?? '',
    role: payload.profile?.role ?? 'parent',
    age: payload.profile?.age,
  }

  return {
    token: payload.token ?? null,
    user: payload.user,
    profile,
    family: payload.family,
  }
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/login`, payload)
    return toSession(data)
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post(`${AUTH_BASE_PATH}/register`, payload)
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
