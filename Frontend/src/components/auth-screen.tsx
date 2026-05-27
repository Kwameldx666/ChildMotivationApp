"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import type { AuthSession, OAuthProvider, UserRole } from "@/features/auth/types"
import { authApi } from "@/features/auth/api/authApi"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Eye, EyeOff, Sparkles, Zap } from "lucide-react"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { openOAuthPopup } from "@/utils/oauth-popup"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"

// ── Demo credentials ──────────────────────────────────────────────────────────
const DEMO_PARENT_EMAIL = "demo@familyquest.app"
const DEMO_CHILD_LOGIN  = "nikita_demo"
const DEMO_PASSWORD     = "Demo1234!"

// ── Assets ───────────────────────────────────────────────────────────────────
const AVATARS        = ["🙂", "😎", "🤖", "🦊", "🐻", "🐼", "🐯", "🦁", "🐸", "🐵"] as const
const FAMILY_EMBLEMS = ["🏠", "🌟", "🍀", "🔥", "🎯", "💎", "🧩", "🚀"] as const

// Floating background particles
const PARTICLES = [
  { emoji: "⭐", x: "8%",  y: "15%", delay: "0s",    dur: "6s"  },
  { emoji: "🌟", x: "88%", y: "12%", delay: "1.2s",  dur: "7s"  },
  { emoji: "🎯", x: "5%",  y: "65%", delay: "2.4s",  dur: "8s"  },
  { emoji: "🏆", x: "92%", y: "72%", delay: "0.8s",  dur: "6.5s"},
  { emoji: "🎁", x: "78%", y: "38%", delay: "3s",    dur: "9s"  },
  { emoji: "✨", x: "22%", y: "85%", delay: "1.6s",  dur: "7.5s"},
  { emoji: "💎", x: "60%", y: "8%",  delay: "2s",    dur: "8.5s"},
  { emoji: "🚀", x: "15%", y: "42%", delay: "3.5s",  dur: "10s" },
]

// ── OAuth Icons ───────────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1-.02-1.97-3.2.7-3.88-1.38-3.88-1.38-.53-1.35-1.29-1.71-1.29-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.74.4-1.26.72-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.19a11 11 0 0 1 5.79 0c2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.77.11 3.06.74.81 1.19 1.85 1.19 3.11 0 4.43-2.69 5.41-5.25 5.69.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.13 0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.109 21.2a.077.077 0 0 0 .084-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface AuthScreenProps {
  onAuth: (session: AuthSession) => void
  onBack: () => void
  initialMode?: "login" | "register"
}

