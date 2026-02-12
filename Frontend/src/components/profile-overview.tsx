"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AuthSession, UpdateProfilePayload } from "@/features/auth/types"
import { authApi } from "@/features/auth/api/authApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsPopover } from "@/components/notifications-popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home, Loader2, LogOut, Trash2, AlertTriangle, Camera, Upload, User,
  Sparkles, Mail, Shield, Users, ChevronRight, Edit3, Save, CheckCircle2,
  Copy, Check, Lock, KeyRound, Eye, EyeOff, ListTodo, Gift, BarChart3,
  MessageCircle, Settings,
} from "lucide-react"
import { useTranslation } from "@/i18n/provider"
import { openAiChat } from "@/components/ai-chat-widget"
import dynamic from "next/dynamic"

/* ── Lazy-loaded tab components ── */
const TasksList = dynamic(() => import("@/components/tasks-list"), { ssr: false })
const RewardsShop = dynamic(() => import("@/components/rewards-shop"), { ssr: false })
const AnalyticsDashboard = dynamic(() => import("@/components/analytics-dashboard"), { ssr: false })
const ChildrenManagement = dynamic(() => import("@/components/children-management"), { ssr: false })
const ParentChatSelector = dynamic(() => import("@/components/parent-chat-selector"), { ssr: false })
const ParentSettings = dynamic(() => import("@/components/parent-settings"), { ssr: false })

interface ProfileOverviewProps {
  session: AuthSession
  onLogout: () => void
  onGoDashboard: () => void
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<AuthSession>
  onDeleteAccount?: () => Promise<void>
}

const EMOJI_AVATARS = [
  "👦", "👧", "🧒", "👨", "👩", "🧑",
  "👨‍🦱", "👩‍🦱", "👨‍🎨", "👩‍💼", "🧑‍💻", "👨‍⚕️",
  "👩‍⚕️", "🧑‍🍳", "🦸", "🦹", "🧙", "🧝",
  "🐱", "🐶", "🦊", "🐼", "🦁", "🐸",
]

type ProfileFormState = {
  name: string
  lastName: string
  avatar: string
  age: string
}

const NAV_ITEMS = [
  { value: "profile", icon: User, labelKey: "profileOverview.tabs.profile" },
  { value: "tasks", icon: ListTodo, labelKey: "profileOverview.tabs.tasks" },
  { value: "rewards", icon: Gift, labelKey: "profileOverview.tabs.rewards" },
  { value: "analytics", icon: BarChart3, labelKey: "profileOverview.tabs.analytics" },
  { value: "children", icon: Users, labelKey: "profileOverview.tabs.children" },
  { value: "chat", icon: MessageCircle, labelKey: "profileOverview.tabs.chat" },
  { value: "settings", icon: Settings, labelKey: "profileOverview.tabs.settings" },
] as const

