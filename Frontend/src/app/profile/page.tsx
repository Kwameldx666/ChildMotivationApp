"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import { clearSession, selectAuthSession, setSession } from "@/features/auth/store/authSlice"
import { useQueryClient } from "@tanstack/react-query"
import type { UpdateProfilePayload } from "@/features/auth/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useTranslation } from "@/i18n/provider"
import { userSettingsService } from "@/services/user-settings-service"
import { authService } from "@/services/auth-service"
import { resolveAvatarUrl } from "@/lib/avatar-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, Camera, ChevronRight, Edit3, LogOut,
  Save, Shield, Trash2, Check, AlertTriangle, Sparkles,
  Lock, Mail, Eye, EyeOff, User, Heart,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"

type Section = "main" | "edit" | "account"

export default function ProfilePage() {
  const session = useAppSelector(selectAuthSession)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { t } = useTranslation()

  const [section, setSection] = useState<Section>("main")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [age, setAge] = useState("")

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Email change
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) { router.replace("/"); return }
    let cancelled = false
    const fetchProfile = async () => {
      try {
        const refreshed = await authApi.getProfile(userId)
        if (!cancelled) dispatch(setSession(refreshed))
      } catch (e) { console.error("[profile] refresh failed", e) }
    }
    fetchProfile()
    return () => { cancelled = true }
  }, [userId, router, dispatch])

  useEffect(() => {
    if (session) {
      setName(session.profile.name || "")
      setLastName(session.profile.lastName || "")
      setAge(session.profile.age?.toString() || "")
    }
  }, [session])

  const goDashboard = useCallback(() => {
    if (!session) { router.replace("/"); return }
    router.push(session.profile.role === "child" ? "/dashboard/child" : "/dashboard/parent")
  }, [session, router])

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      goDashboard()
    }
  }, [router, goDashboard])

  const profileQueryClient = useQueryClient()

  const handleLogout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    profileQueryClient.clear()
    dispatch(clearSession())
    router.replace("/")
  }, [dispatch, router, profileQueryClient])

  const handleSave = useCallback(async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const payload: UpdateProfilePayload = {
        name: name.trim() || null,
        lastName: lastName.trim() || null,
        age: age ? Number.parseInt(age) : null,
      }
      const updated = await authApi.updateProfile(userId, payload)
      dispatch(setSession(updated))
      setSaveSuccess(true)
      setTimeout(() => { setSaveSuccess(false); setSection("main") }, 1000)
    } catch (e) { console.error("save failed", e) }
    finally { setIsSaving(false) }
  }, [dispatch, userId, name, lastName, age])

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    setIsUploading(true)
    try {
      await authService.uploadAvatar(userId, file)
      const refreshed = await authApi.getProfile(userId)
      dispatch(setSession(refreshed))
    } catch (e) { console.error("avatar upload failed", e); setAvatarPreview(null) }
    finally { setIsUploading(false) }
  }

  const handleDelete = useCallback(async () => {
    await authApi.deleteAccount()
    userSettingsService.clearAllData()
    dispatch(clearSession())
    router.replace("/")
  }, [dispatch, router])

  const handleChangePassword = useCallback(async () => {
    setPasswordError("")
    if (!newPassword || !currentPassword) return
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profilePage.passwordMismatch") || "Passwords don't match")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError(t("profilePage.passwordTooShort") || "Min 6 characters")
      return
    }
    setPasswordSaving(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setPasswordSuccess(true)
      setTimeout(() => {
        setShowPasswordForm(false)
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
        setPasswordSuccess(false)
      }, 1500)
    } catch (e: unknown) {
      setPasswordError(mapApiError(e, t("profilePage.changePasswordError") || "Error"))
    } finally { setPasswordSaving(false) }
  }, [currentPassword, newPassword, confirmPassword, t])

  const handleChangeEmail = useCallback(async () => {
    setEmailError("")
    if (!newEmail || !emailPassword) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError(t("profilePage.invalidEmail") || "Invalid email")
      return
    }
    setEmailSaving(true)
    try {
      await authApi.changeEmail({ newEmail, password: emailPassword })
      setEmailSuccess(true)
      setTimeout(() => {
        setShowEmailForm(false)
        setNewEmail(""); setEmailPassword("")
        setEmailSuccess(false)
      }, 1500)
      const refreshed = await authApi.getProfile(userId!)
      dispatch(setSession(refreshed))
    } catch (e: unknown) {
      setEmailError(mapApiError(e, t("profilePage.changeEmailError") || "Error"))
    } finally { setEmailSaving(false) }
  }, [newEmail, emailPassword, userId, dispatch, t])

  if (!session) return null

  const profile = session.profile
  const user = session.user
  const avatarDisplay = avatarPreview || resolveAvatarUrl(profile.avatar)
  const isImage = avatarDisplay && (avatarDisplay.startsWith("http") || avatarDisplay.startsWith("data:"))
  const initials = `${(profile.name?.[0] || "").toUpperCase()}${(profile.lastName?.[0] || "").toUpperCase()}` || "?"
  const isChild = profile.role === "child"
  const roleLabel = isChild ? (t("common.child") || "Child") : (t("common.parent") || "Parent")

  // ─── Shared header — matches dashboard sticky headers ───
  const Header = ({ title, onBack, subtitle }: { title: string; onBack: () => void; subtitle?: string }) => (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-9 w-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold">{title}</span>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </header>
  )

  // ─── Shared avatar renderer ───
  const Avatar = ({ size = "lg", clickable = false }: { size?: "sm" | "lg"; clickable?: boolean }) => {
    const sz = size === "lg" ? "w-[88px] h-[88px]" : "w-16 h-16"
    const textSz = size === "lg" ? "text-4xl" : "text-2xl"
    const initialSz = size === "lg" ? "text-xl" : "text-sm"
    return (
      <div className="relative group">
        <div
          className={cn(
            sz, "rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/15 ring-offset-2 ring-offset-background shadow-lg transition-all duration-300",
            clickable && "cursor-pointer group-hover:ring-primary/40 group-hover:shadow-xl group-hover:scale-[1.03]"
          )}
          onClick={clickable ? handleAvatarPick : undefined}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          ) : isImage ? (
            <img src={avatarDisplay} alt="" className="w-full h-full object-cover" />
          ) : avatarDisplay ? (
            <span className={cn(textSz, "select-none")}>{avatarDisplay}</span>
          ) : (
            <span className={cn(initialSz, "font-bold text-muted-foreground")}>{initials}</span>
          )}
        </div>
        {clickable && (
          <button
            onClick={handleAvatarPick}
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  /* ═══════════ MAIN ═══════════ */
  if (section === "main") {
    return (
      <div className="min-h-screen bg-background">
        <Header title={t("profilePage.title")} onBack={goBack} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="max-w-md mx-auto px-4 py-6 space-y-5">

            {/* ── Profile card ── */}
            <div className="relative rounded-2xl bg-card border shadow-sm overflow-hidden">
              {/* Accent top bar matching dashboard style */}
              <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

              <div className="p-6 flex flex-col items-center gap-3">
                <div className="relative z-[1]">
                  <Avatar size="lg" clickable />
                </div>

                <div className="text-center space-y-0.5 relative z-[1]">
                  <h2 className="text-lg font-semibold">{profile.name} {profile.lastName}</h2>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>

              {/* Role & family pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium">
                  <Heart className="h-3 w-3" /> {roleLabel}
                </span>
                {session.family?.name && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    <User className="h-3 w-3" /> {session.family.name}
                  </span>
                )}
              </div>
            </div>

            {/* ── Quick actions ── */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/60">
              <ActionRow
                icon={<Edit3 className="h-4 w-4 text-blue-500" />}
                bg="bg-blue-500/10"
                label={t("profilePage.editProfile")}
                onClick={() => setSection("edit")}
              />
              <ActionRow
                icon={<Shield className="h-4 w-4 text-violet-500" />}
                bg="bg-violet-500/10"
                label={t("profilePage.accountSettings")}
                onClick={() => setSection("account")}
              />
            </div>

            {/* ── Preferences ── */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/60">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm">{t("profilePage.theme")}</span>
                <ThemeToggle />
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm">{t("profilePage.language")}</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* ── Logout ── */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-500 text-sm font-medium border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════ EDIT ═══════════ */
  if (section === "edit") {
    return (
      <div className="min-h-screen bg-background">
        <Header title={t("profilePage.editProfile")} onBack={() => setSection("main")} subtitle={t("profilePage.editProfileSub")} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="max-w-md mx-auto px-4 py-6 space-y-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Avatar size="sm" clickable />
              <span className="text-xs text-muted-foreground">{t("profilePage.tapToChange")}</span>
            </div>

            {/* Fields */}
            <div className="rounded-2xl border bg-card shadow-sm p-4 space-y-4">
              <Field label={t("profilePage.name")}>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("profilePage.enterName")} className="rounded-xl h-10" />
              </Field>
              <Field label={t("profilePage.lastName")}>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t("profilePage.enterLastName")} className="rounded-xl h-10" />
              </Field>
              {isChild && (
                <Field label={t("profilePage.age")}>
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="0" className="rounded-xl h-10" />
                </Field>
              )}
            </div>

            <Button className="w-full rounded-xl h-11 font-medium" disabled={isSaving} onClick={handleSave}>
              {saveSuccess ? (
                <span className="flex items-center gap-2"><Check className="h-4 w-4" /> {t("common.saved")}</span>
              ) : isSaving ? (
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> {t("common.saving")}</span>
              ) : (
                t("common.saveChanges")
              )}
            </Button>
          </div>
      </div>
    )
  }

  /* ═══════════ ACCOUNT ═══════════ */
  return (
    <div className="min-h-screen bg-background">
      <Header title={t("profilePage.accountSettings")} onBack={() => { setSection("main"); setShowDeleteConfirm(false) }} subtitle={t("profilePage.accountSettingsSub")} />

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

          {/* Info */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/60">
            <InfoRow label={t("profilePage.email")} value={user.email} />
            <InfoRow label={t("profilePage.role")} value={roleLabel} />
          </div>

          {/* Security */}
          <SectionLabel text={t("profilePage.security")} />

          {/* Change Password */}
          <Accordion
            icon={<Lock className="h-4 w-4" />}
            label={t("profilePage.changePassword")}
            open={showPasswordForm}
            onToggle={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(false) }}
          >
            <div className="space-y-3">
              <Field label={t("profilePage.currentPassword")}>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl h-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label={t("profilePage.newPassword")}>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl h-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label={t("profilePage.confirmNewPassword")}>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-10"
                />
              </Field>
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              <Button
                className="w-full rounded-xl h-10"
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                onClick={handleChangePassword}
              >
                {passwordSuccess ? (
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> {t("common.saved")}</span>
                ) : passwordSaving ? (
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> {t("common.saving")}</span>
                ) : (
                  t("profilePage.changePassword")
                )}
              </Button>
            </div>
          </Accordion>

          {/* Change Email */}
          <Accordion
            icon={<Mail className="h-4 w-4" />}
            label={t("profilePage.changeEmail")}
            open={showEmailForm}
            onToggle={() => { setShowEmailForm(!showEmailForm); setEmailError(""); setEmailSuccess(false) }}
          >
            <div className="space-y-3">
              <Field label={t("profilePage.newEmail")}>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="rounded-xl h-10"
                />
              </Field>
              <Field label={t("profilePage.confirmWithPassword")}>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-10"
                />
              </Field>
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              <Button
                className="w-full rounded-xl h-10"
                disabled={emailSaving || !newEmail || !emailPassword}
                onClick={handleChangeEmail}
              >
                {emailSuccess ? (
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> {t("common.saved")}</span>
                ) : emailSaving ? (
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> {t("common.saving")}</span>
                ) : (
                  t("profilePage.changeEmail")
                )}
              </Button>
            </div>
          </Accordion>

          {/* Danger */}
          <SectionLabel text={t("profilePage.dangerZone")} />
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/25 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              {t("profilePage.deleteAccount")}
            </button>
          ) : (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive/90 leading-snug">{t("profilePage.deleteConfirm")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDelete}>
                  {t("common.confirmDelete")}
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

/* ═══════════ Sub-components ═══════════ */

function ActionRow({ icon, bg, label, onClick }: { icon: React.ReactNode; bg: string; label: string; onClick: () => void }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors active:scale-[0.99]" onClick={onClick}>
      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", bg)}>{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </button>
  )
}

function Accordion({ icon, label, open, onToggle, children }: { icon: React.ReactNode; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors">
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground/40 transition-transform duration-200", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1 pt-1">{text}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-0.5">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm", mono && "font-mono tracking-wide")}>{value}</p>
    </div>
  )
}
