"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Check, Copy, RefreshCw, Users, ChevronRight, Plus, Loader2, UserPlus, KeyRound } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import { useTranslation } from "@/i18n/provider"
import type { FamilyMember } from "@/services/family-service"
import { useSubscriptionGate } from "@/hooks/use-subscription-gate"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { authApi } from "@/features/auth/api/authApi"
import { toast } from "sonner"

interface ChildrenManagementProps {
  familyCode?: string | null
}

const FALLBACK_AVATARS = ["👦", "👧", "🧒", "🦄"]
const CHILD_AVATARS = ["👦", "👧", "🧒", "🦄", "🐱", "🐶", "🦊", "🐻", "🐼", "🐸"]

const resolveAvatar = (member: FamilyMember, index: number) => {
  const value = member.avatar?.trim()
  if (value) return value
  return FALLBACK_AVATARS[index % FALLBACK_AVATARS.length]
}

const formatMemberName = (member: FamilyMember) => {
  if (member.lastName?.trim()) {
    return `${member.name} ${member.lastName}`
  }
  return member.name
}

const formatShortId = (id: string) => id.split("-")[0]?.toUpperCase() ?? id

/* ─── Add Child Modal ─── */
function AddChildModal({
  familyCode,
  onClose,
  onSuccess,
  t,
}: {
  familyCode: string
  onClose: () => void
  onSuccess: () => void
  t: (key: string, params?: Record<string, string>) => string
}) {
  const [childName, setChildName] = useState("")
  const [childLastName, setChildLastName] = useState("")
  const [childAge, setChildAge] = useState("8")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ childEmail: string; childPassword: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const isValid = childName.trim().length > 0

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* ignore */ }
  }

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await authApi.registerChild({
        childName: childName.trim(),
        childLastName: childLastName.trim() || null,
        childAge: Number(childAge),
      })
      setCredentials(result)
      toast.success(t("addChild.success"))
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err?.response?.data?.detail ??
        err?.message ??
        t("addChild.error")
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // After credentials are shown and user closes — trigger refresh
  const handleClose = () => {
    if (credentials) {
      onSuccess()
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("addChild.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("addChild.subtitle")}</p>
            </div>
          </div>

          {credentials ? (
            /* ─── Credentials result ─── */
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t("addChild.credentialsTitle")}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white dark:bg-background rounded px-3 py-2 border">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("addChild.credentialsLogin")}</p>
                      <p className="text-sm font-mono font-semibold">{credentials.childEmail}</p>
                    </div>
                    <button onClick={() => handleCopy(credentials.childEmail, "email")} className="text-muted-foreground hover:text-foreground">
                      {copiedField === "email" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-background rounded px-3 py-2 border">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("addChild.credentialsPassword")}</p>
                      <p className="text-sm font-mono font-semibold">{credentials.childPassword}</p>
                    </div>
                    <button onClick={() => handleCopy(credentials.childPassword, "password")} className="text-muted-foreground hover:text-foreground">
                      {copiedField === "password" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("addChild.credentialsHint")}</p>
              </div>
              <Button className="w-full" onClick={handleClose}>
                {t("common.close")}
              </Button>
            </div>
          ) : (
            /* ─── Form ─── */
            <>
              {/* Name */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-1 block">{t("addChild.firstName")} *</Label>
                  <Input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder={t("addChild.firstNamePlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1 block">{t("addChild.lastName")}</Label>
                  <Input
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    placeholder={t("addChild.lastNamePlaceholder")}
                  />
                </div>
              </div>

              {/* Age slider */}
              <div>
                <Label className="text-sm font-medium mb-1 block">{t("addChild.age")}</Label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary w-8 text-center">{childAge}</span>
                  <Slider
                    min={5}
                    max={16}
                    step={1}
                    value={[Number(childAge)]}
                    onValueChange={(vals) => setChildAge(String(vals[0]))}
                    className="flex-1"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t("addChild.autoCredentialsHint")}</p>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("addChild.creating")}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t("addChild.createButton")}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Reset Child Password Modal ─── */
function ResetPasswordModal({
  child,
  onClose,
  t,
}: {
  child: FamilyMember
  onClose: () => void
  t: (key: string, params?: Record<string, string>) => string
}) {
  const [isResetting, setIsResetting] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* ignore */ }
  }

  const handleReset = async () => {
    if (isResetting) return
    setError(null)
    setIsResetting(true)

    try {
      const result = await authApi.resetChildPassword(child.id)
      setNewPassword(result.newPassword)
      toast.success(t("resetChildPassword.success"))
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.title ??
        err?.response?.data?.detail ??
        err?.message ??
        t("resetChildPassword.error")
      setError(msg)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("resetChildPassword.title")}</h2>
              <p className="text-xs text-muted-foreground">{formatMemberName(child)}</p>
            </div>
          </div>

          {newPassword ? (
            /* ─── New password result ─── */
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {t("resetChildPassword.newPasswordTitle")}
                </p>
                <div className="flex items-center justify-between bg-white dark:bg-background rounded px-3 py-2 border">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("resetChildPassword.newPasswordLabel")}</p>
                    <p className="text-sm font-mono font-semibold">{newPassword}</p>
                  </div>
                  <button onClick={() => handleCopy(newPassword, "newpwd")} className="text-muted-foreground hover:text-foreground">
                    {copiedField === "newpwd" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{t("resetChildPassword.hint")}</p>
              </div>
              <Button className="w-full" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          ) : (
            /* ─── Confirmation ─── */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("resetChildPassword.confirm")}</p>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isResetting}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("resetChildPassword.resetting")}
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      {t("resetChildPassword.resetButton")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ChildrenManagement({ familyCode }: ChildrenManagementProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { isWithinLimit, getLimit, currentTier } = useSubscriptionGate()
  const normalizedFamilyCode =
    familyCode && familyCode.trim() && familyCode !== "—" ? familyCode.trim() : null
  const { data, isLoading, isFetching, isError, refetch } = useFamilyMembers({
    enabled: Boolean(normalizedFamilyCode),
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [resetPasswordChild, setResetPasswordChild] = useState<FamilyMember | null>(null)

  const children = useMemo(() => {
    if (!data) return []
    return data.filter((member) => member.role?.toLowerCase() === "child")
  }, [data])

  const handleChildClick = (childId: string) => {
    router.push(`/dashboard/child/${childId}`)
  }

  const handleCopyId = async (e: React.MouseEvent, source?: string | null) => {
    e.stopPropagation() // Prevent card click
    if (!source) return
    try {
      await navigator.clipboard.writeText(source)
      setCopiedId(source)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("[children-management] Failed to copy value", error)
    }
  }

  if (!normalizedFamilyCode) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t("family.createFamilyPrompt")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("family.createFamilyDescription")}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || (isFetching && !data)) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("family.loadingChildren")}</p>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t("family.failedToLoadChildren")}</p>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (children.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <UserPlus className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("family.noChildren")}</p>
            <p className="text-xs text-muted-foreground">
              {t("addChild.emptyHint")}
            </p>
            <Button className="gap-2" onClick={() => setShowAddChild(true)}>
              <Plus className="w-4 h-4" />
              {t("addChild.addButton")}
            </Button>
          </CardContent>
        </Card>
        {showAddChild && normalizedFamilyCode && (
          <AddChildModal
            familyCode={normalizedFamilyCode}
            onClose={() => setShowAddChild(false)}
            onSuccess={() => {
              setShowAddChild(false)
              refetch()
            }}
            t={t}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Children limit warning */}
      {!isWithinLimit('maxChildren', children.length) && (
        <UpgradePrompt
          feature={t("featureGate.featureNames.maxChildren")}
          requiredTier={currentTier === "free" ? "basic" : currentTier === "basic" ? "premium" : "family"}
          compact
        />
      )}

      <Card>
        <CardContent className="py-6 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("family.shareCode")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold tracking-wide font-mono bg-secondary/40 px-3 py-2 rounded">
              {normalizedFamilyCode}
            </span>
            <Button variant="outline" size="sm" className="gap-2" onClick={(e) => handleCopyId(e, normalizedFamilyCode)}>
              {copiedId === normalizedFamilyCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedId === normalizedFamilyCode ? t("family.codeCopied") : t("family.copyCode")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {children.map((child, index) => (
          <Card 
            key={child.id} 
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
            onClick={() => handleChildClick(child.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                    {resolveAvatar(child, index)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg">{formatMemberName(child)}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {child.role?.toLowerCase() === "child" ? t("family.child") : child.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.age ? `${child.age} ${t("profile.days")}` : t("profile.ageNotSpecified")}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono font-semibold" title={child.id}>
                        ID: {formatShortId(child.id)}
                      </span>
                      <button
                        onClick={(e) => handleCopyId(e, child.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title={t("profile.copyId")}
                      >
                        {copiedId === child.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setResetPasswordChild(child)
                    }}
                    className="p-2 rounded-md text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    title={t("resetChildPassword.title")}
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add child button */}
      {isWithinLimit('maxChildren', children.length) && (
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => setShowAddChild(true)}
        >
          <Plus className="w-4 h-4" />
          {t("addChild.addButton")}
        </Button>
      )}

      {/* Add child modal */}
      {showAddChild && normalizedFamilyCode && (
        <AddChildModal
          familyCode={normalizedFamilyCode}
          onClose={() => setShowAddChild(false)}
          onSuccess={() => {
            setShowAddChild(false)
            refetch()
          }}
          t={t}
        />
      )}

      {/* Reset child password modal */}
      {resetPasswordChild && (
        <ResetPasswordModal
          child={resetPasswordChild}
          onClose={() => setResetPasswordChild(null)}
          t={t}
        />
      )}
    </div>
  )
}
