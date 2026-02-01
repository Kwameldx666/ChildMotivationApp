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

export type OAuthProvider = 'google' | 'github' | 'apple' | 'microsoft' | 'discord'

export interface GoogleAuthorizationResponse {
  authorizationUrl: string
  state: string
}

export type GoogleSignInStatus = 'authenticated' | 'pending'

export interface GooglePendingUser {
  email: string
  name: string
  picture: string
  providerUserId?: string
}

export interface CompleteGoogleSignInPayload {
  pendingToken: string
  role: UserRole
  name: string
  lastName: string
  email?: string | null
  avatar?: string | null
  age?: number | null
  familyCode?: string | null
  familyName?: string | null
  familyEmblem?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayloadBase {
  email: string
  password: string
  profile: Omit<UserProfile, 'role'> & { role?: UserRole }
}

export type RegisterPayload =
  | (RegisterPayloadBase & {
      role: 'parent'
      family: {
        name: string
        emblem?: string | null
      }
    })
  | (RegisterPayloadBase & {
      role: 'child'
      family: {
        code: string
      }
    })

export interface AuthPayload {
  accessToken?: string | null
  refreshToken?: string | null
  tokenType?: string | null
  user: AuthUser
  profile: UserProfile
  family?: FamilyContext
}

export interface AuthSession {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser
  profile: UserProfile
  family?: FamilyContext
}

export interface AuthState {
  session: AuthSession | null
  status: 'idle' | 'loading' | 'error'
  error: string | null
}

export interface UserProfileResponse {
  user: AuthUser
  profile: UserProfile
  family?: FamilyContext
  subscription?: SubscriptionInfo
}

export interface SubscriptionInfo {
  tier: string
  status: string
  startDate: string
  endDate: string | null
  pricePerMonth: number
  autoRenew: boolean
  maxChildren: number
  maxTasksPerDay: number
  hasAIAssistant: boolean
  hasAdvancedAnalytics: boolean
  hasCustomRewards: boolean
  hasPrioritySupport: boolean
  hasFamilySharing: boolean
  hasOfflineMode: boolean
  daysRemaining: number | null
}

export interface UpdateProfilePayload {
  name?: string | null
  lastName?: string | null
  avatar?: string | null
  age?: number | null
}
