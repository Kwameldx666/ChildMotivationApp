"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { openAiChat } from "@/components/ai-chat-widget"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useAppSelector } from "@/store/hooks"
import { AppRouteId, routeRecord } from "@/routes/config"

/**
 * The /ai route now redirects to the appropriate dashboard
 * and opens the floating AI chat widget automatically.
 */
export default function AiAssistantRoute() {
  const session = useAppSelector(selectAuthSession)
  const router = useRouter()

  useEffect(() => {
    // Open the floating widget
    openAiChat()

    // Redirect to dashboard
    if (session?.profile.role === "child") {
      router.replace(routeRecord[AppRouteId.ChildDashboard].path)
    } else if (session?.profile.role === "parent") {
      router.replace(routeRecord[AppRouteId.ParentDashboard].path)
    } else {
      router.replace(routeRecord[AppRouteId.Welcome].path)
    }
  }, [router, session?.profile.role])

  return null
}
