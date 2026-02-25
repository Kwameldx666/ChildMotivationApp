"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppRouteId, routeRecord } from "@/routes/config"
import { useTranslation } from "@/i18n/provider"

// Redirect to dashboard and open task creation modal
export default function NewTaskPage() {
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    // Отправляем событие для открытия модального окна
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-task-create"))
    }
    // Редирект на дашборд
    router.replace(routeRecord[AppRouteId.ParentDashboard].path)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">{t("newTaskPage.redirecting")}</p>
    </div>
  )
}