export default function AuthScreen({ onAuth, onBack, initialMode = "login" }: AuthScreenProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(initialMode)
  const [role, setRole] = useState<UserRole>("parent")

  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [showPass, setShowPass]   = useState(false)
  const [name, setName]           = useState("")
  const [lastName, setLastName]   = useState("")
  const [age, setAge]             = useState<string>("")
  const [avatar, setAvatar]       = useState<string>(AVATARS[0])
  const [familyName, setFamilyName]     = useState("")
  const [familyEmblem, setFamilyEmblem] = useState<(typeof FAMILY_EMBLEMS)[number]>(FAMILY_EMBLEMS[0])

  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [info, setInfo]             = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const [emailTouched, setEmailTouched]           = useState(false)
  const [nameTouched, setNameTouched]             = useState(false)
  const [lastNameTouched, setLastNameTouched]     = useState(false)
  const [familyNameTouched, setFamilyNameTouched] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMode(initialMode)
    setInfo(null)
  }, [initialMode])

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.removeItem("pendingJoinMode")
  }, [])

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const sanitizeAvatar = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed || trimmed.startsWith("data:")) return "👨"
    if (trimmed.length <= 256) return trimmed
    try {
      const p = new URL(trimmed); p.search = ""; p.hash = ""
      const n = p.toString()
      return n.length <= 256 ? n : "👨"
    } catch { return "👨" }
  }

  const isRegisterDisabled = useMemo(() => {
    if (mode !== "register" || isLoading) return true
    if (!email || !password || !isValidEmail(email)) return true
    if (!name.trim() || !lastName.trim() || !familyName.trim()) return true
    return false
  }, [mode, isLoading, email, password, name, lastName, familyName])

  const handleDemoLogin = async (type: "parent" | "child") => {
    setError(null); setIsLoading(true)
    try {
      const creds = type === "parent"
        ? { email: DEMO_PARENT_EMAIL, password: DEMO_PASSWORD }
        : { email: DEMO_CHILD_LOGIN,  password: DEMO_PASSWORD }
      const session = await authApi.login(creds)
      onAuth(session)
    } catch (err: any) {
      setError(mapApiError(err, "Ошибка демо-входа"))
    } finally {
      setIsLoading(false)
    }
  }

  const resolveOAuthProvider = (p: OAuthProvider) => {
    if (p === "google" || p === "github" || p === "discord") return p
    if (p === "microsoft") return "discord" as const
    throw new Error(t("authScreen.errors.oauthProviderUnavailable"))
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setInfo(null); setSubmitAttempted(true)
    if (!email || !password) { setError(t("authScreen.errors.loginEmailPasswordRequired")); return }
    setIsLoading(true)
    try { const session = await authApi.login({ email, password }); onAuth(session) }
    catch (err: any) { setError(mapApiError(err, t("authScreen.errors.loginFailed"))) }
    finally { setIsLoading(false) }
  }

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setInfo(null)
    if (!email || !isValidEmail(email)) { setError(t("auth.forgotPasswordEmailRequired")); return }
    setIsLoading(true)
    try { await authApi.forgotPassword(email); setInfo(t("auth.forgotPasswordSuccess")) }
    catch (err: any) {
      const code = err?.response?.data?.code ?? err?.response?.data?.Code ?? ""
      setError(code === "EmailNotConfirmed" ? t("auth.emailNotConfirmedError") : mapApiError(err, t("auth.forgotPasswordFailed")))
    }
    finally { setIsLoading(false) }
  }

  const submitOAuth = async (provider: OAuthProvider) => {
    setError(null); setIsLoading(true)
    try {
      const resolved = resolveOAuthProvider(provider)
      const { authorizationUrl } = await authApi.getOAuthAuthorization(resolved)
      if (!authorizationUrl) throw new Error("Authorization URL not provided")
      const result = await openOAuthPopup(authorizationUrl)
      if (result.status === "authenticated" && result.session) onAuth(result.session)
      else if (result.status === "pending") setError(t("authScreen.errors.oauthPending"))
      else if (result.status === "error") setError(result.error || t("authScreen.errors.oauthError"))
    } catch (err: any) {
      if (err.message?.includes("всплывающие окна")) setError(t("authScreen.errors.oauthPopupBlocked"))
      else if (err.message?.includes("закрыто")) setError(t("authScreen.errors.oauthCancelled"))
      else setError(mapApiError(err, t("authScreen.errors.oauthStartFailed")))
    }
    finally { setIsLoading(false) }
  }

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitAttempted(true)
    if (!email || !password) { setError(t("authScreen.errors.loginEmailPasswordRequired")); return }
    if (!isValidEmail(email)) { setError(t("authScreen.errors.emailInvalid")); return }
    if (password.length < 6) { setError(t("authScreen.errors.passwordTooShort")); return }
    if (!name.trim() || !lastName.trim()) { setError(t("authScreen.errors.nameLastNameRequired")); return }
    if (!familyName.trim()) { setError(t("authScreen.errors.familyNameRequired")); return }
    setIsLoading(true)
    try {
      await authApi.register({
        email, password, role: "parent",
        profile: { name: name.trim(), lastName: lastName.trim(), avatar: sanitizeAvatar(avatar) },
        family: { name: familyName.trim(), emblem: familyEmblem },
      })
      setInfo(t("authScreen.info.registerSuccessCheckEmail"))
      setMode("login"); setError(null); setSubmitAttempted(false)
      setEmailTouched(false); setNameTouched(false); setLastNameTouched(false); setFamilyNameTouched(false)
    }
    catch (err) { setError(mapApiError(err, t("authScreen.errors.registerFailed"))) }
    finally { setIsLoading(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 35%, #a855f7 65%, #ec4899 100%)" }}
    >
      {/* Language + Back */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      {/* Floating ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-80 h-80 rounded-full opacity-20 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)", top: "-5%", left: "-8%", animationDelay: "0s" }} />
        <div className="absolute w-96 h-96 rounded-full opacity-15 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #f0abfc, transparent)", bottom: "-10%", right: "-10%", animationDelay: "3s", animationDuration: "10s" }} />
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #bae6fd, transparent)", top: "40%", right: "5%", animationDelay: "1.5s", animationDuration: "7s" }} />
      </div>

      {/* Floating emoji particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p, i) => (
          <div key={i} className="absolute text-2xl select-none"
            style={{
              left: p.x, bottom: "0",
              animation: `auth-emoji-float ${p.dur} ${p.delay} ease-in-out infinite`,
              opacity: 0.35,
              filter: "blur(0.5px)",
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Card */}
      <div ref={cardRef}
        className="relative z-10 w-full max-w-md animate-auth-slide-in"
        style={{ animationFillMode: "both" }}
      >
        {/* Glassmorphism card */}
        <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden"
          style={{ boxShadow: "0 32px 64px -12px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.9)" }}
        >
          {/* Top gradient bar */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #6366f1, #a855f7, #ec4899)" }} />

          <div className="p-8">
            {/* App branding */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                <span className="text-3xl">🏆</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                FamilyQuest
              </h1>
            </div>

            {/* ── LOGIN / REGISTER modes ─────────────────────────────── */}
            {(mode === "login" || mode === "register") && (
              <>
                {/* Mode tabs */}
                <div className="flex rounded-2xl p-1 mb-6"
                  style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)" }}
                >
                  {(["login", "register"] as const).map((m) => (
                    <button key={m} type="button"
                      onClick={() => { setError(null); setInfo(null); setMode(m) }}
                      className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={mode === m ? {
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        color: "#fff",
                        boxShadow: "0 4px 12px -2px rgba(99,102,241,0.4)"
                      } : { color: "#6b7280" }}
                    >
                      {m === "login" ? t("auth.signIn") : t("auth.signUp")}
                    </button>
                  ))}
                </div>

                {/* Demo quick-login panel (only in login mode) */}
                {mode === "login" && (
                  <div className="mb-5 rounded-2xl border-2 border-dashed p-3 animate-auth-demo-pulse"
                    style={{ borderColor: "#a855f7", background: "linear-gradient(135deg, #faf5ff, #fdf4ff)" }}
                  >
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide text-center mb-2.5 flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Быстрый демо-вход
                      <Sparkles className="w-3.5 h-3.5" />
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleDemoLogin("parent")} disabled={isLoading}
                        className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 12px -2px rgba(99,102,241,0.45)" }}
                      >
                        <span className="text-xl">😊</span>
                        <span className="text-xs font-bold text-white leading-tight">Алексей</span>
                        <span className="text-[10px] text-white/70 leading-tight">Родитель</span>
                      </button>
                      <button type="button" onClick={() => handleDemoLogin("child")} disabled={isLoading}
                        className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 12px -2px rgba(16,185,129,0.45)" }}
                      >
                        <span className="text-xl">🤖</span>
                        <span className="text-xs font-bold text-white leading-tight">Никита</span>
                        <span className="text-[10px] text-white/70 leading-tight">Ребёнок · 10 лет</span>
                      </button>
                    </div>
                  </div>
                )}

                <form className="space-y-4" onSubmit={mode === "login" ? submitLogin : submitRegister}>
                  {/* Email */}
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      {mode === "login" ? t("auth.emailOrLogin") : t("auth.email")}
                    </Label>
                    <Input
                      type={mode === "login" ? "text" : "email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder={mode === "login" ? t("auth.emailOrLoginPlaceholder") : "you@example.com"}
                      className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900 placeholder:text-gray-400 transition-all"
                    />
                    {mode === "register" && (emailTouched || submitAttempted) && !isValidEmail(email) && (
                      <p className="text-xs text-red-500 mt-1">{t("authScreen.errors.emailInvalid")}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      {t("auth.password")}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900 pr-11 transition-all"
                      />
                      <button type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === "login" && (
                      <div className="text-right mt-1">
                        <button type="button"
                          onClick={() => { setError(null); setInfo(null); setMode("forgot-password") }}
                          className="text-xs font-medium text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Register-only fields */}
                  {mode === "register" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{t("authScreen.firstName")}</Label>
                          <Input required value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => setNameTouched(true)}
                            aria-invalid={(nameTouched || submitAttempted) && !name.trim()}
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                          />
                          {(nameTouched || submitAttempted) && !name.trim() && (
                            <p className="text-xs text-red-500 mt-1">{t("authScreen.requiredField")}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{t("authScreen.lastName")}</Label>
                          <Input required value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onBlur={() => setLastNameTouched(true)}
                            aria-invalid={(lastNameTouched || submitAttempted) && !lastName.trim()}
                            className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                          />
                          {(lastNameTouched || submitAttempted) && !lastName.trim() && (
                            <p className="text-xs text-red-500 mt-1">{t("authScreen.requiredField")}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{t("authScreen.familyName")}</Label>
                        <Input required value={familyName}
                          onChange={(e) => setFamilyName(e.target.value)}
                          onBlur={() => setFamilyNameTouched(true)}
                          aria-invalid={(familyNameTouched || submitAttempted) && !familyName.trim()}
                          className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900"
                        />
                        {(familyNameTouched || submitAttempted) && !familyName.trim() && (
                          <p className="text-xs text-red-500 mt-1">{t("authScreen.requiredField")}</p>
                        )}
                      </div>

                      {/* Avatar picker */}
                      <div>
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{t("authScreen.avatar")}</Label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl border-2 border-purple-200 bg-purple-50 flex items-center justify-center flex-shrink-0">
                            {avatar.startsWith("data:") ? (
                              <img src={avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <span className="text-2xl">{avatar}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {AVATARS.slice(0, 7).map((a) => (
                              <button key={a} type="button" onClick={() => setAvatar(a)}
                                className="w-8 h-8 rounded-xl text-lg flex items-center justify-center transition-all"
                                style={avatar === a ? {
                                  background: "linear-gradient(135deg, #ede9fe, #fce7f3)",
                                  outline: "2px solid #a855f7",
                                  outlineOffset: "1px"
                                } : { background: "#f3f4f6" }}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Family emblem */}
                      <div>
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Эмблема семьи</Label>
                        <div className="flex gap-2 flex-wrap">
                          {FAMILY_EMBLEMS.map((e) => (
                            <button key={e} type="button" onClick={() => setFamilyEmblem(e)}
                              className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                              style={familyEmblem === e ? {
                                background: "linear-gradient(135deg, #ede9fe, #fce7f3)",
                                outline: "2px solid #a855f7",
                                outlineOffset: "1px",
                              } : { background: "#f3f4f6" }}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                        <span>👶</span>
                        {t("authScreen.addChildLater")}
                      </p>
                    </>
                  )}

                  {/* Error / Info */}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl whitespace-pre-line animate-auth-fade-in">
                      {error}
                    </div>
                  )}
                  {info && !error && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl animate-auth-fade-in">
                      {info}
                    </div>
                  )}

                  {/* Submit button */}
                  <button type="submit"
                    disabled={mode === "register" ? isRegisterDisabled : isLoading}
                    className="auth-btn-shine w-full h-12 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)", boxShadow: "0 8px 24px -4px rgba(139,92,246,0.5)" }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {t("authScreen.submitLoading")}
                      </span>
                    ) : mode === "register"
                      ? (isRegisterDisabled ? t("authScreen.submitFillRequired") : t("authScreen.submitRegister"))
                      : t("authScreen.submitLogin")
                    }
                  </button>

                  {/* OAuth divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {t("authScreen.or")}
                      </span>
                    </div>
                  </div>

                  {/* OAuth buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { provider: "google" as OAuthProvider, icon: <GoogleIcon className="w-5 h-5" />, label: "Google" },
                      { provider: "github" as OAuthProvider, icon: <GitHubIcon className="w-5 h-5" />, label: "GitHub" },
                      { provider: "discord" as OAuthProvider, icon: <DiscordIcon className="w-5 h-5" />, label: "Discord" },
                    ]).map(({ provider, icon, label }) => (
                      <button key={provider} type="button"
                        onClick={() => submitOAuth(provider)}
                        disabled={isLoading}
                        aria-label={label}
                        className="h-11 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  {/* Mode switch */}
                  <p className="text-center text-sm text-gray-500">
                    <button type="button"
                      onClick={() => { setError(null); setMode(mode === "login" ? "register" : "login") }}
                      className="font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                    >
                      {mode === "login" ? t("authScreen.switchToRegister") : t("authScreen.switchToLogin")}
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD mode ──────────────────────────────── */}
            {mode === "forgot-password" && (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
                  >
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{t("auth.resetPassword")}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t("auth.forgotPasswordDescription")}</p>
                </div>
                <form className="space-y-4" onSubmit={submitForgotPassword}>
                  <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{t("auth.email")}</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white"
                    />
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">{error}</div>}
                  {info && !error && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">{info}</div>}
                  <button type="submit" disabled={isLoading}
                    className="auth-btn-shine w-full h-12 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 8px 24px -4px rgba(139,92,246,0.5)" }}
                  >
                    {isLoading ? t("authScreen.submitLoading") : t("auth.sendResetLink")}
                  </button>
                  <p className="text-center text-sm">
                    <button type="button"
                      onClick={() => { setError(null); setInfo(null); setMode("login") }}
                      className="font-semibold text-purple-600 hover:underline"
                    >
                      {t("auth.backToLogin")}
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}