"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import type { AuthSession, OAuthProvider, UserRole } from "@/features/auth/types"
import { authApi } from "@/features/auth/api/authApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus } from "lucide-react"
import { mapApiError } from "@/features/auth/utils/mapApiError"



interface AuthScreenProps {
  onAuth: (session: AuthSession) => void
  onBack: () => void
  initialMode?: "login" | "register"
}

const AVATARS = ["🙂", "😎", "🤖", "🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵"] as const
const FAMILY_EMBLEMS = ["🏠", "🌟", "🍀", "🔥", "🎯", "💎", "🧩", "🚀"] as const
const INTERESTS = [
  { id: 'sports', label: 'Спорт', emoji: '⚽' },
  { id: 'music', label: 'Музыка', emoji: '🎵' },
  { id: 'art', label: 'Рисование', emoji: '🎨' },
  { id: 'gaming', label: 'Игры', emoji: '🎮' },
  { id: 'reading', label: 'Чтение', emoji: '📚' },
  { id: 'science', label: 'Наука', emoji: '🔬' },
  { id: 'cooking', label: 'Кулинария', emoji: '🍳' },
  { id: 'nature', label: 'Природа', emoji: '🌳' },
  { id: 'movies', label: 'Кино', emoji: '🎬' },
  { id: 'dancing', label: 'Танцы', emoji: '💃' },
] as const
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

function DiscordIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={props.className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8852 1.5152.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.075.075 0 0 0 .0812-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.0692.0692 0 0 0-.0366-.0966c-.6528-.2476-1.2743-.5495-1.8722-.8923a.0703.0703 0 0 1-.0065-.1177c.1254-.0943.2508-.1923.3718-.2914a.0576.0576 0 0 1 .0596-.0107c3.9278 1.7933 8.18 1.7933 12.0614 0a.0566.0566 0 0 1 .0609.0098c.121.099.2464.198.3718.2923a.0702.0702 0 0 1-.0057.1176c-.598.343-.6302.3608-1.873.8924a.0686.0686 0 0 0-.0359.0966c.3604.698.7719 1.3628 1.2245 1.9932a.076.076 0 0 0 .0813.0276c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.082.082 0 0 0 .03-.0559c.5004-5.177-.8382-9.5818-3.5485-13.6604a.0619.0619 0 0 0-.0312-.0282z"
      />
      <path
        fill="#fff"
        d="M9.173 15.305c-1.18 0-2.155-1.085-2.155-2.420 0-1.334 0-3.048 0-3.048s.975-.469 2.155-.469 2.156.426 2.156.426 1.017-.426 2.297-.426 2.156.469 2.156.469 0 1.714 0 3.048c0 1.335-.971 2.42-2.151 2.42-1.18 0-2.155-1.085-2.155-1.085s-.976 1.085-2.298 1.085z"
      />
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
  const [role, setRole] = useState<UserRole>("parent")
  const [isJoiningByInvite, setIsJoiningByInvite] = useState(false) // Блокировка выбора роли

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState<string>("")
  const [avatar, setAvatar] = useState<string>(AVATARS[0])
  const [interests, setInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState("")

  const [familyName, setFamilyName] = useState("")
  const [familyEmblem, setFamilyEmblem] = useState<(typeof FAMILY_EMBLEMS)[number]>(FAMILY_EMBLEMS[0])
  const [childFamilyCode, setChildFamilyCode] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // UX: track user interaction to avoid showing validation errors immediately
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [lastNameTouched, setLastNameTouched] = useState(false)
  const [familyNameTouched, setFamilyNameTouched] = useState(false)
  const [childFamilyCodeTouched, setChildFamilyCodeTouched] = useState(false)
  const [ageTouched, setAgeTouched] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setInfo(null)
  }, [initialMode])

  // Загружаем pendingFamilyCode и режим из localStorage (для приглашений)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingCode = localStorage.getItem("pendingFamilyCode")
      const pendingMode = localStorage.getItem("pendingJoinMode")
      
      if (pendingCode) {
        setChildFamilyCode(pendingCode)
        localStorage.removeItem("pendingFamilyCode")
      }
      
      if (pendingMode === "child") {
        setRole("child")
        setMode("register")
        setIsJoiningByInvite(true) // Блокируем выбор роли
        localStorage.removeItem("pendingJoinMode")
      }
    }
  }, [])



  // Simple email validator (not fully RFC, but practical)
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const resolveOAuthProvider = (provider: OAuthProvider): 'google' | 'github' | 'microsoft' | 'discord' => {
    if (provider === 'google' || provider === 'github' || provider === 'discord') {
      return provider
    }

    if (provider === 'microsoft') {
      // Legacy: Microsoft button routes through Discord provider for now
      return 'discord'
    }

    throw new Error('Интеграция с выбранным провайдером ещё не доступна.')
  }

  // Client-side: disable register submit until required fields are valid
  const isRegisterFinishDisabled = useMemo(() => {
    if (mode !== "register") return true
    if (isLoading) return true
    if (!email || !password) return true
    if (!isValidEmail(email)) return true
    if (!name.trim() || !lastName.trim()) return true
    if (role === "parent" && !familyName.trim()) return true
    if (role === "child" && !childFamilyCode.trim()) return true
    if (role === "child" && !age.trim()) return true // Обязательное поле возраста
    if (role === "child" && age.trim()) {
      const parsed = Number(age)
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 120) return true
    }
    return false
  }, [mode, isLoading, email, password, name, lastName, familyName, childFamilyCode, age, role])

  const handleBack = () => {
    setError(null)
    setInfo(null)
    onBack()
  }

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitAttempted(true)

    if (!email || !password) {
      setError("Введите email и пароль.")
      return
    }

    if (!isValidEmail(email)) {
      setError("Введите корректный email.")
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
      const resolvedProvider = resolveOAuthProvider(provider)
      const { authorizationUrl } = await authApi.getOAuthAuthorization(resolvedProvider)
      if (!authorizationUrl) {
        throw new Error('Authorization URL not provided')
      }
      window.location.href = authorizationUrl
    } catch (serviceError) {
      setError(mapApiError(serviceError, "Не удалось начать вход через провайдера."))
      setIsLoading(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitAttempted(true)

    if (!email || !password) {
      setError("Введите email и пароль.")
      return
    }
    if (!isValidEmail(email)) {
      setError("Введите корректный email.")
      return
    }
    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов.")
      return
    }

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
      ...(role === "child" && interests.length > 0 ? { interests } : {}),
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
      setError(null)
      setSubmitAttempted(false)
      setEmailTouched(false)
      setNameTouched(false)
      setLastNameTouched(false)
      setFamilyNameTouched(false)
      setChildFamilyCodeTouched(false)
      setAgeTouched(false) 
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

          {(mode === "login" || mode === "register") && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">{mode === "login" ? "Вход" : "Регистрация"}</h2>
                <p className="text-sm text-gray-700">FamilyQuest</p>
              </div>

              <form className="space-y-4" onSubmit={mode === "login" ? submitLogin : submitRegister}>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder="you@example.com" aria-invalid={(emailTouched || submitAttempted) && !isValidEmail(email)} />
                  {(emailTouched || submitAttempted) && !isValidEmail(email) && <p className="text-xs text-destructive mt-1">Введите корректный email</p>}
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

                {mode === "register" && (
                  <>
                    <div className="text-center mb-2">
                      <p className="text-sm text-gray-700">Выберите роль и заполните профиль</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={role === "parent" ? "default" : "outline"}
                        onClick={() => setRole("parent")}
                        disabled={isJoiningByInvite}
                      >
                        Родитель
                      </Button>
                      <Button
                        type="button"
                        variant={role === "child" ? "default" : "outline"}
                        onClick={() => setRole("child")}
                        disabled={isJoiningByInvite}
                      >
                        Ребёнок
                      </Button>
                    </div>
                    
                    {isJoiningByInvite && (
                      <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                        ⚠️ Вы присоединяетесь по ссылке-приглашению. Роль автоматически установлена как "Ребёнок"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Имя</Label>
                        <Input required aria-invalid={(nameTouched || submitAttempted) && !name.trim()} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setNameTouched(true)} />
                        {(nameTouched || submitAttempted) && !name.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                      </div>
                      <div>
                        <Label>Фамилия</Label>
                        <Input required aria-invalid={(lastNameTouched || submitAttempted) && !lastName.trim()} value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={() => setLastNameTouched(true)} />
                        {(lastNameTouched || submitAttempted) && !lastName.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                      </div>
                    </div>

                    {role === "child" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Возраст *</Label>
                            <Input 
                              required
                              value={age} 
                              onChange={(e) => setAge(e.target.value)} 
                              onBlur={() => setAgeTouched(true)} 
                              inputMode="numeric"
                              placeholder="Введите возраст"
                              aria-invalid={(ageTouched || submitAttempted) && (!age.trim() || Number.isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120)}
                            />
                            {(ageTouched || submitAttempted) && !age.trim() && (
                              <p className="text-xs text-destructive mt-1">Обязательное поле</p>
                            )}
                            {(ageTouched || submitAttempted) && age.trim() && (Number.isNaN(Number(age)) || Number(Number(age)) < 1 || Number(Number(age)) > 120) && (
                              <p className="text-xs text-destructive mt-1">Некорректный возраст (1-120)</p>
                            )} 
                          </div>
                          <div>
                            <Label>Аватар</Label>
                            <div className="flex gap-2">
                              <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                              >
                                {AVATARS.map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="file"
                                accept="image/*"
                                className="text-sm"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    const result = reader.result as string | null
                                    if (result) setAvatar(result)
                                  }
                                  reader.readAsDataURL(f)
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label>Что тебе нравится? (необязательно)</Label>
                          <p className="text-xs text-muted-foreground mb-2">Выбери готовые или добавь свои увлечения</p>
                          
                          {/* Отображение выбранных интересов как тегов */}
                          {interests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                              {interests.map((interestId) => {
                                const predefined = INTERESTS.find(i => i.id === interestId)
                                return (
                                  <div
                                    key={interestId}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                                  >
                                    {predefined && <span>{predefined.emoji}</span>}
                                    <span>{predefined?.label || interestId}</span>
                                    <button
                                      type="button"
                                      onClick={() => setInterests(prev => prev.filter(i => i !== interestId))}
                                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Быстрый выбор из предложенных */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {INTERESTS.map((interest) => (
                              <Button
                                key={interest.id}
                                type="button"
                                variant={interests.includes(interest.id) ? "default" : "outline"}
                                className="justify-start gap-2 h-auto py-2"
                                onClick={() => {
                                  setInterests(prev => 
                                    prev.includes(interest.id) 
                                      ? prev.filter(i => i !== interest.id)
                                      : [...prev, interest.id]
                                  )
                                }}
                              >
                                <span className="text-lg">{interest.emoji}</span>
                                <span className="text-sm">{interest.label}</span>
                              </Button>
                            ))}
                          </div>

                          {/* Поле для добавления своего интереса */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Добавь свой интерес..."
                              value={customInterest}
                              onChange={(e) => setCustomInterest(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const trimmed = customInterest.trim()
                                  if (trimmed && !interests.includes(trimmed)) {
                                    setInterests(prev => [...prev, trimmed])
                                    setCustomInterest("")
                                  }
                                }
                              }}
                              disabled={isSubmitting}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const trimmed = customInterest.trim()
                                if (trimmed && !interests.includes(trimmed)) {
                                  setInterests(prev => [...prev, trimmed])
                                  setCustomInterest("")
                                }
                              }}
                              disabled={!customInterest.trim() || isSubmitting}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Нажми Enter или + чтобы добавить</p>
                        </div>
                      </>
                    )}

                    {role === "parent" ? (
                      <>
                        <div>
                          <Label>Название семьи</Label>
                          <Input required aria-invalid={(familyNameTouched || submitAttempted) && !familyName.trim()} value={familyName} onChange={(e) => setFamilyName(e.target.value)} onBlur={() => setFamilyNameTouched(true)} />
                          {(familyNameTouched || submitAttempted) && !familyName.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
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
                        <p className="text-xs text-gray-600">Код семьи создастся автоматически после регистрации.</p>
                      </>
                    ) : (
                      <div>
                        <Label>Код семьи</Label>
                        <Input
                          required
                          aria-invalid={(childFamilyCodeTouched || submitAttempted) && !childFamilyCode.trim()}
                          value={childFamilyCode}
                          onChange={(e) => setChildFamilyCode(e.target.value.toUpperCase())}
                          onBlur={() => setChildFamilyCodeTouched(true)}
                          placeholder="ABC123"
                        />
                        {(childFamilyCodeTouched || submitAttempted) && !childFamilyCode.trim() && <p className="text-xs text-destructive mt-1">Обязательное поле</p>}
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded whitespace-pre-line">
                    {error}
                  </div>
                )}
                {info && !error && <div className="text-sm text-emerald-600 bg-emerald-100 p-3 rounded">{info}</div>}

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg"
                  disabled={mode === "register" ? isRegisterFinishDisabled : isLoading}
                >
                  {mode === "register" ? (isRegisterFinishDisabled ? "Заполните обязательные поля" : isLoading ? "Подождите..." : "Зарегистрироваться") : (isLoading ? "Подождите..." : "Войти")}
                </Button>

                {(mode === "login" || mode === "register") && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-600">или</span>
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
                        onClick={() => submitOAuth("discord")}
                        disabled={isLoading}
                        aria-label="Войти через Discord"
                      >
                        <DiscordIcon className="h-5 w-5" />
                        <span className="sr-only">Discord</span>
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




        </CardContent>
      </Card>
    </div>
  )
}
