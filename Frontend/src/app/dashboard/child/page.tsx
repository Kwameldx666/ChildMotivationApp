"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import ChildDashboard from "@/components/child-dashboard"
import { authApi } from "@/features/auth/api/authApi"
import { clearSession, selectAuthSession, setSession } from "@/features/auth/store/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { AppRoute } from "@/routes/AppRoute"
import { AppRouteId, routeRecord } from "@/routes/config"

export default function ChildDashboardPage() {
  const session = useAppSelector(selectAuthSession)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) {
      return
    }

    let cancelled = false

    const refreshProfile = async () => {
      try {
        const refreshedSession = await authApi.getProfile(userId)
        if (!cancelled) {
          dispatch(setSession(refreshedSession))
        }
      } catch (error) {
        console.error("[child-dashboard] Failed to refresh profile", error)
      }
    }

    refreshProfile()

    return () => {
      cancelled = true
    }
  }, [userId, dispatch])

  const avatar = useMemo(() => {
    if (!session) {
      return "🙂"
    }

    if (session.profile.avatar?.trim()) {
      return session.profile.avatar.trim()
    }

    const initial = session.profile.name?.trim()?.charAt(0)?.toUpperCase()
    if (initial) {
      return initial
    }

    return "🙂"
  }, [session])

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("[child-dashboard] Failed to logout", error)
    } finally {
      dispatch(clearSession())
      router.replace(routeRecord[AppRouteId.Welcome].path)
    }
  }, [dispatch, router])

  const dashboard = session && userId ? (
    <ChildDashboard
      userId={userId}
      userProfile={{
        name: session.profile.name,
        avatar,
        age: session.profile.age ?? undefined,
        role: session.profile.role,
      }}
      familyCode={session.family?.code ?? ""}
      onLogout={handleLogout}
    />
  ) : null

  return (
    <AppRoute requiredRoles={["child"]} redirectTo={routeRecord[AppRouteId.Welcome].path}>
      {dashboard}
    </AppRoute>
  )
}
