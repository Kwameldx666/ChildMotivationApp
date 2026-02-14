"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { clearSession, selectAuthSession, setSession } from "@/features/auth/store/authSlice"
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
  Save, Shield, Trash2, X, Check, AlertTriangle, Sparkles,
  Lock, Mail, Eye, EyeOff,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"

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

  const handleLogout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    dispatch(clearSession())
    router.replace("/")
  }, [dispatch, router])

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
      const msg = e instanceof Error ? e.message : "Error"
      setPasswordError(msg)
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
      const msg = e instanceof Error ? e.message : "Error"
      setEmailError(msg)
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
  const roleEmoji = isChild ? "🌟" : "👑"

  /* ═══════════ MAIN ═══════════ */
  if (section === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/8 via-background to-background flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background/60 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={goDashboard} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold">{t("profilePage.title")}</span>
          <div className="w-9" />
        </header>

        <div className="flex-1 overflow-auto pb-8">
          <div className="max-w-md mx-auto px-5 space-y-5">

            {/* Hero card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-primary/15 via-primary/8 to-transparent border border-primary/10 p-6 pt-8 flex flex-col items-center gap-4 overflow-hidden shadow-lg shadow-primary/5">
              {/* Decorative blobs */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-primary/15 text-xs font-medium text-primary shadow-sm">
                <span>{roleEmoji}</span> {roleLabel}
              </div>
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full ring-[3px] ring-primary/25 ring-offset-[3px] ring-offset-background overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:ring-primary/50 transition-all duration-300 hover:scale-105 shadow-xl shadow-primary/10"
                  onClick={handleAvatarPick}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary border-t-transparent" />
                  ) : isImage ? (
                    <img src={avatarDisplay} alt="" className="w-full h-full object-cover" />
                  ) : avatarDisplay ? (
                    <span className="text-4xl select-none">{avatarDisplay}</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{initials}</span>
                  )}
                </div>
                <button
                  onClick={handleAvatarPick}
                  className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold leading-tight">{profile.name} {profile.lastName}</h2>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              {/* Mini stats row */}
              <div className="flex gap-3 w-full mt-1">
                {session.family?.name && (
                  <div className="flex-1 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("profilePage.family")}</p>
                    <p className="text-sm font-semibold truncate">{session.family.name}</p>
                  </div>
                )}
                {session.family?.code && (
                  <div className="flex-1 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("profilePage.code")}</p>
                    <p className="text-sm font-mono font-semibold tracking-wide">{session.family.code}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y">
              <MenuItem
                icon={<div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Edit3 className="h-[18px] w-[18px] text-blue-500" /></div>}
                label={t("profilePage.editProfile")}
                sublabel={t("profilePage.editProfileSub") || ""}
                onClick={() => setSection("edit")}
              />
              <MenuItem
                icon={<div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center"><Shield className="h-[18px] w-[18px] text-violet-500" /></div>}
                label={t("profilePage.accountSettings")}
                sublabel={t("profilePage.accountSettingsSub") || ""}
                onClick={() => setSection("account")}
              />
            </div>

            {/* Appearance */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm">{t("profilePage.theme")}</span>
                <ThemeToggle />
              </div>
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <span className="text-sm">{t("profilePage.language")}</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors active:scale-[0.98]"
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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background/60 backdrop-blur-md border-b">
          <Button variant="ghost" size="icon" onClick={() => setSection("main")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold">{t("profilePage.editProfile")}</span>
          <Button
            variant="ghost"
            size="icon"
            disabled={isSaving}
            onClick={handleSave}
            className={`rounded-full ${saveSuccess ? "text-green-500" : ""}`}
          >
            {saveSuccess ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          </Button>
        </header>

        <div className="flex-1 overflow-auto pb-8">
          <div className="max-w-md mx-auto px-5 py-6 space-y-6">
            {/* Avatar mini */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full ring-2 ring-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleAvatarPick}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  ) : isImage ? (
                    <img src={avatarDisplay} alt="" className="w-full h-full object-cover" />
                  ) : avatarDisplay ? (
                    <span className="text-3xl select-none">{avatarDisplay}</span>
                  ) : (
                    <span className="font-bold text-muted-foreground">{initials}</span>
                  )}
                </div>
                <button
                  onClick={handleAvatarPick}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{t("profilePage.tapToChange")}</span>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <Field label={t("profilePage.name")}>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("profilePage.enterName")} className="rounded-xl" />
              </Field>
              <Field label={t("profilePage.lastName")}>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t("profilePage.enterLastName")} className="rounded-xl" />
              </Field>
              {isChild && (
                <Field label={t("profilePage.age")}>
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="0" className="rounded-xl" />
                </Field>
              )}
            </div>

            <Button className="w-full rounded-xl h-11" disabled={isSaving} onClick={handleSave}>
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
      </div>
    )
  }

  /* ═══════════ ACCOUNT ═══════════ */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background/60 backdrop-blur-md border-b">
        <Button variant="ghost" size="icon" onClick={() => { setSection("main"); setShowDeleteConfirm(false) }} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-semibold">{t("profilePage.accountSettings")}</span>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-auto pb-8">
        <div className="max-w-md mx-auto px-5 py-6 space-y-6">

          {/* Info card */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y">
            <InfoRow label={t("profilePage.email")} value={user.email} />
            <InfoRow label={t("profilePage.role")} value={`${roleEmoji} ${roleLabel}`} />
            {session.family?.code && (
              <InfoRow label={t("profilePage.familyCode")} value={session.family.code} mono />
            )}
          </div>

          {/* Security section */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
              {t("profilePage.security")}
            </p>

            {/* Change Password */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(false) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
              >
                <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{t("profilePage.changePassword")}</span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground/50 transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
              </button>
              {showPasswordForm && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Field label={t("profilePage.currentPassword")}>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl pr-10"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                        className="rounded-xl pr-10"
                      />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                      className="rounded-xl"
                    />
                  </Field>
                  {passwordError && (
                    <p className="text-xs text-destructive px-1">{passwordError}</p>
                  )}
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
              )}
            </div>

            {/* Change Email */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => { setShowEmailForm(!showEmailForm); setEmailError(""); setEmailSuccess(false) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
              >
                <Mail className="h-[18px] w-[18px] text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{t("profilePage.changeEmail")}</span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground/50 transition-transform ${showEmailForm ? "rotate-90" : ""}`} />
              </button>
              {showEmailForm && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Field label={t("profilePage.newEmail")}>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="rounded-xl"
                    />
                  </Field>
                  <Field label={t("profilePage.confirmWithPassword")}>
                    <Input
                      type="password"
                      value={emailPassword}
                      onChange={e => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl"
                    />
                  </Field>
                  {emailError && (
                    <p className="text-xs text-destructive px-1">{emailError}</p>
                  )}
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
              )}
            </div>
          </div>

          {/* Danger */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
              {t("profilePage.dangerZone")}
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                {t("profilePage.deleteAccount")}
              </button>
            ) : (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive/90 leading-snug">
                    {t("profilePage.deleteConfirm")}
                  </p>
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
      </div>
    </div>
  )
}

/* ═══════════ Sub-components ═══════════ */

function MenuItem({ icon, label, sublabel, onClick }: { icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors active:bg-muted active:scale-[0.99]"
      onClick={onClick}
    >
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{label}</span>
        {sublabel && <span className="text-[11px] text-muted-foreground">{sublabel}</span>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
    </div>
  )
}
