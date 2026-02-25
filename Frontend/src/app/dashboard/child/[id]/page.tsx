"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useFamilyMembers } from "@/services/family-queries"
import { AppRoute } from "@/routes/AppRoute"
import { useAppSelector } from "@/store/hooks"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useMemo, Suspense, lazy } from "react"
import type { FamilyMember } from "@/services/family-service"
import { useChildStats } from "@/hooks/use-child-stats"

// Ленивая загрузка тяжёлого компонента профиля
const ChildProfile = lazy(() => import("@/components/child-profile"))

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

// Компонент загрузки профиля
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}

export default function ChildProfilePage() {
  const params = useParams()
  const router = useRouter()
  const session = useAppSelector(selectAuthSession)
  const childId = params.id as string

  const familyCode = session?.family?.code ?? null
  
  // Используем enabled для условной загрузки данных
  const { data: familyMembers, isLoading: membersLoading } = useFamilyMembers({ 
    enabled: Boolean(familyCode) 
  })
  
  // Используем специализированный хук для статистики ребёнка
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
    router.back()
  }

  // Показываем загрузку пока грузятся члены семьи
  if (membersLoading) {
    return (
      <AppRoute requiredRoles={["parent"]} redirectTo="/">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            <Button variant="ghost" onClick={handleBack} className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
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
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ребёнок не найден</p>
            </div>
          </div>
        </div>
      </AppRoute>
    )
  }

  return (
    <AppRoute requiredRoles={["parent"]} redirectTo="/">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <Button variant="ghost" onClick={handleBack} className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>

          <Suspense fallback={<ProfileSkeleton />}>
            <ChildProfile
              childId={child.id}
              name={formatMemberName(child)}
              avatarSymbol={resolveAvatar(child, childIndex)}
              familyCode={familyCode ?? undefined}
              stats={stats}
              statsLoading={statsLoading}
            />
          </Suspense>
        </div>
      </div>
    </AppRoute>
  )
}
