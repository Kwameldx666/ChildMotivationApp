"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import type { AuthSession, OAuthProvider, UserRole } from "@/features/auth/types"
import { authApi } from "@/features/auth/api/authApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { mapApiError } from "@/features/auth/utils/mapApiError"

type Step = "credentials" | "role" | "parent" | "child"

interface AuthScreenProps {
  onAuth: (session: AuthSession) => void
  onBack: () => void
  initialMode?: "login" | "register"
}

const AVATARS = ["🙂", "😎", "🤖", "🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵"] as const
const FAMILY_EMBLEMS = ["🏠", "🌟", "🍀", "🔥", "🎯", "💎", "🧩", "🚀"] as const

function GoogleIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function AppleIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.7 13.2c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.6-1.6-3.1-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.1 2.7 2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2 .8-1.1 1.1-2.2 1.1-2.2s-2.3-.9-2.3-3.6Z"
      />
      <path
        fill="currentColor"
        d="M14.5 6.8c.6-.7 1-1.7.9-2.7-.9.1-2 .6-2.6 1.3-.6.7-1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z"
      />
    </svg>
  )
}

function MicrosoftIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} aria-hidden="true">
      <path fill="#f35325" d="M2 2h9v9H2z" />
      <path fill="#81bc06" d="M13 2h9v9h-9z" />
      <path fill="#05a6f0" d="M2 13h9v9H2z" />
      <path fill="#ffba08" d="M13 13h9v9h-9z" />
    </svg>
  )
}

function GitHubIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1-.02-1.97-3.2.7-3.88-1.38-3.88-1.38-.53-1.35-1.29-1.71-1.29-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.74.4-1.26.72-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19a11 11 0 0 1 5.79 0c2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.77.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.43-2.69 5.41-5.25 5.69.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
  )
}

