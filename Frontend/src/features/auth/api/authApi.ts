import { apiClient, isAxiosError } from '@/api/api'
import { STORAGE_REFRESH_TOKEN_KEY, STORAGE_TOKEN_KEY } from '@/services/api/http-client'
import { appStore } from '@/store/appStore'
import type {
  AuthPayload,
  AuthSession,
  LoginPayload,
  OAuthProvider,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
  UserProfileResponse,
} from '@/features/auth/types'

const AUTH_BASE_PATH = '/api-gateway/auth'
const PROFILE_BASE_PATH = '/api-gateway/profile'

const persistTokens = (session: AuthSession) => {
  if (typeof window === 'undefined') return

  if (session.accessToken) {
    localStorage.setItem(STORAGE_TOKEN_KEY, session.accessToken)
  }

  if (session.refreshToken) {
    localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, session.refreshToken)
  }
}

const clearTokens = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_TOKEN_KEY)
  localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY)
}

const toSession = (payload: AuthPayload): AuthSession => {
  const profile: UserProfile = {
    name: payload.profile?.name ?? payload.user.name,
    lastName: payload.profile?.lastName ?? payload.user.lastName,
    avatar: payload.profile?.avatar ?? '',
    role: payload.profile?.role ?? 'parent',
    age: payload.profile?.age,
  }

  return {
    accessToken: payload.accessToken ?? null,
    refreshToken: payload.refreshToken ?? null,
    user: payload.user,
    profile,
    family: payload.family,
  }
}

const mergeSessionWithProfile = (
  response: UserProfileResponse,
  baseSession: AuthSession | null,
): AuthSession => {
  const profile: UserProfile = {
    name: response.profile?.name ?? response.user.name,
    lastName: response.profile?.lastName ?? response.user.lastName,
    avatar: response.profile?.avatar ?? '',
    role: response.profile?.role ?? (baseSession?.profile.role ?? 'parent'),
    age: response.profile?.age,
  }

  return {
    accessToken: baseSession?.accessToken ?? null,
    refreshToken: baseSession?.refreshToken ?? null,
    user: response.user,
    profile,
    family: response.family,
  }
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/login`, payload)
    const session = toSession(data)
    persistTokens(session)
    return session
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post(`${AUTH_BASE_PATH}/register`, payload)
  },

  async oauthSignIn(provider: OAuthProvider) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/oauth`, { provider })
    const session = toSession(data)
    persistTokens(session)
    return session
  },

  async me() {
    try {
      const { data } = await apiClient.get<AuthPayload>(`${AUTH_BASE_PATH}/me`)
      const currentSession = appStore.getState().auth.session
      const nextSession = toSession(data)

      const session = {
        ...nextSession,
        accessToken: nextSession.accessToken ?? currentSession?.accessToken ?? null,
        refreshToken: nextSession.refreshToken ?? currentSession?.refreshToken ?? null,
      }

      persistTokens(session)
      return session
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        return null
      }
      throw error
    }
  },

  async logout() {
    const state = appStore.getState()
    const refreshToken =
      state.auth.session?.refreshToken ??
      (typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY))

    if (refreshToken) {
      try {
        await apiClient.post(`${AUTH_BASE_PATH}/revoke`, { refreshToken })
      } catch (error) {
        console.warn('[authApi] Failed to revoke refresh token', error)
      }
    }

    try {
      await apiClient.post(`${AUTH_BASE_PATH}/logout`)
    } catch (error) {
      console.warn('[authApi] Failed to call logout endpoint', error)
    } finally {
      clearTokens()
    }
  },

  async getProfile(userId: string) {
    const { data } = await apiClient.get<UserProfileResponse>(`${PROFILE_BASE_PATH}/${userId}`)
    const state = appStore.getState()
    return mergeSessionWithProfile(data, state.auth.session)
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload) {
    const { data } = await apiClient.put<UserProfileResponse>(`${PROFILE_BASE_PATH}/${userId}`, payload)
    const state = appStore.getState()
    return mergeSessionWithProfile(data, state.auth.session)
  },
}
