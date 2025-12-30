"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { isAxiosError } from "@/api/api"
import type { CompleteGoogleSignInPayload, GooglePendingUser, UserRole } from "@/features/auth/types"
import { useAppDispatch } from "@/store/hooks"
import { setSession } from "@/features/auth/store/authSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function splitName(fullName: string): [string, string] {
  if (!fullName) {
    return ["", ""]
  }

  const parts = fullName.trim().split(" ", 2)
  if (parts.length === 0) return ["", ""]
  if (parts.length === 1) return [parts[0], parts[0]]
  return [parts[0], parts[1]]
}

function mapOAuthError(e: string | null | undefined) {
  if (!e) return "Авторизация прервана пользователем."
  const lower = e.toLowerCase()
  if (lower.includes("access token") || lower.includes("access_token") || lower.includes("the access token is missing"))
    return "Не получен токен доступа от провайдера. Попробуйте ещё раз или вернитесь на главную."
  if (lower.includes("github did not return required user information") || lower.includes("did not return required user information"))
    return "Провайдер не вернул необходимые данные пользователя (email). Попробуйте другой аккаунт или вернитесь на главную."
  if (lower.includes("error while processing") || lower.includes("authentication failed"))
    return "Ошибка при обработке запроса на сервере. Попробуйте позже."
  return e
}

export default function OAuthRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()

  const statusParam = searchParams.get("oauth_status")?.toLowerCase() ?? null
  const tokenParam = searchParams.get("oauth_token")
  const errorParam = searchParams.get("oauth_error")
  const providerParam = (searchParams.get("oauth_provider") ?? "google").toLowerCase() as string

  const [isLoading, setIsLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<GooglePendingUser | null>(null)
  const [role, setRole] = useState<UserRole>("parent")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [familyCode, setFamilyCode] = useState("")
  const [age, setAge] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const processStatus = async () => {
      if (!statusParam) {
        setFatalError("Неизвестный ответ аутентификации.")
        setIsLoading(false)
        return
      }

      if (statusParam === "error") {
        const mappedError = mapOAuthError(errorParam)
        setFatalError(mappedError)
        setIsLoading(false)
        return
      }

      if (!tokenParam) {
        setFatalError("Не удалось получить токен авторизации.")
        setIsLoading(false)
        return
      }

      if (statusParam === "authenticated") {
        try {
          const session = await authApi.fetchProviderSession(providerParam, tokenParam)
          dispatch(setSession(session))
          router.replace("/")
        } catch (err) {
          setFatalError(mapApiError(err, "Не удалось завершить вход."))
          setIsLoading(false)
        }
        return
      }

      if (statusParam === "pending") {
        try {
          const data = await authApi.fetchProviderPendingUser(providerParam, tokenParam)
          const [defaultName, defaultLastName] = splitName(data.name)
          setPendingToken(tokenParam)
          setPendingUser(data)
          setName(defaultName)
          setLastName(defaultLastName)
          setIsLoading(false)
        } catch (err) {
          setFatalError(mapApiError(err, "Не удалось получить данные профиля."))
          setIsLoading(false)
        }
        return
      }

      setError("Получен неизвестный статус авторизации.")
      setIsLoading(false)
    }

    processStatus()
  }, [dispatch, errorParam, router, statusParam, tokenParam])

  // Auto-redirect to home after showing fatal error for a short time
  useEffect(() => {
    if (!fatalError) return
    const t = setTimeout(() => router.replace("/"), 6000)
    return () => clearTimeout(t)
  }, [fatalError, router])

  const avatarPreview = useMemo(() => pendingUser?.picture ?? null, [pendingUser])

  const handleSubmitPending = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingToken || !pendingUser) return

    // clear form-only errors (do not touch fatal errors)
    setFormError(null)

    const trimmedName = name.trim()
    const trimmedLastName = lastName.trim()

    if (!trimmedName || !trimmedLastName) {
      setFormError("Введите имя и фамилию.")
      return
    }

    let normalizedFamilyName: string | null = null
    let normalizedFamilyCode: string | null = null
    let parsedAge: number | null = null

    if (role === "parent") {
      normalizedFamilyName = familyName.trim()
      if (!normalizedFamilyName) {
        setFormError("Введите название семьи.")
        return
      }
    } else {
      normalizedFamilyCode = familyCode.trim().toUpperCase()
      if (!normalizedFamilyCode) {
        setFormError("Введите код семьи.")
        return
      }

      if (age.trim()) {
        const numericAge = Number(age.trim())
        if (Number.isNaN(numericAge) || numericAge < 1 || numericAge > 120) {
          setFormError("Возраст должен быть числом от 1 до 120.")
          return
        }
        parsedAge = numericAge
      } else {
        setFormError("Введите возраст ребёнка.")
        return
      }
    }

    const payload: CompleteGoogleSignInPayload = {
      pendingToken,
      role,
      name: trimmedName,
      lastName: trimmedLastName,
      avatar: avatarPreview,
      age: parsedAge,
      familyCode: normalizedFamilyCode,
      familyName: normalizedFamilyName,
      familyEmblem: null,
    }

    try {
      setIsSubmitting(true)
      const session = await authApi.completeProviderSignIn(providerParam, payload)
      dispatch(setSession(session))
      router.replace("/")
    } catch (err) {
      // Treat client/validation errors (4xx) as form errors; server/fatal as fatal
      const status = (err as any)?.response?.status
      const mapped = mapApiError(err, "Не удалось завершить регистрацию.")
      if (status && status >= 400 && status < 500) {
        setFormError(mapped)
      } else {
        setFatalError(mapped)
      }
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Завершаем авторизацию...</p>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{fatalError}</p>
            <Button onClick={() => router.replace("/")}>Вернуться на главную</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pendingUser || !pendingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Данные авторизации недоступны.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Добро пожаловать, {pendingUser.name}</h1>
            <p className="text-sm text-muted-foreground">Выберите роль и завершите настройку профиля.</p>
          </div>

          {avatarPreview && (
            <div className="flex justify-center">
              <img
                src={avatarPreview}
                alt="Аватар"
                className="h-20 w-20 rounded-full border border-muted shadow"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded whitespace-pre-line">{formError}</div>
          )}

          <form className="space-y-4" onSubmit={handleSubmitPending}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Имя</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" />
              </div>
              <div>
                <Label>Фамилия</Label>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Фамилия" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Роль</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={role === "parent" ? "default" : "outline"}
                  onClick={() => setRole("parent")}
                  disabled={isSubmitting}
                >
                  Родитель
                </Button>
                <Button
                  type="button"
                  variant={role === "child" ? "default" : "outline"}
                  onClick={() => setRole("child")}
                  disabled={isSubmitting}
                >
                  Ребёнок
                </Button>
              </div>
            </div>

            {role === "parent" ? (
              <div>
                <Label>Название семьи</Label>
                <Input
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="Например, Семья Соколовых"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Код семьи</Label>
                  <Input
                    value={familyCode}
                    onChange={(event) => setFamilyCode(event.target.value)}
                    placeholder="ABC123"
                  />
                </div>
                <div>
                  <Label>Возраст</Label>
                  <Input value={age} onChange={(event) => setAge(event.target.value)} placeholder="10" />
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => router.replace("/")} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохраняем..." : "Завершить"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
