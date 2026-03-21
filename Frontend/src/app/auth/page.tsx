"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authApi } from "@/features/auth/api/authApi"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import type { CompleteGoogleSignInPayload, GooglePendingUser, UserRole } from "@/features/auth/types"
import { useAppDispatch } from "@/store/hooks"
import { setSession } from "@/features/auth/store/authSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useTranslation } from "@/i18n/provider"
import { LanguageSwitcher } from "@/components/language-switcher"

function splitName(fullName: string): [string, string] {
  if (!fullName) {
    return ["", ""]
  }

  const parts = fullName.trim().split(" ", 2)
  if (parts.length === 0) return ["", ""]
  if (parts.length === 1) return [parts[0], parts[0]]
  return [parts[0], parts[1]]
}

function mapOAuthError(e: string | null | undefined, t: (key: string) => string) {
  if (!e) return t("authPage.oauthCancelled")
  const lower = e.toLowerCase()
  if (lower.includes("access token") || lower.includes("access_token") || lower.includes("the access token is missing"))
    return t("authPage.noAccessToken")
  if (lower.includes("github did not return required user information") || lower.includes("did not return required user information"))
    return t("authPage.noUserInfo")
  if (lower.includes("error while processing") || lower.includes("authentication failed"))
    return t("authPage.serverError")
  return e
}

function sanitizeAvatarForAuth(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return null
  if (trimmed.length <= 256) return trimmed

  try {
    const parsed = new URL(trimmed)
    parsed.search = ''
    parsed.hash = ''
    const normalized = parsed.toString()
    return normalized.length <= 256 ? normalized : null
  } catch {
    return null
  }
}

