"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function JoinFamilyPage() {
  const params = useParams()
  const router = useRouter()
  const familyCode = params?.code as string
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    // Проверяем валидность кода
    if (familyCode && familyCode.length > 0) {
      // Небольшая задержка для UI эффекта
      setTimeout(() => setStatus("ready"), 800)
    } else {
      setStatus("error")
    }
  }, [familyCode])

  const handleJoin = () => {
    // Сохраняем код в localStorage для автозаполнения на странице регистрации
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingFamilyCode", familyCode)
      localStorage.setItem("pendingJoinMode", "child")
    }
    // Перенаправляем на главную страницу, которая покажет экран регистрации
    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
              <p className="text-muted-foreground">Проверяем приглашение...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-950 dark:via-red-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold">Неверная ссылка</h1>
              <p className="text-muted-foreground">
                Эта ссылка-приглашение недействительна или устарела
              </p>
              <Button onClick={handleCancel} variant="outline" className="mt-4">
                На главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4">
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
                Приглашение в семью!
              </h1>
              <p className="text-muted-foreground">
                Вас пригласили присоединиться к семье
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
                <span>Присоединяйтесь к семье и начните выполнять задачи</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">🏆</span>
                <span>Зарабатывайте очки и получайте награды</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-lg">📊</span>
                <span>Отслеживайте свой прогресс и достижения</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={handleJoin}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/50 text-base"
              >
                Присоединиться к семье
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Отмена
              </Button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground">
              Для присоединения вам нужно будет создать аккаунт или войти
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
