"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import AIChatPage from "@/components/ai-chat-page"
import { AppRoute } from "@/routes/AppRoute"
import { AppRouteId, routeRecord } from "@/routes/config"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import type { UserRole } from "@/features/auth/types"

const ALLOWED_ROLES: UserRole[] = ["parent", "child"]

export default function AiAssistantRoute() {
  const session = useAppSelector(selectAuthSession)
  const router = useRouter()

  const fallbackTarget = routeRecord[AppRouteId.Welcome].path
  const backTarget = useMemo(() => {
    if (!session?.profile.role) return fallbackTarget
    if (session.profile.role === "parent") {
      return routeRecord[AppRouteId.ParentDashboard].path
    }
    if (session.profile.role === "child") {
      return routeRecord[AppRouteId.ChildDashboard].path
    }
    return fallbackTarget
  }, [fallbackTarget, session?.profile.role])

  const handleBack = () => {
    router.push(backTarget)
  }

  return (
    <AppRoute requiredRoles={ALLOWED_ROLES} redirectTo={fallbackTarget}>
      {session ? (
        <AIChatPage
          userName={session.profile.name}
          role={session.profile.role}
          familyName={session.family?.name ?? null}
          onBack={handleBack}
        />
      ) : null}
    </AppRoute>
  )
}
