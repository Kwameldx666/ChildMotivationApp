"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Sparkles, Users, UserCircle, Home, Zap } from "lucide-react"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { openOAuthPopup } from "@/utils/oauth-popup"
import { useTranslation } from "@/i18n/provider"

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

const AVATARS = [
  "👨",
  "👩",
  "🧑",
  "👦",
  "👧",
  "👶",
  "👨‍🦰",
  "👩‍🦰",
  "👨‍🦱",
  "👩‍🦱",
  "👨‍🦳",
  "👩‍🦳",
  "🧒",
  "👱",
  "👴",
  "👵",
  "🧔",
  "🧑‍🦲",
  "👨‍🦲",
  "👩‍🦲",
]

const FAMILY_EMBLEMS = ["🏰", "🏡", "🌟", "⭐", "🌈", "🦄", "🐉", "🦅", "🌲", "🌊"]

// AI_SUGGESTIONS keys are resolved via t() inside the component

interface AuthScreenProps {
  onAuth: (userData: {
    user: { email: string; name: string; lastName: string; id: string }
    profile: { name: string; lastName: string; avatar: string; role: "parent" | "child"; age?: number }
    familyCode?: string
    familyName?: string
    familyEmblem?: string
  }) => void
  onBack: () => void
}

export function AuthScreenEnhanced({ onAuth, onBack }: AuthScreenProps) {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState<"credentials" | "role" | "parent-family" | "child-profile" | "demo">("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"parent" | "child" | null>(null)

  // Child-specific fields
  const [childName, setChildName] = useState("")
  const [childLastName, setChildLastName] = useState("")
  const [childAge, setChildAge] = useState(10)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [childFamilyCode, setChildFamilyCode] = useState("")

  // Parent-specific fields
  const [familyName, setFamilyName] = useState("")
  const [selectedEmblem, setSelectedEmblem] = useState(FAMILY_EMBLEMS[0])
  const [showAINames, setShowAINames] = useState(false)

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Client-side disabled flags for quicker UX feedback
  const isParentCreateDisabled = isLoading || !familyName.trim()
  const isChildProfileDisabled = isLoading || !childName.trim() || !childFamilyCode.trim()

  const resolveProvider = (provider: 'google' | 'github' | 'microsoft' | 'discord'): 'google' | 'github' | 'microsoft' | 'discord' => {
    if (provider === 'microsoft') {
      return 'discord'
    }
    return provider
  }

  // CHANGE: Added demo mode
  const submitOAuth = async (provider: 'google' | 'github' | 'microsoft' | 'discord') => {
    setError("")
    setIsLoading(true)

    try {
      const resolvedProvider = resolveProvider(provider)
      const { authorizationUrl } = await authApi.getOAuthAuthorization(resolvedProvider)
      if (!authorizationUrl) throw new Error('Authorization URL not provided')
      
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
    } catch (err: any) {
      if (err.message?.includes('всплывающие окна')) {
        setError(t("authScreen.errors.oauthPopupBlocked"))
      } else if (err.message?.includes('закрыто')) {
        setError(t("authScreen.errors.oauthCancelled"))
      } else {
        setError(mapApiError(err, t("authScreen.errors.oauthStartFailed")))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    const demoUser = {
      id: "demo-user-" + Date.now(),
      email: "demo@familytask.com",
      name: t("authScreen.demo.name"),
      lastName: t("authScreen.demo.lastName"),
    }

    localStorage.setItem("familyapp_current_user", JSON.stringify(demoUser))
    localStorage.setItem(
      `familyapp_profile_${demoUser.id}`,
      JSON.stringify({
        name: t("authScreen.demo.name"),
        lastName: t("authScreen.demo.lastName"),
        avatar: "🧑",
        role: "child",
        age: 12,
      }),
    )
    localStorage.setItem(
      `familyapp_family_${demoUser.id}`,
      JSON.stringify({
        code: "DEMO12",
        name: t("authScreen.demo.familyName"),
        emblem: "🏰",
      }),
    )

    onAuth({
      user: demoUser,
      profile: {
        name: t("authScreen.demo.name"),
        lastName: t("authScreen.demo.lastName"),
        avatar: "🧑",
        role: "child",
        age: 12,
      },
      familyCode: "DEMO12",
      familyName: t("authScreen.demo.familyName"),
      familyEmblem: "🏰",
    })
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError(t("authScreen.errors.loginEmailPasswordRequired"))
      return
    }

    if (password.length < 6) {
      setError(t("authScreen.errors.passwordTooShort"))
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    if (!isLogin) {
      setStep("role")
    } else {
      // CHANGE: Demo check
      if (email === "demo@example.com" && password === "demo123") {
        handleDemoMode()
        return
      }

      // Login logic
      const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
      const user = users.find((u: any) => u.email === email && u.password === password)

      if (user) {
        localStorage.setItem("familyapp_current_user", JSON.stringify(user))
        const profile = JSON.parse(localStorage.getItem(`familyapp_profile_${user.id}`) || "{}")
        const familyData = JSON.parse(localStorage.getItem(`familyapp_family_${user.id}`) || "{}")

        onAuth({
          user,
          profile,
          familyCode: familyData.code,
          familyName: familyData.name,
          familyEmblem: familyData.emblem,
        })
      } else {
        setError(t("auth.invalidCredentials"))
      }
    }
  }

  const handleRoleSubmit = () => {
    if (!role) {
      setError(t("authScreen.errors.roleRequired"))
      return
    }

    setError("")

    if (role === "parent") {
      setStep("parent-family")
    } else {
      setStep("child-profile")
    }
  }

  const handleParentFamilySubmit = async () => {
    if (!familyName) {
      setError(t("authScreen.errors.familyNameRequired"))
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    const userId = "user-" + Date.now()
    const newUser = { id: userId, email, password, name: email.split("@")[0], lastName: "" }
    const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
    users.push(newUser)
    localStorage.setItem("familyapp_users", JSON.stringify(users))
    localStorage.setItem("familyapp_current_user", JSON.stringify(newUser))

    const generatedFamilyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    localStorage.setItem(
      `familyapp_profile_${userId}`,
      JSON.stringify({
        name: email.split("@")[0],
        lastName: "",
        avatar: "👨",
        role: "parent",
      }),
    )
    localStorage.setItem(
      `familyapp_family_${userId}`,
      JSON.stringify({ code: generatedFamilyCode, name: familyName, emblem: selectedEmblem }),
    )

    onAuth({
      user: newUser,
      profile: {
        name: email.split("@")[0],
        lastName: "",
        avatar: "👨",
        role: "parent",
      },
      familyCode: generatedFamilyCode,
      familyName,
      familyEmblem: selectedEmblem,
    })
  }

  const handleChildProfileSubmit = async () => {
    if (!childName || !childFamilyCode) {
      setError(t("authScreen.errors.nameLastNameRequired"))
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsLoading(false)

    // Verify family code (simplified - in production should check database)
    const userId = "user-" + Date.now()
    const newUser = { id: userId, email, password, name: childName, lastName: childLastName }
    const users = JSON.parse(localStorage.getItem("familyapp_users") || "[]")
    users.push(newUser)
    localStorage.setItem("familyapp_users", JSON.stringify(users))
    localStorage.setItem("familyapp_current_user", JSON.stringify(newUser))

    localStorage.setItem(
      `familyapp_profile_${userId}`,
      JSON.stringify({
        name: childName,
        lastName: childLastName,
        avatar: selectedAvatar,
        role: "child",
        age: childAge,
      }),
    )
    localStorage.setItem(`familyapp_family_${userId}`, JSON.stringify({ code: childFamilyCode }))

    onAuth({
      user: newUser,
      profile: {
        name: childName,
        lastName: childLastName,
        avatar: selectedAvatar,
        role: "child",
        age: childAge,
      },
      familyCode: childFamilyCode,
    })
  }

  // CHANGE: Credentials step with demo button
  if (step === "credentials") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50 relative z-10">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="mb-6 bg-white/80 hover:bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-800 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{isLogin ? t("auth.signIn") : t("auth.signUp")}</h2>
              <p className="text-sm font-medium text-gray-700">
                {isLogin ? t("authScreen.welcomeBack") : t("authScreen.startAdventure")}
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-800">{t("auth.password")}</Label>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("authScreen.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-600 mt-1">{t("authScreen.hints.password")}</p>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary" disabled={isLoading}>
                {isLoading ? t("authScreen.submitLoading") : isLogin ? t("authScreen.submitLogin") : t("authScreen.submitRegister")}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-600">{t("authScreen.or")}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button type="button" variant="outline" onClick={() => submitOAuth('google')} className="bg-transparent">
                <GoogleIcon className="h-5 w-5" />
                <span className="sr-only">Google</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => submitOAuth('github')} className="bg-transparent">
                <GitHubIcon className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => submitOAuth('discord')} className="bg-transparent">
                <DiscordIcon className="h-5 w-5" />
                <span className="sr-only">Discord</span>
              </Button>
            </div>

            {/* CHANGE: Demo mode button */}
            <Button onClick={handleDemoMode} variant="outline" className="w-full mb-4 bg-transparent">
              <Zap className="mr-2 h-4 w-4" />
              {t("authScreen.tryDemo")}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-700">
                {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError("")
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? t("authScreen.switchCreate") : t("authScreen.switchLogin")}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Role selection with AI suggestion
  if (step === "role") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50 relative z-10">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setStep("credentials")} 
              className="mb-6 bg-white/80 hover:bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-800 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t("authScreen.chooseRole")}</h2>
              <div className="bg-blue-100 p-3 rounded-lg mb-4 flex items-start gap-2 border border-blue-200">
                <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-sm text-blue-900 font-medium">{t("authScreen.hints.role")}</p>
              </div>
              <p className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">{t("authScreen.roleWarning")}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => setRole("parent")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === "parent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="font-bold mb-2 text-gray-900">{t("authScreen.roles.parent")}</h3>
                <p className="text-xs text-gray-700">
                  {t("authScreen.roles.parentDesc")}
                </p>
              </button>

              <button
                onClick={() => setRole("child")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  role === "child" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <UserCircle className="w-12 h-12 mx-auto mb-3 text-secondary" />
                <h3 className="font-bold mb-2 text-gray-900">{t("authScreen.roles.child")}</h3>
                <p className="text-xs text-gray-700">{t("authScreen.roles.childDesc")}</p>
              </button>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded mb-4">{error}</div>}

            <Button onClick={handleRoleSubmit} className="w-full bg-gradient-to-r from-primary to-secondary">
              {t("authScreen.continue")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Parent family creation with AI name suggestions
  if (step === "parent-family") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50 relative z-10">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setStep("credentials")} 
              className="mb-6 bg-white/80 hover:bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-800 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Home className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t("authScreen.createFamily")}</h2>
              <p className="text-sm font-medium text-gray-700">{t("authScreen.createFamilySubtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-semibold text-gray-800">{t("authScreen.familyName")}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAINames(!showAINames)}
                    className="h-auto py-0"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </Button>
                </div>
                <Input 
                  required 
                  aria-invalid={!familyName.trim()} 
                  placeholder={t("authScreen.familyNamePlaceholder")} 
                  value={familyName} 
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
                {!familyName.trim() && <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>}

                {showAINames && (
                  <div className="mt-2 space-y-1">
                    {[t("authScreen.hints.familyName0"), t("authScreen.hints.familyName1"), t("authScreen.hints.familyName2"), t("authScreen.hints.familyName3"), t("authScreen.hints.familyName4")].map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setFamilyName(name)
                          setShowAINames(false)
                        }}
                        className="block w-full text-left text-xs p-2 rounded hover:bg-primary/10 text-primary"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button
                onClick={handleParentFamilySubmit}
                className="w-full bg-gradient-to-r from-primary to-secondary"
                disabled={isParentCreateDisabled}
              >
                {isParentCreateDisabled ? t("authScreen.submitFamilyNameRequired") : isLoading ? t("authScreen.submitCreating") : t("authScreen.submitCreateFamily")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // CHANGE: Child profile with age wheel selector
  if (step === "child-profile") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl border-2 border-white/50 relative z-10">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setStep("role")} 
              className="mb-6 bg-white/80 hover:bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-800 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-purple-200">
                <div className="text-5xl">{selectedAvatar}</div>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{t("authScreen.createProfile")}</h2>
              <p className="text-sm font-medium text-gray-700">{t("authScreen.createProfileSubtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.firstName")}</Label>
                <Input 
                  required 
                  aria-invalid={!childName.trim()} 
                  placeholder={t("authScreen.firstNamePlaceholder")} 
                  value={childName} 
                  onChange={(e) => setChildName(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
                {!childName.trim() && <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>}
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.lastName")}</Label>
                <Input 
                  placeholder={t("authScreen.lastNamePlaceholder")} 
                  value={childLastName} 
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.age")}</Label>
                <div className="pt-2 pb-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-purple-600">{childAge}</span>
                    <span className="text-xs text-gray-500">{t("authScreen.years")}</span>
                  </div>
                  <Slider
                    min={5}
                    max={16}
                    step={1}
                    value={[childAge]}
                    onValueChange={(vals) => setChildAge(vals[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">5</span>
                    <span className="text-xs text-gray-500">16</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.avatar")}</Label>
                <div className="flex items-center gap-3">
                  {/* Превью аватара */}
                  <div className="w-16 h-16 rounded-full border-2 border-purple-300 flex items-center justify-center overflow-hidden bg-purple-50 flex-shrink-0">
                    {selectedAvatar.startsWith('data:') ? (
                      <img src={selectedAvatar} alt={t("authScreen.avatarAlt")} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{selectedAvatar}</span>
                    )}
                  </div>
                  
                  {/* Кнопка загрузки */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-upload-child"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          const result = reader.result as string | null
                          if (result) setSelectedAvatar(result)
                        }
                        reader.readAsDataURL(f)
                      }}
                    />
                    <label
                      htmlFor="avatar-upload-child"
                      className="w-full h-10 px-4 py-2 bg-white border-2 border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 font-semibold rounded-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{t("authScreen.uploadPhoto")}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authScreen.familyCode")}</Label>
                <Input
                  required
                  aria-invalid={!childFamilyCode.trim()}
                  placeholder="ABC123"
                  value={childFamilyCode}
                  onChange={(e) => setChildFamilyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="bg-white border-2 border-gray-300 focus:border-purple-500 text-gray-900 placeholder:text-gray-500"
                />
                {!childFamilyCode.trim() && <p className="text-xs text-destructive mt-1">{t("authScreen.requiredField")}</p>}
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <Button
                onClick={handleChildProfileSubmit}
                className="w-full bg-linear-to-r from-primary to-secondary"
                disabled={isChildProfileDisabled}
              >
                {isChildProfileDisabled ? t("authScreen.submitFillRequired") : isLoading ? t("authScreen.submitJoining") : t("authScreen.submitJoinFamily")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
