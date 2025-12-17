"use client"

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/features/auth/types'
import { useAppSelector } from '@/store/hooks'
import { selectAuthSession } from '@/features/auth/store/authSlice'

interface AppRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  fallback?: ReactNode
  redirectTo?: string
}

export function AppRoute({ children, requiredRoles, fallback = null, redirectTo = '/' }: AppRouteProps) {
  const router = useRouter()
  const session = useAppSelector(selectAuthSession)

  const isAuthorized = (() => {
    if (!requiredRoles?.length) return true
    if (!session) return false
    if (!session.profile?.role) return false
    return requiredRoles.includes(session.profile.role)
  })()

  useEffect(() => {
    if (!isAuthorized && requiredRoles?.length) {
      router.replace(redirectTo)
    }
  }, [isAuthorized, redirectTo, requiredRoles, router])

  if (!isAuthorized) {
    return fallback
  }

  return <>{children}</>
}