export default function ProfileOverview({ session, onLogout, onGoDashboard, onUpdateProfile, onDeleteAccount }: ProfileOverviewProps) {
  const { t } = useTranslation()
  const { profile, user, family } = session

  /* ── Profile form state ── */
  const [formState, setFormState] = useState<ProfileFormState>({
    name: profile.name ?? "",
    lastName: profile.lastName ?? "",
    avatar: profile.avatar ?? "",
    age: profile.role === "child" && profile.age !== undefined ? String(profile.age) : "",
  })
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error">("idle")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null)
  const [localAvatarSymbol, setLocalAvatarSymbol] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Security form state ── */
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [pwError, setPwError] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [showEmailPw, setShowEmailPw] = useState(false)
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [emailError, setEmailError] = useState<string | null>(null)

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    setFormState({
      name: profile.name ?? "",
      lastName: profile.lastName ?? "",
      avatar: profile.avatar ?? "",
      age: profile.role === "child" && profile.age !== undefined ? String(profile.age) : "",
    })
    setStatus("idle")
    setErrorMessage(null)
    setLocalAvatarPreview(null)
    setLocalAvatarSymbol(null)
  }, [profile])

  const avatarImageUrl = useMemo(() => {
    if (localAvatarPreview) return localAvatarPreview
    const value = profile.avatar?.trim()
    if (!value) return null
    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null
    } catch {
      return null
    }
  }, [profile.avatar, localAvatarPreview])

  const fallbackInitials = useMemo(() => {
    const initialsSource = `${profile.name} ${profile.lastName}`.trim()
    if (!initialsSource) return user.email.charAt(0).toUpperCase()
    const initials = initialsSource.split(" ").filter(Boolean).map(part => part.charAt(0).toUpperCase()).join("")
    return initials || user.email.charAt(0).toUpperCase()
  }, [profile.lastName, profile.name, user.email])

  const avatarSymbol = useMemo(() => {
    if (localAvatarSymbol) return localAvatarSymbol
    const value = profile.avatar?.trim()
    if (!value) return fallbackInitials
    if (!localAvatarPreview) {
      try { new URL(value); return fallbackInitials } catch { return value }
    }
    return fallbackInitials
  }, [localAvatarPreview, localAvatarSymbol, fallbackInitials, profile.avatar])

  const handleFieldChange = (field: keyof ProfileFormState) => (value: string) => {
    setFormState(previous => ({ ...previous, [field]: value }))
    setStatus("idle")
    setErrorMessage(null)
  }

  const handleEmojiPick = async (emoji: string) => {
    setShowAvatarPicker(false)
    setLocalAvatarSymbol(emoji)
    setLocalAvatarPreview(null)
    setFormState(prev => ({ ...prev, avatar: emoji }))
    try {
      setStatus("saving")
      await onUpdateProfile({
        name: formState.name,
        lastName: formState.lastName,
        avatar: emoji,
        ...(profile.role === "child" && formState.age ? { age: Number(formState.age) } : {}),
      })
      setStatus("success")
      setLocalAvatarSymbol(null)
    } catch {
      setStatus("error")
      setLocalAvatarSymbol(null)
      setErrorMessage(t("profileOverview.updateError"))
    }
  }

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user.id) return
    setAvatarUploading(true)
    setShowAvatarPicker(false)
    const reader = new FileReader()
    reader.onload = () => {
      setLocalAvatarPreview(reader.result as string)
      setLocalAvatarSymbol(null)
    }
    reader.readAsDataURL(file)
    try {
      const { authService } = await import("@/services/auth-service")
      await authService.uploadAvatar(user.id, file)
      setAvatarUploading(false)
    } catch (err) {
      console.error("[profile] avatar upload failed", err)
      setAvatarUploading(false)
      setLocalAvatarPreview(null)
      setStatus("error")
      setErrorMessage(t("profileOverview.avatarUploadError"))
    }
  }, [user.id, t])

  const isDirty = useMemo(() => {
    const baseName = (profile.name ?? "").trim()
    const baseLastName = (profile.lastName ?? "").trim()
    const baseAvatar = (profile.avatar ?? "").trim()
    const baseAge = profile.role === "child" && profile.age !== undefined ? String(profile.age) : ""
    return (
      formState.name.trim() !== baseName ||
      formState.lastName.trim() !== baseLastName ||
      formState.avatar.trim() !== baseAvatar ||
      (profile.role === "child" && formState.age.trim() !== baseAge)
    )
  }, [formState, profile])

  const canSubmit = isDirty && status !== "saving"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setStatus("saving")
    setErrorMessage(null)
    const payload: UpdateProfilePayload = {
      name: formState.name.trim() === "" ? null : formState.name.trim(),
      lastName: formState.lastName.trim() === "" ? null : formState.lastName.trim(),
      avatar: formState.avatar.trim() === "" ? null : formState.avatar.trim(),
    }
    if (profile.role === "child") {
      const normalizedAge = formState.age.trim()
      if (normalizedAge === "") { payload.age = null }
      else { const p = Number(normalizedAge); payload.age = Number.isNaN(p) ? null : p }
    }
    try {
      await onUpdateProfile(payload)
      setStatus("success")
    } catch (error) {
      console.error("[profile] Failed to update profile", error)
      setStatus("error")
      setErrorMessage(t("profileOverview.updateError"))
    }
  }

  /* ── Password change ── */
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError(t("profileOverview.security.passwordsMismatch"))
      setPwStatus("error")
      return
    }
    if (newPassword.length < 6) {
      setPwError(t("profileOverview.security.passwordTooShort"))
      setPwStatus("error")
      return
    }
    setPwStatus("saving")
    setPwError(null)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setPwStatus("success")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setPwStatus("error")
      const msg = err instanceof Error ? err.message : t("profileOverview.security.changePasswordError")
      setPwError(msg)
    }
  }

  /* ── Email change ── */
  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!newEmail.includes("@")) {
      setEmailError(t("profileOverview.security.invalidEmail"))
      setEmailStatus("error")
      return
    }
    setEmailStatus("saving")
    setEmailError(null)
    try {
      await authApi.changeEmail({ newEmail, password: emailPassword })
      setEmailStatus("success")
      setNewEmail("")
      setEmailPassword("")
    } catch (err: unknown) {
      setEmailStatus("error")
      const msg = err instanceof Error ? err.message : t("profileOverview.security.changeEmailError")
      setEmailError(msg)
    }
  }

  const familyName = family?.name ?? t("profileOverview.noFamily")
  const familyCode = family?.code ?? "—"
  const familyEmblem = family?.emblem ?? "🏡"
  const ageLabel = profile.role === "child" && profile.age !== undefined ? `${profile.age} ${t("profileOverview.yearsOld")}` : "—"
  const displayName = [profile.name, profile.lastName].filter(Boolean).join(" ") || user.email

  const copyFamilyCode = useCallback(() => {
    navigator.clipboard.writeText(familyCode).then(() => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000) })
  }, [familyCode])

  /* Drag-and-drop */
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(true) }, [])
  const onDragLeave = useCallback(() => setDragActive(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) handleFileUpload(file)
  }, [handleFileUpload])

  /* ── Determine visible tabs based on role ── */
  const visibleTabs = useMemo(() => {
    if (profile.role === "child") {
      return NAV_ITEMS.filter(item => item.value === "profile" || item.value === "settings")
    }
    return NAV_ITEMS
  }, [profile.role])

  return (
    <div className="min-h-screen bg-background">

      {/* ════════════ STICKY HEADER ════════════ */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm shadow-md">
              {familyEmblem}
            </div>
            <h1 className="text-sm font-semibold">{t("profileOverview.title")}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher variant="outline" size="sm" />
            <ThemeToggle />
            <NotificationsPopover />
            <Button
              size="icon"
              className="h-8 w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
              onClick={() => openAiChat()}
              aria-label="AI"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 rounded-lg h-8">
                  <Avatar className="h-7 w-7 text-xs ring-1 ring-border">
                    {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="" />}
                    <AvatarFallback className="text-xs">{avatarSymbol}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs font-medium">{profile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onGoDashboard} className="gap-2">
                  <Home className="h-4 w-4" /> {t("profileOverview.toDashboard")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> {t("profileOverview.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ════════════ COMPACT HERO ════════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 via-primary/80 to-fuchsia-600/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-violet-500 opacity-90" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-background flex items-center justify-center overflow-hidden ring-2 ring-white/20 shadow-xl">
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl sm:text-5xl select-none">{avatarSymbol}</span>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full bg-white text-violet-600 shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            {/* Identity */}
            <div className="space-y-1.5 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">{displayName}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="bg-white/20 text-white border-white/30 text-xs font-medium">
                  {profile.role === "parent" ? `👨‍👩‍👧 ${t("profileOverview.role.parent")}` : `🧒 ${t("profileOverview.role.child")}`}
                </Badge>
                {profile.role === "child" && profile.age !== undefined && (
                  <Badge className="bg-white/15 text-white border-white/20 text-xs">{ageLabel}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-white/60 text-xs">
                <Mail className="w-3 h-3" /> <span>{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ TABBED NAVIGATION ════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <div className="border-b border-border/40 mb-6 -mx-1 overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-full sm:w-auto bg-transparent p-0 h-auto gap-0.5">
              {visibleTabs.map(({ value, icon: Icon, labelKey }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative px-3 py-2 rounded-none border-b-2 border-transparent bg-transparent text-muted-foreground data-[state=active]:border-violet-500 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground/80 transition-colors gap-1.5 text-sm font-medium"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(labelKey)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ═══════ PROFILE TAB ═══════ */}
          <TabsContent value="profile" className="space-y-5 pb-10">

            {/* Edit form */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Edit3 className="w-4 h-4 text-violet-500" />
                  {t("profileOverview.form.editTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-name" className="text-xs font-medium">{t("profileOverview.form.name")}</Label>
                      <Input
                        id="profile-name"
                        value={formState.name}
                        onChange={e => handleFieldChange("name")(e.target.value)}
                        placeholder={t("profileOverview.form.namePlaceholder")}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-lastname" className="text-xs font-medium">{t("profileOverview.form.lastName")}</Label>
                      <Input
                        id="profile-lastname"
                        value={formState.lastName}
                        onChange={e => handleFieldChange("lastName")(e.target.value)}
                        placeholder={t("profileOverview.form.lastNamePlaceholder")}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("profileOverview.form.avatarLabel")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAvatarPicker(true)}
                        className="w-full justify-start gap-2 rounded-lg h-9 text-sm"
                      >
                        <Camera className="h-3.5 w-3.5 text-violet-500" />
                        {t("profileOverview.changeAvatar")}
                        <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />
                      </Button>
                    </div>
                    {profile.role === "child" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-age" className="text-xs font-medium">{t("profileOverview.form.age")}</Label>
                        <Input
                          id="profile-age"
                          type="number" min={0} max={120} inputMode="numeric"
                          value={formState.age}
                          onChange={e => handleFieldChange("age")(e.target.value)}
                          placeholder="12"
                          className="h-9 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={!canSubmit} className="gap-2 rounded-lg h-9 text-sm bg-violet-600 hover:bg-violet-700 text-white">
                      {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {t("profileOverview.form.save")}
                    </Button>
                    {status === "success" && <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />{t("profileOverview.form.success")}</span>}
                    {status === "error" && <p className="text-xs text-destructive font-medium">{errorMessage ?? t("profileOverview.form.error")}</p>}
                    {!isDirty && status === "idle" && <p className="text-xs text-muted-foreground">{t("profileOverview.form.hint")}</p>}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Info row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Family */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4 text-emerald-500" />
                    {t("profileOverview.family.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">{familyEmblem}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{familyName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded">{familyCode}</code>
                        <button type="button" onClick={copyFamilyCode} className="text-muted-foreground hover:text-foreground transition-colors">
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account info */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Shield className="w-4 h-4 text-amber-500" />
                    {t("profileOverview.form.accountInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                        <p className="text-xs font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("profileOverview.identifier")}</p>
                        <p className="text-[11px] font-mono truncate">{user.id}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security section — change password & email */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-violet-500" />
                  {t("profileOverview.security.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Change Password */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profileOverview.security.changePassword")}</h4>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="current-pw" className="text-xs">{t("profileOverview.security.currentPassword")}</Label>
                        <div className="relative">
                          <Input
                            id="current-pw"
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="h-9 rounded-lg text-sm pr-9"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-pw" className="text-xs">{t("profileOverview.security.newPassword")}</Label>
                        <div className="relative">
                          <Input
                            id="new-pw"
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="h-9 rounded-lg text-sm pr-9"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-pw" className="text-xs">{t("profileOverview.security.confirmPassword")}</Label>
                        <Input
                          id="confirm-pw"
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="h-9 rounded-lg text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={!currentPassword || !newPassword || !confirmPassword || pwStatus === "saving"}
                          className="gap-2 h-9 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          {pwStatus === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          {t("profileOverview.security.updatePassword")}
                        </Button>
                        {pwStatus === "success" && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{t("profileOverview.security.passwordChanged")}</span>}
                        {pwStatus === "error" && <p className="text-xs text-destructive">{pwError}</p>}
                      </div>
                    </form>
                  </div>

                  {/* Change Email */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profileOverview.security.changeEmail")}</h4>
                    </div>
                    <form onSubmit={handleChangeEmail} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-email" className="text-xs">{t("profileOverview.security.newEmail")}</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          className="h-9 rounded-lg text-sm"
                          placeholder="new@email.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email-pw" className="text-xs">{t("profileOverview.security.passwordToConfirm")}</Label>
                        <div className="relative">
                          <Input
                            id="email-pw"
                            type={showEmailPw ? "text" : "password"}
                            value={emailPassword}
                            onChange={e => setEmailPassword(e.target.value)}
                            className="h-9 rounded-lg text-sm pr-9"
                            placeholder="••••••••"
                          />
                          <button type="button" onClick={() => setShowEmailPw(!showEmailPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showEmailPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={!newEmail || !emailPassword || emailStatus === "saving"}
                          className="gap-2 h-9 rounded-lg text-sm bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          {emailStatus === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                          {t("profileOverview.security.updateEmail")}
                        </Button>
                        {emailStatus === "success" && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{t("profileOverview.security.emailChanged")}</span>}
                        {emailStatus === "error" && <p className="text-xs text-destructive">{emailError}</p>}
                      </div>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onGoDashboard} variant="outline" className="gap-2 rounded-lg h-9 text-sm">
                <Home className="h-3.5 w-3.5" /> {t("profileOverview.quickActions.goToDashboard")}
              </Button>
              <Button onClick={onLogout} variant="outline" className="gap-2 rounded-lg h-9 text-sm">
                <LogOut className="h-3.5 w-3.5" /> {t("profileOverview.quickActions.logout")}
              </Button>
            </div>

            {/* Danger zone */}
            {profile.role === "parent" && onDeleteAccount && (
              <Card className="border-destructive/20 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    {t("profileOverview.dangerZone.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("profileOverview.dangerZone.description")}</p>
                  {!showDeleteConfirm ? (
                    <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="gap-2 rounded-lg h-9 text-sm">
                      <Trash2 className="h-3.5 w-3.5" /> {t("profileOverview.dangerZone.deleteButton")}
                    </Button>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-destructive">{t("profileOverview.dangerZone.confirmTitle")}</p>
                          <p className="text-xs text-muted-foreground">{t("profileOverview.dangerZone.confirmDescription")}</p>
                          <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-0.5">
                            <li>{t("profileOverview.dangerZone.willDelete.profile")}</li>
                            <li>{t("profileOverview.dangerZone.willDelete.family")}</li>
                            <li>{t("profileOverview.dangerZone.willDelete.tasks")}</li>
                            <li>{t("profileOverview.dangerZone.willDelete.data")}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="delete-confirm" className="text-xs font-semibold">{t("profileOverview.dangerZone.typeConfirm")}</Label>
                        <Input id="delete-confirm" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="border-destructive/40 rounded-lg h-9 text-sm" />
                      </div>
                      {deleteStatus === "error" && <p className="text-xs text-destructive">{t("profileOverview.dangerZone.error")}</p>}
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          disabled={deleteConfirmText !== "DELETE" || deleteStatus === "deleting"}
                          onClick={async () => { setDeleteStatus("deleting"); try { await onDeleteAccount() } catch { setDeleteStatus("error") } }}
                          className="gap-2 rounded-lg h-9 text-sm"
                        >
                          {deleteStatus === "deleting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          {t("profileOverview.dangerZone.confirmDelete")}
                        </Button>
                        <Button variant="outline" className="rounded-lg h-9 text-sm" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setDeleteStatus("idle") }}>
                          {t("profileOverview.dangerZone.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════ TASKS TAB ═══════ */}
          {profile.role === "parent" && (
            <TabsContent value="tasks" className="pb-10">
              <TasksList userType="parent" />
            </TabsContent>
          )}

          {/* ═══════ REWARDS TAB ═══════ */}
          {profile.role === "parent" && (
            <TabsContent value="rewards" className="pb-10">
              <RewardsShop userType="parent" />
            </TabsContent>
          )}

          {/* ═══════ ANALYTICS TAB ═══════ */}
          {profile.role === "parent" && (
            <TabsContent value="analytics" className="pb-10">
              <AnalyticsDashboard />
            </TabsContent>
          )}

          {/* ═══════ CHILDREN TAB ═══════ */}
          {profile.role === "parent" && (
            <TabsContent value="children" className="pb-10">
              <ChildrenManagement />
            </TabsContent>
          )}

          {/* ═══════ CHAT TAB ═══════ */}
          {profile.role === "parent" && (
            <TabsContent value="chat" className="pb-10">
              <ParentChatSelector />
            </TabsContent>
          )}

          {/* ═══════ SETTINGS TAB ═══════ */}
          <TabsContent value="settings" className="pb-10">
            <ParentSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* ════════════ AVATAR PICKER DIALOG ════════════ */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-violet-500" />
              {t("profileOverview.avatarPicker.title")}
            </DialogTitle>
            <DialogDescription className="text-xs">{t("profileOverview.avatarPicker.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-400 to-pink-400 opacity-60 blur-md" />
              <Avatar className="relative h-16 w-16 text-3xl ring-2 ring-white/50">
                {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt="" />}
                <AvatarFallback className="text-2xl">{avatarSymbol}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">{t("profileOverview.avatarPicker.chooseEmoji")}</p>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiPick(emoji)}
                  className="text-xl p-1.5 rounded-lg hover:bg-violet-500/10 transition-all border border-transparent hover:border-violet-500/30 hover:scale-110 active:scale-95 text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold mb-2">{t("profileOverview.avatarPicker.uploadPhoto")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
            />
            <label
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                dragActive ? "border-violet-500 bg-violet-500/10 scale-[1.01]" : "border-border hover:bg-violet-500/5 hover:border-violet-500/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-1.5">
                {avatarUploading ? <Loader2 className="h-5 w-5 text-violet-500 animate-spin" /> : <Upload className="h-5 w-5 text-violet-500" />}
              </div>
              <p className="text-xs font-semibold">{avatarUploading ? t("profileOverview.avatarPicker.uploading") : t("profileOverview.avatarPicker.chooseFile")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("profileOverview.avatarPicker.hint")}</p>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarPicker(false)} className="rounded-lg h-9 text-sm">
              {t("profileOverview.dangerZone.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
