"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function JoinFamilyPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const familyCode = params?.code as string
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    if (familyCode && familyCode.length > 0) {
      setTimeout(() => setStatus("ready"), 800)
    } else {
      setStatus("error")
    }
  }, [familyCode])

  const handleJoin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingFamilyCode", familyCode)
      localStorage.setItem("pendingJoinMode", "child")
    }
    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <LanguageSwitcher variant="outline" size="sm" />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
              <p className="text-muted-foreground">{t("joinPage.checking")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-950 dark:via-red-950 dark:to-slate-900 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <LanguageSwitcher variant="outline" size="sm" />
        </div>
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold">{t("joinPage.invalidLink")}</h1>
              <p className="text-muted-foreground">
                {t("joinPage.invalidDescription")}
              </p>
              <Button onClick={handleCancel} variant="outline" className="mt-4">
                {t("joinPage.goHome")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      <Card className="w-full max-w-md border-2 border-violet-200 dark:border-violet-800 shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-background">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t("joinPage.inviteTitle")}
              </h1>
              <p className="text-muted-foreground">
                {t("joinPage.inviteSubtitle")}
              </p>
            </div>

            {/* Family Code Badge */}
            <div className="w-full">
              <Badge 
                variant="outline" 
                className="text-lg px-6 py-3 font-mono font-bold border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950"
              >
                {familyCode}
              </Badge>
            </div>

            {/* Info */}
            <div className="space-y-3 text-sm text-muted-foreground bg-violet-50 dark:bg-violet-950/50 rounded-lg p-4 w-full">
              <p className="flex items-start gap-2">
                <span className="text-lg">✨</span>
                <span>{t("joinPage.benefit1")}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">🏆</span>
                <span>{t("joinPage.benefit2")}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">📊</span>
                <span>{t("joinPage.benefit3")}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={handleJoin}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/50 text-base"
              >
                {t("joinPage.joinButton")}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {t("joinPage.cancel")}
              </Button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground">
              {t("joinPage.footerNote")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
