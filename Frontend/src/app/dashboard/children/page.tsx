"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppRoute } from "@/routes/AppRoute"
import { AppRouteId, routeRecord } from "@/routes/config"
import { useTranslation } from "@/i18n/provider"
import ChildrenPageContent from "@/components/children-page-content"

export default function ChildrenPage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <AppRoute requiredRoles={["parent"]} redirectTo={routeRecord[AppRouteId.Welcome].path}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/parent")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t("childrenPage.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("childrenPage.subtitle")}</p>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ChildrenPageContent />
        </main>
      </div>
    </AppRoute>
  )
}
