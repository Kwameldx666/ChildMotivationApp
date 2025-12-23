import {
  ApiError,
  httpClient,
  STORAGE_REFRESH_TOKEN_KEY,
  STORAGE_TOKEN_KEY,
} from '@/services/api/http-client'
import type { AuthPayload, AuthSession, AuthUser, FamilyContext, UserProfile, UserRole } from '@/features/auth/types'

// cspell:ignore familyapp удалось сохранить сессию после

const CURRENT_USER_KEY = 'familyapp_current_user'
const PROFILE_KEY_PREFIX = 'familyapp_profile_'
const FAMILY_KEY_PREFIX = 'familyapp_family_'

const isBrowser = typeof window !== 'undefined'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  role: UserRole
  profile: Omit<UserProfile, 'role'> & { role?: UserRole }
  family?: FamilyContext & { name?: string; emblem?: string }
}

function getAccessToken() {
  if (!isBrowser) return null
  return localStorage.getItem(STORAGE_TOKEN_KEY)
}

function getStoredRefreshToken() {
  if (!isBrowser) return null
  return localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY)
}

function persistSession(payload: AuthPayload) {
  if (!isBrowser) return null
  const accessToken = payload.accessToken ?? getAccessToken()
  const refreshToken = payload.refreshToken ?? getStoredRefreshToken()
  if (!accessToken || !refreshToken) return null

  const session: AuthSession = {
    accessToken,
    refreshToken,
    user: payload.user,
    profile: payload.profile,
    family: payload.family,
  }

  localStorage.setItem(STORAGE_TOKEN_KEY, accessToken)
  localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(payload.user))
  localStorage.setItem(`${PROFILE_KEY_PREFIX}${payload.user.id}`, JSON.stringify(payload.profile))
  if (payload.family) {
    localStorage.setItem(`${FAMILY_KEY_PREFIX}${payload.user.id}`, JSON.stringify(payload.family))
  }

  return session
}

function clearSession() {
  if (!isBrowser) return
  const currentUserRaw = localStorage.getItem(CURRENT_USER_KEY)
  if (currentUserRaw) {
    const currentUser: AuthUser = JSON.parse(currentUserRaw)
    localStorage.removeItem(`${PROFILE_KEY_PREFIX}${currentUser.id}`)
    localStorage.removeItem(`${FAMILY_KEY_PREFIX}${currentUser.id}`)
  }
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem(STORAGE_TOKEN_KEY)
  localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY)
}

export const authService = {
  async login(payload: LoginPayload) {
    const data = await httpClient.post<AuthPayload>('/api/auth/login', payload, { auth: false })
    const session = persistSession(data)
    if (!session) {
      throw new Error('Не удалось сохранить сессию')
    }
    return session
  },

  async register(payload: RegisterPayload): Promise<void> {
    await httpClient.post('/api/auth/register', payload, { auth: false })
  },

  async oauthSignIn(provider: 'google' | 'apple' | 'microsoft') {
    const data = await httpClient.post<AuthPayload>('/api/auth/oauth', { provider }, { auth: false })
    const session = persistSession(data)
    if (!session) {
      throw new Error('Не удалось сохранить сессию после OAuth')
    }
    return session
  },

  async me() {
    try {
      const data = await httpClient.get<AuthPayload>('/api/auth/me')
      const session = persistSession({
        ...data,
        accessToken: data.accessToken ?? getAccessToken() ?? undefined,
        refreshToken: data.refreshToken ?? getStoredRefreshToken() ?? undefined,
      })
      return session
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession()
        return null
      }
      throw error
    }
  },

  async logout() {
    try {
      await httpClient.post('/api/auth/logout', undefined)
    } finally {
      clearSession()
    }
  },

  getCachedSession(): AuthSession | null {
    if (!isBrowser) return null
    const accessToken = getAccessToken()
    const refreshToken = getStoredRefreshToken()
    if (!accessToken || !refreshToken) return null

    const userRaw = localStorage.getItem(CURRENT_USER_KEY)
    if (!userRaw) return null

    const user: AuthUser = JSON.parse(userRaw)
    const profileRaw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${user.id}`)
    if (!profileRaw) return null

    const profile: UserProfile = JSON.parse(profileRaw)
    const familyRaw = localStorage.getItem(`${FAMILY_KEY_PREFIX}${user.id}`)
    const family = familyRaw ? (JSON.parse(familyRaw) as FamilyContext) : undefined

    return {
      accessToken,
      refreshToken,
      user,
      profile,
      family,
    }
  },
}
