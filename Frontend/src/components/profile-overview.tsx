"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import type { AuthSession, UpdateProfilePayload } from "@/features/auth/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Home, Loader2, LogOut } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface ProfileOverviewProps {
  session: AuthSession
  onLogout: () => void
  onGoDashboard: () => void
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<AuthSession>
}

type ProfileFormState = {
  name: string
  lastName: string
  avatar: string
  age: string
}

export default function ProfileOverview({ session, onLogout, onGoDashboard, onUpdateProfile }: ProfileOverviewProps) {
  const { t } = useTranslation()
  const { profile, user, family } = session

  const [formState, setFormState] = useState<ProfileFormState>({
    name: profile.name ?? "",
    lastName: profile.lastName ?? "",
    avatar: profile.avatar ?? "",
    age: profile.role === "child" && profile.age !== undefined ? String(profile.age) : "",
  })
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setFormState({
      name: profile.name ?? "",
      lastName: profile.lastName ?? "",
      avatar: profile.avatar ?? "",
      age: profile.role === "child" && profile.age !== undefined ? String(profile.age) : "",
    })
    setStatus("idle")
    setErrorMessage(null)
  }, [profile])

  const avatarImageUrl = useMemo(() => {
    const value = profile.avatar?.trim()
    if (!value) {
      return null
    }

    try {
      const parsed = new URL(value)
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null
    } catch {
      return null
    }
  }, [profile.avatar])

  const fallbackInitials = useMemo(() => {
    const initialsSource = `${profile.name} ${profile.lastName}`.trim()
    if (!initialsSource) {
      return user.email.charAt(0).toUpperCase()
    }
    const initials = initialsSource
      .split(" ")
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase())
      .join("")
    return initials || user.email.charAt(0).toUpperCase()
  }, [profile.lastName, profile.name, user.email])

  const avatarSymbol = useMemo(() => {
    const value = profile.avatar?.trim()
    if (!value) {
      return fallbackInitials
    }

    if (avatarImageUrl) {
      return fallbackInitials
    }

    return value
  }, [avatarImageUrl, fallbackInitials, profile.avatar])

  const handleFieldChange = (field: keyof ProfileFormState) => (value: string) => {
    setFormState(previous => ({ ...previous, [field]: value }))
    setStatus("idle")
    setErrorMessage(null)
  }

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
    if (!canSubmit) {
      return
    }

    setStatus("saving")
    setErrorMessage(null)

    const payload: UpdateProfilePayload = {
      name: formState.name.trim() === "" ? null : formState.name.trim(),
      lastName: formState.lastName.trim() === "" ? null : formState.lastName.trim(),
      avatar: formState.avatar.trim() === "" ? null : formState.avatar.trim(),
    }

    if (profile.role === "child") {
      const normalizedAge = formState.age.trim()
      if (normalizedAge === "") {
        payload.age = null
      } else {
        const parsedAge = Number(normalizedAge)
        payload.age = Number.isNaN(parsedAge) ? null : parsedAge
      }
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

  const familyName = family?.name ?? t("profileOverview.noFamily")
  const familyCode = family?.code ?? "—"
  const familyEmblem = family?.emblem ?? "🏡"
  const ageLabel = profile.role === "child" && profile.age !== undefined ? `${profile.age} ${t("profileOverview.yearsOld")}` : "—"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("profileOverview.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("profileOverview.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="outline" size="sm" />
            <Button variant="outline" onClick={onGoDashboard} className="gap-2">
              <Home className="h-4 w-4" />
              {t("profileOverview.toDashboard")}
            </Button>
            <Button variant="destructive" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t("profileOverview.logout")}
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 text-2xl">
                {avatarImageUrl && <AvatarImage src={avatarImageUrl} alt={t("profileOverview.profilePhoto")} />}
                <AvatarFallback>{avatarSymbol}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">
                    {[profile.name, profile.lastName].filter(Boolean).join(" ") || user.email}
                  </h2>
                  <Badge>{profile.role === "parent" ? t("profileOverview.role.parent") : t("profileOverview.role.child")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground md:text-right">
              <div>
                <p className="font-medium text-foreground">{t("profileOverview.identifier")}</p>
                <p className="font-mono text-xs md:text-sm break-all">{user.id}</p>
              </div>
              {profile.role === "child" && (
                <div>
                  <p className="font-medium text-foreground">{t("profileOverview.age")}</p>
                  <p>{ageLabel}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">{t("profileOverview.form.name")}</Label>
                  <Input
                    id="profile-name"
                    value={formState.name}
                    onChange={event => handleFieldChange("name")(event.target.value)}
                    placeholder={t("profileOverview.form.namePlaceholder")}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-lastname">{t("profileOverview.form.lastName")}</Label>
                  <Input
                    id="profile-lastname"
                    value={formState.lastName}
                    onChange={event => handleFieldChange("lastName")(event.target.value)}
                    placeholder={t("profileOverview.form.lastNamePlaceholder")}
                    autoComplete="family-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar">{t("profileOverview.form.avatarLabel")}</Label>
                  <Input
                    id="profile-avatar"
                    value={formState.avatar}
                    onChange={event => handleFieldChange("avatar")(event.target.value)}
                    placeholder={t("profileOverview.form.avatarPlaceholder")}
                  />
                </div>
                {profile.role === "child" && (
                  <div className="space-y-2">
                    <Label htmlFor="profile-age">{t("profileOverview.form.age")}</Label>
                    <Input
                      id="profile-age"
                      type="number"
                      min={0}
                      max={120}
                      inputMode="numeric"
                      value={formState.age}
                      onChange={event => handleFieldChange("age")(event.target.value)}
                      placeholder="12"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={!canSubmit} className="gap-2">
                  {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("profileOverview.form.save")}
                </Button>
                {status === "success" && <p className="text-sm text-emerald-600">{t("profileOverview.form.success")}</p>}
                {status === "error" && (
                  <p className="text-sm text-destructive">{errorMessage ?? t("profileOverview.form.error")}</p>
                )}
                {!isDirty && status === "idle" && (
                  <p className="text-xs text-muted-foreground">{t("profileOverview.form.hint")}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("profileOverview.family.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{familyEmblem}</div>
                <div>
                  <p className="text-lg font-semibold">{familyName}</p>
                  <p className="text-sm text-muted-foreground">{t("profileOverview.family.code")} {familyCode}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("profileOverview.family.description")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("profileOverview.quickActions.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={onGoDashboard} className="w-full justify-start gap-2" variant="secondary">
                <Home className="h-4 w-4" /> {t("profileOverview.quickActions.goToDashboard")}
              </Button>
              <Button onClick={onLogout} className="w-full justify-start gap-2" variant="outline">
                <LogOut className="h-4 w-4" /> {t("profileOverview.quickActions.logout")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("profileOverview.quickActions.tips")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
