"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Copy, RefreshCw, Users, Eye } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import type { FamilyMember } from "@/services/family-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ChildProfile from "./child-profile"
import { useChildProgressStats } from "@/hooks/use-child-progress-stats"

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
  const normalizedFamilyCode =
    familyCode && familyCode.trim() && familyCode !== "—" ? familyCode.trim() : null
  const { data, isLoading, isFetching, isError, refetch } = useFamilyMembers({
    enabled: Boolean(normalizedFamilyCode),
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<FamilyMember | null>(null)
  const { stats, isLoading: statsLoading } = useChildProgressStats(selectedChild?.id)

  const children = useMemo(() => {
    if (!data) return []
    return data.filter((member) => member.role?.toLowerCase() === "child")
  }, [data])

  const handleCopyId = async (source?: string | null) => {
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
          <h3 className="text-lg font-semibold">Создайте семью</h3>
          <p className="text-sm text-muted-foreground">
            Чтобы видеть подключенных детей, создайте семью и поделитесь кодом с ребёнком
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
          <p className="text-sm text-muted-foreground">Загружаем список подключённых детей…</p>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Не удалось получить список детей</p>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Пока ни один ребёнок не подключился</p>
          <p className="text-xs text-muted-foreground">
            Передайте код семьи <span className="font-semibold">{normalizedFamilyCode}</span> ребёнку.
            После подключения его профиль появится здесь автоматически.
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
            Поделитесь кодом семьи, чтобы ребёнок смог присоединиться:
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-semibold tracking-wide font-mono bg-secondary/40 px-3 py-2 rounded">
              {normalizedFamilyCode}
            </span>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopyId(normalizedFamilyCode)}>
              {copiedId === normalizedFamilyCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedId === normalizedFamilyCode ? "Скопировано" : "Скопировать код"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {children.map((child, index) => (
          <Card key={child.id}>
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
                        {child.role?.toLowerCase() === "child" ? "Ребёнок" : child.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.age ? `${child.age} лет` : "Возраст не указан"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-secondary/20 px-2 py-1 rounded font-mono font-semibold" title={child.id}>
                        ID: {formatShortId(child.id)}
                      </span>
                      <button
                        onClick={() => handleCopyId(child.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Скопировать ID"
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSelectedChild(child)}
                >
                  <Eye className="w-4 h-4" />
                  Профиль
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Модальное окно с профилем ребёнка */}
      <Dialog open={!!selectedChild} onOpenChange={(open) => !open && setSelectedChild(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Профиль ребёнка</DialogTitle>
          </DialogHeader>
          {selectedChild && (
            <ChildProfile
              childId={selectedChild.id}
              name={formatMemberName(selectedChild)}
              avatarSymbol={resolveAvatar(selectedChild, children.findIndex(c => c.id === selectedChild.id))}
              avatarImageUrl={selectedChild.avatarImageUrl}
              familyCode={normalizedFamilyCode ?? undefined}
              stats={stats}
              statsLoading={statsLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
