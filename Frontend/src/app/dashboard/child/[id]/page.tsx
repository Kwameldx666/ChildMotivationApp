"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useFamilyMembers } from "@/services/family-queries"
import { AppRoute } from "@/routes/AppRoute"
import { useAppSelector } from "@/store/hooks"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useMemo, Suspense, lazy } from "react"
import type { FamilyMember } from "@/services/family-service"
import { useChildStats } from "@/hooks/use-child-stats"
import { useTranslation } from "@/i18n/provider"

// Parent-friendly profile card (clean style matching parent dashboard)
const ChildProfileCard = lazy(() => import("@/components/child-profile-card"))

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

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  )
}

export default function ChildProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const childId = params.id as string

  const { data: familyMembers, isLoading: membersLoading } = useFamilyMembers({
    enabled: true
  })

  const { stats, isLoading: statsLoading } = useChildStats({
    childId,
    enabled: Boolean(childId)
  })

  const child = useMemo(() => {
    if (!familyMembers) return null
    return familyMembers.find((m) => m.id === childId) ?? null
  }, [familyMembers, childId])

  const childIndex = useMemo(() => {
    if (!familyMembers || !child) return 0
    const children = familyMembers.filter((m) => m.role?.toLowerCase() === "child")
    return children.findIndex((c) => c.id === childId)
  }, [familyMembers, child, childId])

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard/parent")
    }
  }

  if (membersLoading) {
    return (
      <AppRoute requiredRoles={["parent"]} redirectTo="/">
        <div className="min-h-screen bg-background">
          {/* Header matching parent dashboard */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-9 w-9 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{t("profilePage.title")}</span>
            </div>
          </header>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <ProfileSkeleton />
          </div>
        </div>
      </AppRoute>
    )
  }

  if (!child) {
    return (
      <AppRoute requiredRoles={["parent"]} redirectTo="/">
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-9 w-9 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{t("profilePage.title")}</span>
            </div>
          </header>
          <div className="text-center py-16">
            <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Ребёнок не найден</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={handleBack}>
              {t("common.back") || "Назад"}
            </Button>
          </div>
        </div>
      </AppRoute>
    )
  }

  return (
    <AppRoute requiredRoles={["parent"]} redirectTo="/">
      <div className="min-h-screen bg-background">
        {/* Header — same style as parent dashboard */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold">{formatMemberName(child)}</span>
              <p className="text-xs text-muted-foreground">{t("profilePage.title")}</p>
            </div>
          </div>
        </header>

        {/* Content — clean parent-style layout */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Suspense fallback={<ProfileSkeleton />}>
            <ChildProfileCard
              childId={child.id}
              name={formatMemberName(child)}
              avatarSymbol={resolveAvatar(child, childIndex)}
              stats={stats}
              statsLoading={statsLoading}
            />
          </Suspense>
        </div>
      </div>
    </AppRoute>
  )
}
