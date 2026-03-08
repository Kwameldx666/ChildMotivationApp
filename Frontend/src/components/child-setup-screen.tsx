"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Eye, EyeOff, Loader2, Sparkles } from "lucide-react"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { useTranslation } from "@/i18n/provider"
import { toast } from "sonner"
import type { AuthSession } from "@/features/auth/types"

interface ChildSetupScreenProps {
  session: AuthSession
  onComplete: (updatedSession: AuthSession) => void
  onLogout: () => void
}

const AVATARS = ["👦", "👧", "🧒", "🦄", "🐱", "🐶", "🦊", "🐻", "🐼", "🐸", "🐯", "🦁"]

const INTEREST_OPTIONS = [
  { key: "sports", emoji: "⚽" },
  { key: "music", emoji: "🎵" },
  { key: "art", emoji: "🎨" },
  { key: "reading", emoji: "📚" },
  { key: "gaming", emoji: "🎮" },
  { key: "science", emoji: "🔬" },
  { key: "cooking", emoji: "🍳" },
  { key: "animals", emoji: "🐾" },
  { key: "travel", emoji: "✈️" },
  { key: "technology", emoji: "💻" },
  { key: "dance", emoji: "💃" },
  { key: "nature", emoji: "🌿" },
]

export default function ChildSetupScreen({ session, onComplete, onLogout }: ChildSetupScreenProps) {
  const { t } = useTranslation()

  // Step: 1 = set password, 2 = pick avatar & interests
  const [step, setStep] = useState<1 | 2>(1)

  // Password fields
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)

  // Avatar & interests
  const [selectedAvatar, setSelectedAvatar] = useState(session.profile.avatar || "🧒")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPasswordValid =
    newPassword.length >= 6 &&
    newPassword === confirmPassword

  const toggleInterest = (key: string) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    )
  }

  const handlePasswordSubmit = async () => {
    if (!isPasswordValid || isSubmitting) return
    setError(null)
    setIsSubmitting(true)

    try {
      await authApi.completeChildSetup({
        newPassword,
      })
      toast.success(t("childSetup.passwordChanged"))
      setStep(2)
    } catch (err: any) {
      setError(mapApiError(err, t("childSetup.passwordError")))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      // Save avatar via profile update
      await authApi.updateProfile(session.user.id, {
        avatar: selectedAvatar,
      })
    } catch {
      // Non-critical — continue anyway
    } finally {
      setIsSubmitting(false)
    }

    // Clear the flag and proceed to dashboard
    const updatedSession: AuthSession = {
      ...session,
      mustChangePassword: false,
      profile: {
        ...session.profile,
        avatar: selectedAvatar,
      },
    }
    onComplete(updatedSession)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <CardContent className="pt-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-4xl">{step === 1 ? "🔐" : "✨"}</div>
            <h1 className="text-xl font-bold">
              {step === 1 ? t("childSetup.titlePassword") : t("childSetup.titlePersonalize")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? t("childSetup.subtitlePassword")
                : t("childSetup.subtitlePersonalize")}
            </p>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
          </div>

          {step === 1 ? (
            /* ─── Step 1: Change password ─── */
            <div className="space-y-4">
              {/* New password */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  {t("childSetup.newPassword")}
                </Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("childSetup.newPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-destructive mt-1">{t("childSetup.passwordTooShort")}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  {t("childSetup.confirmPassword")}
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("childSetup.confirmPasswordPlaceholder")}
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{t("childSetup.passwordsMismatch")}</p>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
              )}

              <Button
                className="w-full gap-2"
                onClick={handlePasswordSubmit}
                disabled={!isPasswordValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("childSetup.saving")}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t("childSetup.continue")}
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* ─── Step 2: Avatar & interests ─── */
            <div className="space-y-5">
              {/* Avatar picker */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("childSetup.chooseAvatar")}</Label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all
                        ${selectedAvatar === avatar
                          ? "bg-primary/20 ring-2 ring-primary scale-110"
                          : "bg-secondary/30 hover:bg-secondary/50"
                        }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests picker */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("childSetup.chooseInterests")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest.key}
                      onClick={() => toggleInterest(interest.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border
                        ${selectedInterests.includes(interest.key)
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-border text-muted-foreground hover:border-primary/30"
                        }`}
                    >
                      <span>{interest.emoji}</span>
                      <span className="truncate">{t(`childSetup.interests.${interest.key}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleFinish}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t("childSetup.finish")}
                  </>
                )}
              </Button>

              <button
                onClick={handleFinish}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("childSetup.skipForNow")}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
