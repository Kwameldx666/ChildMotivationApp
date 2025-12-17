export type UserRole = 'parent' | 'child'

export interface AuthUser {
  id: string
  email: string
  name: string
  lastName: string
}

export interface UserProfile {
  name: string
  lastName: string
  avatar: string
  role: UserRole
  age?: number
}

export interface FamilyContext {
  code?: string | null
  name?: string | null
  emblem?: string | null
}

export type OAuthProvider = 'google' | 'apple' | 'microsoft'

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

export interface AuthPayload {
  token?: string | null
  user: AuthUser
  profile: UserProfile
  family?: FamilyContext
}

export interface AuthSession {
  token: string | null
  user: AuthUser
  profile: UserProfile
  family?: FamilyContext
}

export interface AuthState {
  session: AuthSession | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}
