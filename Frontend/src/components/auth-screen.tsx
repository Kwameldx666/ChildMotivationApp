"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import type { AuthSession, OAuthProvider, UserRole } from "@/features/auth/types"
import { authApi } from "@/features/auth/api/authApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Plus } from "lucide-react"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { openOAuthPopup } from "@/utils/oauth-popup"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"



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
  const { t } = useTranslation()
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(initialMode)
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

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)


  const interestsOptions = useMemo(() => [
    { id: "sports", label: t("authScreen.interests.sports"), emoji: "⚽" },
    { id: "music", label: t("authScreen.interests.music"), emoji: "🎵" },
    { id: "art", label: t("authScreen.interests.art"), emoji: "🎨" },
    { id: "gaming", label: t("authScreen.interests.gaming"), emoji: "🎮" },
    { id: "reading", label: t("authScreen.interests.reading"), emoji: "📚" },
    { id: "science", label: t("authScreen.interests.science"), emoji: "🔬" },
    { id: "cooking", label: t("authScreen.interests.cooking"), emoji: "🍳" },
    { id: "nature", label: t("authScreen.interests.nature"), emoji: "🌳" },
    { id: "movies", label: t("authScreen.interests.movies"), emoji: "🎬" },
    { id: "dancing", label: t("authScreen.interests.dancing"), emoji: "💃" },
  ], [t])

  // UX: track user interaction to avoid showing validation errors immediately
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [lastNameTouched, setLastNameTouched] = useState(false)
  const [familyNameTouched, setFamilyNameTouched] = useState(false)
  const [ageTouched, setAgeTouched] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setInfo(null)
  }, [initialMode])

  // Clean up any stale join mode data from old invite links
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pendingJoinMode")
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

    throw new Error(t("authScreen.errors.oauthProviderUnavailable"))
  }

  // Client-side: disable register submit until required fields are valid
  const isRegisterFinishDisabled = useMemo(() => {
    if (mode !== "register") return true
    if (isLoading) return true
    if (!email || !password) return true
    if (!isValidEmail(email)) return true
    if (!name.trim() || !lastName.trim()) return true
    if (!familyName.trim()) return true
    return false
  }, [mode, isLoading, email, password, name, lastName, familyName])

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
      setError(t("authScreen.errors.loginEmailPasswordRequired"))
      return
    }

    setIsLoading(true)
    try {
      const session = await authApi.login({ email, password })
      onAuth(session)
    } catch (serviceError: any) {
      setError(mapApiError(serviceError, t("authScreen.errors.loginFailed")))
    } finally {
      setIsLoading(false)
    }
  }

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email || !isValidEmail(email)) {
      setError(t("auth.forgotPasswordEmailRequired"))
      return
    }

    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setInfo(t("auth.forgotPasswordSuccess"))
    } catch (serviceError: any) {
      // Check if it's an email-not-confirmed error
      const errorData = serviceError?.response?.data
      const errorCode = errorData?.code ?? errorData?.Code ?? ""
      if (errorCode === "EmailNotConfirmed") {
        setError(t("auth.emailNotConfirmedError"))
      } else {
        setError(mapApiError(serviceError, t("auth.forgotPasswordFailed")))
      }
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
      
      // Открываем popup вместо редиректа
      const result = await openOAuthPopup(authorizationUrl)
      
      if (result.status === 'authenticated' && result.session) {
        // Используем полученную сессию напрямую
        onAuth(result.session)
      } else if (result.status === 'pending') {
        // Для pending показываем сообщение что нужно завершить регистрацию
        setError(t("authScreen.errors.oauthPending"))
      } else if (result.status === 'error') {
        setError(result.error || t("authScreen.errors.oauthError"))
      }
    } catch (serviceError: any) {
      if (serviceError.message?.includes('всплывающие окна')) {
        setError(t("authScreen.errors.oauthPopupBlocked"))
      } else if (serviceError.message?.includes('закрыто')) {
        setError(t("authScreen.errors.oauthCancelled"))
      } else {
        setError(mapApiError(serviceError, t("authScreen.errors.oauthStartFailed")))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitAttempted(true)

    if (!email || !password) {
      setError(t("authScreen.errors.loginEmailPasswordRequired"))
      return
    }
    if (!isValidEmail(email)) {
      setError(t("authScreen.errors.emailInvalid"))
      return
    }
    if (password.length < 6) {
      setError(t("authScreen.errors.passwordTooShort"))
      return
    }

    if (!name.trim() || !lastName.trim()) {
      setError(t("authScreen.errors.nameLastNameRequired"))
      return
    }

    if (role === "parent") {
      if (!familyName.trim()) {
        setError(t("authScreen.errors.familyNameRequired"))
        return
      }
    }

    const profilePayload = {
      name: name.trim(),
      lastName: lastName.trim(),
      avatar,
    }

    setIsLoading(true)
    try {
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
      setInfo(t("authScreen.info.registerSuccessCheckEmail"))
      setMode("login")
      setError(null)
      setSubmitAttempted(false)
      setEmailTouched(false)
      setNameTouched(false)
      setLastNameTouched(false)
      setFamilyNameTouched(false) 
    } catch (serviceError) {
      setError(mapApiError(serviceError, t("authScreen.errors.registerFailed")))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      {/* Декоративный фон */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50 relative z-10">
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="mb-6 bg-white/80 hover:bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-800 font-semibold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          {(mode === "login" || mode === "register") && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {mode === "login" ? t("auth.signIn") : t("auth.signUp")}
                </h2>
                <p className="text-sm text-gray-600 font-medium">{t("welcome.appName")}</p>
              </div>

              <form className="space-y-4" onSubmit={mode === "login" ? submitLogin : submitRegister}>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                    {mode === "login" ? t("auth.emailOrLogin") : t("auth.email")}
                  </Label>
                  <Input 
                    type={mode === "login" ? "text" : "email"}
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    onBlur={() => setEmailTouched(true)} 
                    placeholder={mode === "login" ? t("auth.emailOrLoginPlaceholder") : "you@example.com"}
                    aria-invalid={mode === "register" && (emailTouched || submitAttempted) && !isValidEmail(email)}
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                  />
                  {mode === "register" && (emailTouched || submitAttempted) && !isValidEmail(email) && (
                    <p className="text-xs text-destructive mt-1">{t("authScreen.errors.emailInvalid")}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("auth.password")}</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••"
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                  />
                  {mode === "login" && (
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => { setError(null); setInfo(null); setMode("forgot-password") }}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    </div>
                  )}
                </div>

                {mode === "register" && (
                  <>
                    {/* Role is always parent – children are added by parents from dashboard */}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.firstName")}</Label>
                        <Input 
                          required 
                          aria-invalid={(nameTouched || submitAttempted) && !name.trim()} 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          onBlur={() => setNameTouched(true)}
                          className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                        />
                        {(nameTouched || submitAttempted) && !name.trim() && (
                          <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.lastName")}</Label>
                        <Input 
                          required 
                          aria-invalid={(lastNameTouched || submitAttempted) && !lastName.trim()} 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)} 
                          onBlur={() => setLastNameTouched(true)}
                          className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                        />
                        {(lastNameTouched || submitAttempted) && !lastName.trim() && (
                          <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>
                        )}
                      </div>
                    </div>

                    {/* Parent-only: family name + avatar */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.familyName")}</Label>
                      <Input 
                        required 
                        aria-invalid={(familyNameTouched || submitAttempted) && !familyName.trim()} 
                        value={familyName} 
                        onChange={(e) => setFamilyName(e.target.value)} 
                        onBlur={() => setFamilyNameTouched(true)}
                        className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                      />
                      {(familyNameTouched || submitAttempted) && !familyName.trim() && (
                        <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>
                      )}
                    </div>
                        
                        {/* Аватар для родителя */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.avatar")}</Label>
                          <div className="flex items-center gap-3">
                            {/* Превью аватара */}
                            <div className="w-16 h-16 rounded-full border-2 border-purple-300 flex items-center justify-center overflow-hidden bg-purple-50 flex-shrink-0">
                              {avatar.startsWith('data:') ? (
                                <img src={avatar} alt={t("authScreen.avatarAlt")} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-3xl">{avatar}</span>
                              )}
                            </div>
                            
                            {/* Кнопка загрузки и выбор эмодзи */}
                            <div className="flex-1 space-y-2">
                              <input
                                type="file"
                                accept="image/*"
                                id="parent-avatar-upload"
                                className="hidden"
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
                              <label
                                htmlFor="parent-avatar-upload"
                                className="w-full h-10 px-4 py-2 bg-white border-2 border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 font-semibold rounded-md cursor-pointer transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">{t("authScreen.uploadPhoto")}</span>
                              </label>
                              
                              {/* Эмодзи аватары */}
                              <div className="flex flex-wrap gap-1">
                                {AVATARS.slice(0, 6).map((a) => (
                                  <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAvatar(a)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
                                      avatar === a 
                                        ? 'bg-purple-100 ring-2 ring-purple-500' 
                                        : 'bg-gray-100 hover:bg-purple-50'
                                    }`}
                                  >
                                    {a}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        

                    <p className="text-xs text-muted-foreground bg-muted/50 dark:bg-muted/20 p-2.5 rounded-lg flex items-center gap-2">
                      <span>👶</span>
                      {t("authScreen.addChildLater")}
                    </p>
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
                  {mode === "register"
                    ? (isRegisterFinishDisabled
                      ? t("authScreen.submitFillRequired")
                      : isLoading
                        ? t("authScreen.submitLoading")
                        : t("authScreen.submitRegister"))
                    : (isLoading
                      ? t("authScreen.submitLoading")
                      : t("authScreen.submitLogin"))}
                </Button>

                {(mode === "login" || mode === "register") && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-600">{t("authScreen.or")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("google")}
                        disabled={isLoading}
                        aria-label={t("authScreen.oauth.google")}
                      >
                        <GoogleIcon className="h-5 w-5" />
                        <span className="sr-only">Google</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("github")}
                        disabled={isLoading}
                        aria-label={t("authScreen.oauth.github")}
                      >
                        <GitHubIcon className="h-5 w-5" />
                        <span className="sr-only">GitHub</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => submitOAuth("discord")}
                        disabled={isLoading}
                        aria-label={t("authScreen.oauth.discord")}
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
                    {mode === "login" ? t("authScreen.switchToRegister") : t("authScreen.switchToLogin")}
                  </button>
                </div>
              </form>
            </>
          )} 

          {mode === "forgot-password" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {t("auth.resetPassword")}
                </h2>
                <p className="text-sm text-gray-600 font-medium">{t("auth.forgotPasswordDescription")}</p>
              </div>

              <form className="space-y-4" onSubmit={submitForgotPassword}>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("auth.email")}</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
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
                  {isLoading ? t("authScreen.submitLoading") : t("auth.sendResetLink")}
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => { setError(null); setInfo(null); setMode("login") }}
                    className="text-primary hover:underline"
                  >
                    {t("auth.backToLogin")}
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