export default function AuthScreen({ onAuth, onBack, initialMode = "login" }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  const [step, setStep] = useState<Step>("credentials")
  const [role, setRole] = useState<UserRole>("parent")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState<string>("")
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>(AVATARS[0])

  const [familyName, setFamilyName] = useState("")
  const [familyEmblem, setFamilyEmblem] = useState<(typeof FAMILY_EMBLEMS)[number]>(FAMILY_EMBLEMS[0])
  const [childFamilyCode, setChildFamilyCode] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    setMode(initialMode)
    setStep("credentials")
    setInfo(null)
  }, [initialMode])

  const canGoBack = useMemo(() => step !== "credentials", [step])

  // Client-side: disable final register submit until required fields are valid
  const isRegisterFinishDisabled = useMemo(() => {
    if (isLoading) return true
    if (!name.trim() || !lastName.trim()) return true
    if (step === "parent" && !familyName.trim()) return true
    if (step === "child" && !childFamilyCode.trim()) return true
    if (step === "child" && age.trim()) {
      const parsed = Number(age)
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 120) return true
    }
    return false
  }, [isLoading, name, lastName, familyName, childFamilyCode, age, step])

  const handleBack = () => {
    setError(null)
    setInfo(null)
    if (!canGoBack) {
      onBack()
      return
    }
    if (step === "role") setStep("credentials")
    if (step === "parent" || step === "child") setStep("role")
  }

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email || !password) {
      setError("Введите email и пароль.")
      return
    }

    setIsLoading(true)
    try {
      const session = await authApi.login({ email, password })
      onAuth(session)
    } catch (serviceError) {
      setError(mapApiError(serviceError, "Не удалось войти."))
    } finally {
      setIsLoading(false)
    }
  }

  const submitOAuth = async (provider: OAuthProvider) => {
    setError(null)
    setIsLoading(true)

    try {
      let authorizationUrl: string | undefined

      if (provider === "google") {
        authorizationUrl = (await authApi.getOAuthAuthorization('google')).authorizationUrl
      } else if (provider === "github") {
        authorizationUrl = (await authApi.getOAuthAuthorization('github')).authorizationUrl
      } else if (provider === "microsoft") {
        authorizationUrl = (await authApi.getOAuthAuthorization('microsoft')).authorizationUrl
      } else {
        setError("Интеграция с выбранным провайдером ещё не доступна.")
        setIsLoading(false)
        return
      }

      if (!authorizationUrl) throw new Error('Authorization URL not provided')
      window.location.href = authorizationUrl
    } catch (serviceError) {
      setError(mapApiError(serviceError, "Не удалось начать вход через провайдера."))
      setIsLoading(false)
    }
  }

  const submitRegisterStart = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Введите email и пароль.")
      return
    }
    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов.")
      return
    }

    setStep("role")
  }

  const submitRegisterFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !lastName.trim()) {
      setError("Введите имя и фамилию.")
      return
    }

    if (role === "parent") {
      if (!familyName.trim()) {
        setError("Введите название семьи.")
        return
      }
    } else {
      if (!childFamilyCode.trim()) {
        setError("Введите код семьи.")
        return
      }
    }

    const parsedAge = age.trim() ? Number(age) : undefined
    if (role === "child" && age.trim() && (Number.isNaN(parsedAge) || parsedAge! < 1 || parsedAge! > 120)) {
      setError("Возраст должен быть числом.")
      return
    }

    const profilePayload = {
      name: name.trim(),
      lastName: lastName.trim(),
      avatar,
      ...(role === "child" && parsedAge ? { age: parsedAge } : {}),
    }

    setIsLoading(true)
    try {
      if (role === "parent") {
        await authApi.register({
          email,
          password,
          role: "parent",
          profile: profilePayload,
          family: {
            name: familyName.trim(),
            emblem: familyEmblem,
          },
        })
      } else {
        await authApi.register({
          email,
          password,
          role: "child",
          profile: profilePayload,
          family: {
            code: childFamilyCode.trim().toUpperCase(),
          },
        })
      }
      setInfo("Регистрация прошла успешно! Войдите, используя указанные данные.")
      setMode("login")
      setStep("credentials")
      setError(null)
    } catch (serviceError) {
      setError(mapApiError(serviceError, "Не удалось зарегистрироваться."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>

          {step === "credentials" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{mode === "login" ? "Вход" : "Регистрация"}</h2>
                <p className="text-sm text-muted-foreground">FamilyQuest</p>
              </div>

              <form className="space-y-4" onSubmit={mode === "login" ? submitLogin : submitRegisterStart}>
                <div>
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <Label>Пароль</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded whitespace-pre-line">
                    {error}
                  </div>
                )}
                {info && !error && <div className="text-sm text-emerald-600 bg-emerald-100 p-3 rounded">{info}</div>}

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Подождите..." : mode === "login" ? "Войти" : "Продолжить"}
                </Button>

                {(mode === "login" || mode === "register") && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">или</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("google")}
                        disabled={isLoading}
                        aria-label="Войти через Google"
                      >
                        <GoogleIcon className="h-5 w-5" />
                        <span className="sr-only">Google</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("github")}
                        disabled={isLoading}
                        aria-label="Войти через GitHub"
                      >
                        <GitHubIcon className="h-5 w-5" />
                        <span className="sr-only">GitHub</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("microsoft")}
                        disabled={isLoading}
                        aria-label="Войти через Microsoft"
                      >
                        <MicrosoftIcon className="h-5 w-5" />
                        <span className="sr-only">Microsoft</span>
                      </Button>
                    </div>
                  </>
                )}

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      setMode((m) => (m === "login" ? "register" : "login"))
                    }}
                    className="text-primary hover:underline"
                  >
                    {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "role" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold">Выберите роль</h2>
                <p className="text-sm text-muted-foreground">Для регистрации нужно выбрать родителя или ребёнка.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "parent" ? "default" : "outline"}
                  onClick={() => setRole("parent")}
                >
                  Родитель
                </Button>
                <Button
                  type="button"
                  variant={role === "child" ? "default" : "outline"}
                  onClick={() => setRole("child")}
                >
                  Ребёнок
                </Button>
              </div>

              <Button
                type="button"
                className="w-full bg-linear-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg"
                onClick={() => setStep(role === "parent" ? "parent" : "child")}
              >
                Продолжить
              </Button>
            </div>
          )}

          {(step === "parent" || step === "child") && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {step === "parent" ? "Данные родителя" : "Данные ребёнка"}
                </h2>
                <p className="text-sm text-muted-foreground">Заполните профиль для завершения регистрации.</p>
              </div>

              <form className="space-y-4" onSubmit={submitRegisterFinish}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Имя</Label>
                    <Input required aria-invalid={!name.trim()} value={name} onChange={(e) => setName(e.target.value)} />
                    {!name.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                  </div>
                  <div>
                    <Label>Фамилия</Label>
                    <Input required aria-invalid={!lastName.trim()} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    {!lastName.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                  </div>
                </div>

                {step === "child" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Возраст (опционально)</Label>
                      <Input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
                      {age.trim() && (Number.isNaN(Number(age)) || Number(Number(age)) < 1 || Number(Number(age)) > 120) && (
                        <p className="text-xs text-destructive mt-1">Некорректный возраст</p>
                      )}
                    </div>
                    <div>
                      <Label>Аватар</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value as (typeof AVATARS)[number])}
                      >
                        {AVATARS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {step === "parent" ? (
                  <>
                    <div>
                      <Label>Название семьи</Label>
                      <Input required aria-invalid={!familyName.trim()} value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
                      {!familyName.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                    </div>
                    <div>
                      <Label>Эмблема</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={familyEmblem}
                        onChange={(e) => setFamilyEmblem(e.target.value as (typeof FAMILY_EMBLEMS)[number])}
                      >
                        {FAMILY_EMBLEMS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Код семьи создастся автоматически после регистрации.
                    </p>
                  </>
                ) : (
                  <div>
                    <Label>Код семьи</Label>
                    <Input
                      required
                      aria-invalid={!childFamilyCode.trim()}
                      value={childFamilyCode}
                      onChange={(e) => setChildFamilyCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                    />
                    {!childFamilyCode.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                  </div>
                )}

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg"
                  disabled={isRegisterFinishDisabled}
                >
                  {isRegisterFinishDisabled ? "Заполните обязательные поля" : isLoading ? "Подождите..." : "Зарегистрироваться"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
