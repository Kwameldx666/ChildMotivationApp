export type Screen =
  | 'splash'
  | 'welcome'
  | 'auth-choice'
  | 'auth'
  | 'child-setup'
  | 'parent-dashboard'
  | 'child-dashboard'

export type { UserRole, AuthUser, UserProfile, FamilyContext, AuthSession } from '@/features/auth/types'
