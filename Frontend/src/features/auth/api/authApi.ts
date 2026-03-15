import { apiClient, isAxiosError } from '@/api/api'
import { appStore } from '@/store/appStore'
import type {
  AuthPayload,
  AuthSession,
  ChangeEmailPayload,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
  UserProfileResponse,
  GoogleAuthorizationResponse,
  GooglePendingUser,
  CompleteGoogleSignInPayload,
} from '@/features/auth/types'

const AUTH_BASE_PATH = '/api-gateway/auth'
const PROFILE_BASE_PATH = '/api-gateway/profile'

const asText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : fallback
}

const normalizeRole = (...candidates: unknown[]): UserProfile['role'] => {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    const normalized = candidate.trim().toLowerCase()
    if (normalized === 'parent') return 'parent'
    if (normalized === 'child') return 'child'
  }

  return 'parent'
}

const toSession = (payload: AuthPayload): AuthSession => {
  const rawPayload = payload as Partial<AuthPayload> | null | undefined
  const rawUser = rawPayload?.user as Partial<AuthPayload['user']> | undefined
  const rawProfile = rawPayload?.profile as Partial<AuthPayload['profile']> | undefined
  const fallbackUserId = asText((rawPayload as { userId?: unknown } | undefined)?.userId, 'unknown')

  const user = {
    id: asText(rawUser?.id, fallbackUserId),
    email: asText(rawUser?.email),
    name: asText(rawUser?.name),
    lastName: asText(rawUser?.lastName),
  }

  const profile: UserProfile = {
    name: asText(rawProfile?.name, user.name),
    lastName: asText(rawProfile?.lastName, user.lastName),
    avatar: asText(rawProfile?.avatar),
    role: normalizeRole(
      rawProfile?.role,
      (rawUser as { role?: unknown } | undefined)?.role,
      (rawPayload as { role?: unknown } | undefined)?.role,
    ),
    age: typeof rawProfile?.age === 'number' ? rawProfile.age : undefined,
  }

  return {
    accessToken: null,
    refreshToken: null,
    user,
    profile,
    family: rawPayload?.family,
    mustChangePassword: Boolean(rawPayload?.mustChangePassword),
  }
}

const mergeSessionWithProfile = (
  response: UserProfileResponse,
  baseSession: AuthSession | null,
): AuthSession => {
  const rawResponse = response as Partial<UserProfileResponse> | null | undefined
  const rawUser = rawResponse?.user as Partial<UserProfileResponse['user']> | undefined
  const rawProfile = rawResponse?.profile as Partial<UserProfileResponse['profile']> | undefined

  const user = {
    id: asText(rawUser?.id, baseSession?.user.id ?? 'unknown'),
    email: asText(rawUser?.email, baseSession?.user.email ?? ''),
    name: asText(rawUser?.name, baseSession?.user.name ?? ''),
    lastName: asText(rawUser?.lastName, baseSession?.user.lastName ?? ''),
  }

  const profile: UserProfile = {
    name: asText(rawProfile?.name, user.name),
    lastName: asText(rawProfile?.lastName, user.lastName),
    avatar: asText(rawProfile?.avatar, baseSession?.profile.avatar ?? ''),
    role: normalizeRole(rawProfile?.role, baseSession?.profile.role),
    age: typeof rawProfile?.age === 'number' ? rawProfile.age : baseSession?.profile.age,
  }

  return {
    accessToken: null,
    refreshToken: null,
    user,
    profile,
    family: rawResponse?.family ?? baseSession?.family,
    mustChangePassword: baseSession?.mustChangePassword ?? false,
  }
}

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/login`, payload)
    const session = toSession(data)
    return session
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post(`${AUTH_BASE_PATH}/register`, payload)
  },

  async getOAuthAuthorization(provider: 'google' | 'github' | 'microsoft' | 'discord'): Promise<GoogleAuthorizationResponse> {
    if (provider === 'discord') {
      // Gateway expects POST for Discord authorization route
      const { data } = await apiClient.post<GoogleAuthorizationResponse>(`${AUTH_BASE_PATH}/discord/authorize`, {})
      return data
    }

    const { data } = await apiClient.get<GoogleAuthorizationResponse>(`${AUTH_BASE_PATH}/${provider}/authorize`)
    return data
  },

  async getGoogleAuthorization() {
    return this.getOAuthAuthorization('google')
  },

  async fetchGoogleSession(token: string) {
    return this.fetchProviderSession('google', token)
  },

  async fetchGooglePendingUser(token: string) {
    return this.fetchProviderPendingUser('google', token)
  },

  async completeGoogleSignIn(payload: CompleteGoogleSignInPayload) {
    return this.completeProviderSignIn('google', payload)
  },

  // Generic provider helpers
  async fetchProviderSession(provider: string, token: string) {
    const { data } = await apiClient.get<AuthPayload>(`${AUTH_BASE_PATH}/${provider}/session/${token}`)
    const session = toSession(data)
    return session
  },

  async fetchProviderPendingUser(provider: string, token: string) {
    const { data } = await apiClient.get<GooglePendingUser>(`${AUTH_BASE_PATH}/${provider}/pending/${token}`)
    return data
  },

  async completeProviderSignIn(provider: string, payload: CompleteGoogleSignInPayload) {
    const { data } = await apiClient.post<AuthPayload>(`${AUTH_BASE_PATH}/${provider}/complete`, payload)
    const session = toSession(data)
    return session
  },

  async me() {
    try {
      const { data } = await apiClient.get<AuthPayload>(`${AUTH_BASE_PATH}/me`)
      const nextSession = toSession(data)

      const session = {
        ...nextSession,
        accessToken: null,
        refreshToken: null,
      }
      return session
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        return null
      }
      throw error
    }
  },

  async logout() {
    try {
      await apiClient.post(`${AUTH_BASE_PATH}/logout`)
    } catch (error) {
      console.warn('[authApi] Failed to call logout endpoint', error)
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

  async deleteAccount() {
    await apiClient.delete(`${AUTH_BASE_PATH}/account`)
  },

  async changePassword(payload: ChangePasswordPayload) {
    await apiClient.post(`${AUTH_BASE_PATH}/change-password`, payload)
  },

  async changeEmail(payload: ChangeEmailPayload) {
    await apiClient.post(`${AUTH_BASE_PATH}/change-email`, payload)
  },

  async confirmEmail(userId: string, token: string) {
    await apiClient.post(`${AUTH_BASE_PATH}/confirm-email`, { userId, token })
  },

  async resendConfirmation(email: string) {
    await apiClient.post(`${AUTH_BASE_PATH}/resend-confirmation`, { email })
  },

  async registerChild(payload: { childName: string; childLastName?: string | null; childAge: number; childAvatar?: string | null }) {
    const { data } = await apiClient.post<{ childEmail: string; childPassword: string; childName: string; childLastName: string }>(`${AUTH_BASE_PATH}/register-child`, payload)
    return data
  },

  async resetChildPassword(childId: string) {
    const { data } = await apiClient.post<{ newPassword: string }>(`${AUTH_BASE_PATH}/reset-child-password`, { childId })
    return data
  },

  async completeChildSetup(payload: { newPassword: string }) {
    await apiClient.post(`${AUTH_BASE_PATH}/complete-child-setup`, payload)
  },

  async forgotPassword(email: string) {
    await apiClient.post(`${AUTH_BASE_PATH}/forgot-password`, { email })
  },

  async resetPassword(userId: string, token: string, newPassword: string) {
    await apiClient.post(`${AUTH_BASE_PATH}/reset-password`, { userId, token, newPassword })
  },
}
