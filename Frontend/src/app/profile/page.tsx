"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProfileOverview from "@/components/profile-overview"
import { authApi } from "@/features/auth/api/authApi"
import { clearSession, selectAuthSession, setSession } from "@/features/auth/store/authSlice"
import type { UpdateProfilePayload } from "@/features/auth/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useTranslation } from "@/i18n/provider"
import { userSettingsService } from "@/services/user-settings-service"

export default function ProfilePage() {
  const session = useAppSelector(selectAuthSession)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { t } = useTranslation()

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
        throw new Error(t("profilePage.noActiveSession"))
      }

      const updatedSession = await authApi.updateProfile(userId, payload)
      dispatch(setSession(updatedSession))
      return updatedSession
    },
    [dispatch, userId],
  )

  const handleDeleteAccount = useCallback(async () => {
    await authApi.deleteAccount()
    userSettingsService.clearAllData()
    dispatch(clearSession())
    router.replace("/")
  }, [dispatch, router])

  if (!session) {
    return null
  }

  return (
    <ProfileOverview
      session={session}
      onGoDashboard={handleGoDashboard}
      onLogout={handleLogout}
      onUpdateProfile={handleProfileUpdate}
      onDeleteAccount={handleDeleteAccount}
    />
  )
}
