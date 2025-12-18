export type Screen =
  | 'splash'
  | 'welcome'
  | 'auth-choice'
  | 'auth'
  | 'parent-dashboard'
  | 'child-dashboard'

export type { UserRole, AuthUser, UserProfile, FamilyContext, AuthSession } from '@/features/auth/types'
