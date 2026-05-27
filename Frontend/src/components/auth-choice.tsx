"use client"

import { useState } from "react"
import { ChevronLeft, Rocket, Sparkles, Star, Users, Zap } from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { authApi } from "@/features/auth/api/authApi"
import type { AuthSession } from "@/features/auth/types"

// Demo credentials (Family 1 – Ивановы)
const DEMO_PARENT_EMAIL    = "demo@familyquest.app"
const DEMO_CHILD_LOGIN     = "nikita_demo"   // UserName, no email for children
const DEMO_PASSWORD        = "Demo1234!"

interface AuthChoiceProps {
  onNewUser: () => void
  onExisting: () => void
  onBack: () => void
  onDemoAuth?: (session: AuthSession) => void
}

export default function AuthChoice({ onNewUser, onExisting, onBack, onDemoAuth }: AuthChoiceProps) {
  const { t } = useTranslation()
  const [demoLoading, setDemoLoading] = useState<"parent" | "child" | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  const handleDemoLogin = async (type: "parent" | "child") => {
    if (!onDemoAuth || demoLoading) return
    setDemoLoading(type)
    setDemoError(null)
    try {
      const session = await authApi.login({
        email: type === "parent" ? DEMO_PARENT_EMAIL : DEMO_CHILD_LOGIN,
        password: DEMO_PASSWORD,
      })
      onDemoAuth(session)
    } catch {
      setDemoError("Не удалось войти. Попробуйте ещё раз.")
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 40%, #a855f7 70%, #ec4899 100%)" }}
    >
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-30">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>

      {/* Back button */}
      <button onClick={onBack}
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
      >
        <ChevronLeft className="w-5 h-5" />
        {t("authChoice.back")}
      </button>

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)", top: "-10%", left: "-5%", animationDuration: "9s" }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #f0abfc, transparent)", bottom: "-5%", right: "-5%", animationDelay: "4s", animationDuration: "11s" }} />
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-auth-orb"
          style={{ background: "radial-gradient(circle, #bae6fd, transparent)", top: "30%", right: "8%", animationDelay: "2s", animationDuration: "7s" }} />
      </div>

      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { emoji: "⭐", style: { top: "10%", left: "6%",  animationDuration: "7s",  animationDelay: "0s"   } },
          { emoji: "🌟", style: { top: "8%",  right: "8%", animationDuration: "9s",  animationDelay: "1.5s" } },
          { emoji: "🏆", style: { top: "55%", left: "4%",  animationDuration: "8s",  animationDelay: "3s"   } },
          { emoji: "🎯", style: { top: "60%", right: "5%", animationDuration: "10s", animationDelay: "0.5s" } },
          { emoji: "✨", style: { top: "80%", left: "15%", animationDuration: "6s",  animationDelay: "2.5s" } },
          { emoji: "🚀", style: { top: "75%", right: "15%",animationDuration: "8.5s",animationDelay: "1s"   } },
        ].map((p, i) => (
          <div key={i} className="absolute text-2xl opacity-40 animate-float-gentle" style={p.style}>{p.emoji}</div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl animate-auth-slide-in" style={{ animationFillMode: "both" }}>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)" }}
          >
            <span className="text-4xl">🏠</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight mb-3">
            {t("authChoice.title")}
          </h1>
          <p className="text-lg text-white/80 font-medium">
            {t("authChoice.subtitle")}
          </p>
        </div>

        {/* ── Quick Demo Login ─────────────────────────────────── */}
        {onDemoAuth && (
          <div className="mb-6 relative overflow-hidden rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <p className="font-extrabold text-white text-base tracking-tight">Быстрый демо-вход</p>
                <span className="ml-auto text-xs text-white/60 font-medium">без ввода данных</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Demo Parent */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin("parent")}
                  disabled={demoLoading !== null}
                  className="group relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    boxShadow: "0 8px 24px -4px rgba(99,102,241,0.3)",
                  }}
                >
                  {demoLoading === "parent" ? (
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ background: "linear-gradient(135deg, #ede9fe, #fdf4ff)" }}>
                      😊
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-gray-800 leading-none">Алексей</p>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Родитель</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))" }} />
                </button>

                {/* Demo Child */}
                <button
                  type="button"
                  onClick={() => handleDemoLogin("child")}
                  disabled={demoLoading !== null}
                  className="group relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    boxShadow: "0 8px 24px -4px rgba(236,72,153,0.3)",
                  }}
                >
                  {demoLoading === "child" ? (
                    <div className="w-10 h-10 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ background: "linear-gradient(135deg, #fce7f3, #fdf4ff)" }}>
                      🤖
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-gray-800 leading-none">Никита</p>
                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Ребёнок · 10 лет</p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.06))" }} />
                </button>
              </div>

              {demoError && (
                <p className="mt-3 text-xs text-center text-red-200 font-medium">{demoError}</p>
              )}
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* New User card */}
          <button onClick={onNewUser}
            className="group relative overflow-hidden rounded-3xl text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 24px 48px -8px rgba(16,185,129,0.35), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)" }}
            />
            {/* Top accent bar */}
            <div className="h-1.5 w-full rounded-t-3xl" style={{ background: "linear-gradient(90deg, #10b981, #34d399)" }} />

            <div className="p-7">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                style={{ background: "linear-gradient(135deg, #10b981, #34d399)", boxShadow: "0 8px 20px -4px rgba(16,185,129,0.5)" }}
              >
                <Rocket className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {t("authChoice.newUser.title")}
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                {t("authChoice.newUser.description")}
              </p>

              {/* Bullet points */}
              <div className="space-y-2 mb-6">
                {[
                  t("authChoice.newUser.bullets.role"),
                  t("authChoice.newUser.bullets.profile"),
                  t("authChoice.newUser.bullets.family"),
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
                    >
                      <Star className="w-3 h-3 text-white" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-sm auth-btn-shine"
                style={{ background: "linear-gradient(135deg, #10b981, #34d399)", boxShadow: "0 6px 16px -4px rgba(16,185,129,0.5)" }}
              >
                <Sparkles className="w-4 h-4" />
                {t("authChoice.newUser.action")}
              </div>
            </div>
          </button>

          {/* Existing User card */}
          <button onClick={onExisting}
            className="group relative overflow-hidden rounded-3xl text-left transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 24px 48px -8px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)" }}
            />
            {/* Top accent bar */}
            <div className="h-1.5 w-full rounded-t-3xl" style={{ background: "linear-gradient(90deg, #6366f1, #a855f7)" }} />

            <div className="p-7">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 8px 20px -4px rgba(99,102,241,0.5)" }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {t("authChoice.existingUser.title")}
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                {t("authChoice.existingUser.description")}
              </p>

              {/* Bullet points */}
              <div className="space-y-2 mb-6">
                {[
                  t("authChoice.existingUser.bullets.credentials"),
                  t("authChoice.existingUser.bullets.profile"),
                  t("authChoice.existingUser.bullets.continue"),
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                    >
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    {b}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-sm auth-btn-shine"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 6px 16px -4px rgba(99,102,241,0.5)" }}
              >
                <Zap className="w-4 h-4" />
                {t("authChoice.existingUser.action")}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}