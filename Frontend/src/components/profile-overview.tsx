"use client"

import { useMemo, useState } from "react"
import type { AuthSession } from "@/features/auth/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, Home, LogOut } from "lucide-react"

interface ProfileOverviewProps {
  session: AuthSession
  onLogout: () => void
  onGoDashboard: () => void
}

const roleDictionary: Record<AuthSession["profile"]["role"], string> = {
  parent: "Родитель",
  child: "Ребёнок",
}

export default function ProfileOverview({ session, onLogout, onGoDashboard }: ProfileOverviewProps) {
  const { profile, user, family, token } = session
  const [copied, setCopied] = useState(false)

  const avatarSymbol = useMemo(() => {
    if (profile.avatar?.trim()) {
      return profile.avatar
    }
    const initialsSource = `${profile.name} ${profile.lastName}`.trim()
    if (!initialsSource) {
      return user.email.charAt(0).toUpperCase()
    }
    const initials = initialsSource
      .split(" ")
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase())
      .join("")
    return initials || user.email.charAt(0).toUpperCase()
  }, [profile.avatar, profile.lastName, profile.name, user.email])

  const tokenPreview = useMemo(() => {
    if (!token) return "—"
    if (token.length <= 12) return token
    return `${token.slice(0, 10)}…${token.slice(-6)}`
  }, [token])

  const handleCopyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[profile] Failed to copy token", error)
    }
  }

  const familyName = family?.name ?? "Семья не создана"
  const familyCode = family?.code ?? "—"
  const familyEmblem = family?.emblem ?? "🏡"
  const ageLabel = profile.age ? `${profile.age} лет` : "—"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Мой профиль</h1>
            <p className="text-sm text-muted-foreground">Управляйте данными аккаунта и сведениями о семье</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={onGoDashboard} className="gap-2">
              <Home className="h-4 w-4" />
              К панели
            </Button>
            <Button variant="destructive" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 text-2xl">
                <AvatarFallback>{avatarSymbol}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">
                    {[profile.name, profile.lastName].filter(Boolean).join(" ") || user.email}
                  </h2>
                  <Badge>{roleDictionary[profile.role]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:text-right">
              <div>
                <p className="font-medium text-foreground">Идентификатор</p>
                <p className="font-mono text-xs md:text-sm break-all">{user.id}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Возраст</p>
                <p>{ageLabel}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground">Имя</p>
                <p className="text-base text-foreground mt-1">
                  {[profile.name, profile.lastName].filter(Boolean).join(" ") || "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground">Роль</p>
                <p className="text-base text-foreground mt-1">{roleDictionary[profile.role]}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Токен авторизации</p>
                  <p className="text-sm text-foreground font-mono mt-1">{tokenPreview}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyToken} disabled={!token} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Скопировано" : "Скопировать"}
                </Button>
              </div>
              {!token && <p className="text-xs text-muted-foreground">Токен появится после входа в систему.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Семья</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{familyEmblem}</div>
                <div>
                  <p className="text-lg font-semibold">{familyName}</p>
                  <p className="text-sm text-muted-foreground">Код: {familyCode}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Код семьи можно отправить близким, чтобы они присоединились к FamilyQuest. Если вы ещё не создали
                семью, сделайте это в панели управления.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={onGoDashboard} className="w-full justify-start gap-2" variant="secondary">
                <Home className="h-4 w-4" /> Перейти в панель
              </Button>
              <Button onClick={onLogout} className="w-full justify-start gap-2" variant="outline">
                <LogOut className="h-4 w-4" /> Выйти из аккаунта
              </Button>
              <p className="text-xs text-muted-foreground">
                Советы: обновите профиль, чтобы дети и другие родители узнавали вас быстрее, и делитесь кодом семьи
                только с доверенными членами семьи.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