export default function OAuthRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const statusParam = searchParams.get("oauth_status")?.toLowerCase() ?? null
  const tokenParam = searchParams.get("oauth_token")
  const errorParam = searchParams.get("oauth_error")
  const providerParam = (searchParams.get("oauth_provider") ?? "google").toLowerCase() as string
  const familyCodeParam = searchParams.get("familyCode")
  const modeParam = searchParams.get("mode") as UserRole | null

  const [isLoading, setIsLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [pendingUser, setPendingUser] = useState<GooglePendingUser | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("parent")
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [familyCode, setFamilyCode] = useState("")
  const [age, setAge] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasInviteCode, setHasInviteCode] = useState(false)

  useEffect(() => {
    const processStatus = async () => {
      const isPopup = typeof window !== 'undefined' && window.opener !== null
      
      if (!statusParam) {
        setFatalError(t("authPage.unknownResponse"))
        setIsLoading(false)
        return
      }

      if (statusParam === "error") {
        const mappedError = mapOAuthError(errorParam, t)
        
        if (isPopup && window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_RESULT',
            payload: {
              status: 'error',
              error: mappedError,
              provider: providerParam
            }
          }, window.location.origin)
          window.close()
          return
        }
        
        setFatalError(mappedError)
        setIsLoading(false)
        return
      }

      if (!tokenParam) {
        setFatalError(t("authPage.noToken"))
        setIsLoading(false)
        return
      }

      if (statusParam === "authenticated") {
        try {
          const session = await authApi.fetchProviderSession(providerParam, tokenParam)
          
          if (isPopup && window.opener) {
            // Отправляем сессию в родительское окно
            window.opener.postMessage({
              type: 'OAUTH_RESULT',
              payload: {
                status: 'authenticated',
                session: session,
                provider: providerParam
              }
            }, window.location.origin)
            window.close()
            return
          }
          
          dispatch(setSession(session))
          router.replace("/")
        } catch (err) {
          setFatalError(mapApiError(err, t("authPage.loginFailed")))
          setIsLoading(false)
        }
        return
      }

      if (statusParam === "pending") {
        try {
          const data = await authApi.fetchProviderPendingUser(providerParam, tokenParam)
          
          if (isPopup && window.opener) {
            // Отправляем pending статус в родительское окно для завершения регистрации
            window.opener.postMessage({
              type: 'OAUTH_RESULT',
              payload: {
                status: 'pending',
                token: tokenParam,
                provider: providerParam,
                pendingUser: data
              }
            }, window.location.origin)
            window.close()
            return
          }
          
          const [defaultName, defaultLastName] = splitName(data.name)
          setPendingToken(tokenParam)
          setPendingUser(data)
          setEmail(data.email ?? "")
          setName(defaultName)
          setLastName(defaultLastName)
          
          // Auto-fill family code from URL or localStorage
          const storedFamilyCode = typeof window !== "undefined" ? localStorage.getItem("pendingFamilyCode") : null
          const codeToUse = familyCodeParam || storedFamilyCode
          
          if (codeToUse) {
            setFamilyCode(codeToUse.toUpperCase())
            setHasInviteCode(true)
            setRole("child")
            // Clear from localStorage after using
            if (storedFamilyCode) {
              localStorage.removeItem("pendingFamilyCode")
            }
          } else if (modeParam === "child" || modeParam === "parent") {
            setRole(modeParam)
          }
          
          setIsLoading(false)
        } catch (err) {
          setFatalError(mapApiError(err, t("authPage.profileFetchFailed")))
          setIsLoading(false)
        }
        return
      }

      setFatalError(t("authPage.unknownStatus"))
      setIsLoading(false)
    }

    processStatus()
  }, [dispatch, errorParam, router, statusParam, tokenParam])

  // Auto-redirect to home after showing fatal error for a short time
  useEffect(() => {
    if (!fatalError) return
    const t = setTimeout(() => router.replace("/"), 6000)
    return () => clearTimeout(t)
  }, [fatalError, router])

  const avatarPreview = useMemo(() => pendingUser?.picture ?? null, [pendingUser])
  const normalizedEmailFromProvider = pendingUser?.email?.trim() ?? ""

  const handleSubmitPending = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingToken || !pendingUser) return
    const isPopup = typeof window !== 'undefined' && window.opener !== null

    // clear form-only errors (do not touch fatal errors)
    setFormError(null)

    const trimmedName = name.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName || !trimmedLastName) {
      setFormError(t("authPage.enterNameAndLastName"))
      return
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError(t("authPage.enterValidEmail"))
      return
    }

    let normalizedFamilyName: string | null = null
    let normalizedFamilyCode: string | null = null
    let parsedAge: number | null = null

    if (role === "parent") {
      normalizedFamilyName = familyName.trim()
      if (!normalizedFamilyName) {
        setFormError(t("authPage.enterFamilyName"))
        return
      }
    } else {
      normalizedFamilyCode = familyCode.trim().toUpperCase()
      if (!normalizedFamilyCode) {
        setFormError(t("authPage.enterFamilyCode"))
        return
      }

      if (age.trim()) {
        const numericAge = Number(age.trim())
        if (Number.isNaN(numericAge) || numericAge < 5 || numericAge > 16) {
          setFormError(t("authPage.ageRange"))
          return
        }
        parsedAge = numericAge
      } else {
        setFormError(t("authPage.enterChildAge"))
        return
      }
    }

    const payload: CompleteGoogleSignInPayload = {
      pendingToken,
      role,
      name: trimmedName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      avatar: sanitizeAvatarForAuth(avatarPreview),
      age: parsedAge,
      familyCode: normalizedFamilyCode,
      familyName: normalizedFamilyName,
      familyEmblem: null,
    }

    try {
      setIsSubmitting(true)
      const session = await authApi.completeProviderSignIn(providerParam, payload)
      
      if (isPopup && window.opener) {
        // Отправляем сессию в родительское окно
        window.opener.postMessage({
          type: 'OAUTH_RESULT',
          payload: {
            status: 'authenticated',
            session: session,
            provider: providerParam
          }
        }, window.location.origin)
        window.close()
        return
      }
      
      dispatch(setSession(session))
      router.replace("/")
    } catch (err) {
      // Treat client/validation errors (4xx) as form errors; server/fatal as fatal
      const status = (err as any)?.response?.status
      const mapped = mapApiError(err, t("authPage.registrationFailed"))
      if (status && status >= 400 && status < 500) {
        setFormError(mapped)
      } else {
        setFatalError(mapped)
      }
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">{t("authPage.completing")}</p>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl font-semibold">{t("authPage.errorTitle")}</h1>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{fatalError}</p>
            <Button onClick={() => router.replace("/")}>{t("authPage.goHome")}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pendingUser || !pendingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">{t("authPage.dataUnavailable")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-400 via-purple-400 to-purple-500 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <LanguageSwitcher variant="outline" size="sm" />
      </div>
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">{t("authPage.welcomeUser", { name: pendingUser.name })}</h1>
            <p className="text-sm text-muted-foreground">{t("authPage.setupProfile")}</p>
          </div>

          {avatarPreview && (
            <div className="flex justify-center">
              <img
                src={avatarPreview}
                alt={t("authPage.avatar")}
                className="h-20 w-20 rounded-full border border-muted shadow"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded whitespace-pre-line">{formError}</div>
          )}

          <form className="space-y-4" onSubmit={handleSubmitPending}>
            <div>
              <Label>{t("authPage.emailLabel")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {normalizedEmailFromProvider && (
                <p className="text-xs text-muted-foreground mt-1">{t("authPage.emailImported")}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("authPage.nameLabel")}</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("authPage.namePlaceholder")} />
              </div>
              <div>
                <Label>{t("authPage.lastNameLabel")}</Label>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={t("authPage.lastNamePlaceholder")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("authPage.roleLabel")}</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={role === "parent" ? "default" : "outline"}
                  onClick={() => setRole("parent")}
                  disabled={isSubmitting}
                >
                  {t("authPage.roleParent")}
                </Button>
                {hasInviteCode && (
                  <Button
                    type="button"
                    variant={role === "child" ? "default" : "outline"}
                    onClick={() => setRole("child")}
                    disabled={isSubmitting}
                  >
                    {t("authPage.roleChild")}
                  </Button>
                )}
              </div>
              {!hasInviteCode && (
                <p className="text-xs text-muted-foreground">
                  {t("authPage.inviteHint")}
                </p>
              )}
            </div>

            {role === "parent" ? (
              <div>
                <Label>{t("authPage.familyNameLabel")}</Label>
                <Input
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder={t("authPage.familyNamePlaceholder")}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("authPage.familyCodeLabel")}</Label>
                  <Input
                    value={familyCode}
                    onChange={(event) => setFamilyCode(event.target.value)}
                    placeholder="ABC123"
                  />
                  {(familyCodeParam || localStorage.getItem("pendingFamilyCode")) && familyCode && (
                    <p className="text-xs text-green-600 mt-1">{t("authPage.codeImported")}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">{t("authPage.ageLabel")}</Label>
                  <div className="pt-2 pb-1">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xl font-bold text-purple-600">{age || '5'}</span>
                      <span className="text-xs text-gray-500">{t("authPage.ageUnit")}</span>
                    </div>
                    <Slider
                      min={5}
                      max={16}
                      step={1}
                      value={[Number(age) || 5]}
                      onValueChange={(vals) => setAge(String(vals[0]))}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">5</span>
                      <span className="text-xs text-gray-500">16</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => router.replace("/")} disabled={isSubmitting}>
                {t("authPage.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("authPage.saving") : t("authPage.finish")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
