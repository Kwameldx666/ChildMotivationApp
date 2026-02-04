"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppRouteId, routeRecord } from "@/routes/config"

// Редирект на дашборд с открытием модального окна создания задачи
export default function NewTaskPage() {
  const router = useRouter()

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
      <p className="text-muted-foreground">Перенаправление...</p>
    </div>
  )
}
