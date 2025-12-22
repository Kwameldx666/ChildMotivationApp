"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProfileOverview from "@/components/profile-overview"
import { authApi } from "@/features/auth/api/authApi"
import { clearSession, selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function ProfilePage() {
  const session = useAppSelector(selectAuthSession)
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.replace("/")
    }
  }, [session, router])

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

  if (!session) {
    return null
  }

  return <ProfileOverview session={session} onGoDashboard={handleGoDashboard} onLogout={handleLogout} />
}
