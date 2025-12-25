"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProfileOverview from "@/components/profile-overview"
import { authApi } from "@/features/auth/api/authApi"
import { clearSession, selectAuthSession, setSession } from "@/features/auth/store/authSlice"
import type { UpdateProfilePayload } from "@/features/auth/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function ProfilePage() {
  const session = useAppSelector(selectAuthSession)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) {
      router.replace("/")
      return
    }

    let cancelled = false

    const fetchProfile = async () => {
      try {
        const refreshedSession = await authApi.getProfile(userId)
        if (!cancelled) {
          dispatch(setSession(refreshedSession))
        }
      } catch (error) {
        console.error("[profile] Failed to refresh profile", error)
      }
    }

    fetchProfile()

    return () => {
      cancelled = true
    }
  }, [userId, router, dispatch])

  const handleGoDashboard = useCallback(() => {
    if (!session) {
      router.replace("/")
      return
    }

    const dashboardPath = session.profile.role === "child" ? "/dashboard/child" : "/dashboard/parent"
    router.push(dashboardPath)
  }, [session, router])

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("[profile] Failed to logout", error)
    } finally {
      dispatch(clearSession())
      router.replace("/")
    }
  }, [dispatch, router])

  const handleProfileUpdate = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!userId) {
        throw new Error("Нет активной сессии")
      }

      const updatedSession = await authApi.updateProfile(userId, payload)
      dispatch(setSession(updatedSession))
      return updatedSession
    },
    [dispatch, userId],
  )

  if (!session) {
    return null
  }

  return (
    <ProfileOverview
      session={session}
      onGoDashboard={handleGoDashboard}
      onLogout={handleLogout}
      onUpdateProfile={handleProfileUpdate}
    />
  )
}
