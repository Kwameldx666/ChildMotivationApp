"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Copy, RefreshCw, Users, ChevronRight } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import { useTranslation } from "@/i18n/provider"
import type { FamilyMember } from "@/services/family-service"

interface ChildrenManagementProps {
  familyCode?: string | null
}

const FALLBACK_AVATARS = ["👦", "👧", "🧒", "🦄"]

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

export default function ChildrenManagement({ familyCode }: ChildrenManagementProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const normalizedFamilyCode =
    familyCode && familyCode.trim() && familyCode !== "—" ? familyCode.trim() : null
  const { data, isLoading, isFetching, isError, refetch } = useFamilyMembers({
    enabled: Boolean(normalizedFamilyCode),
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t("family.noChildren")}</p>
          <p className="text-xs text-muted-foreground">
            {t("family.noChildrenDescription")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
