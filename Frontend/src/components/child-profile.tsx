"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Flame, Copy, Check, Crown, Zap, Trophy, Star, Target, Moon, Sun, Palette } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAchievements } from "@/services/gamification-queries"
import type { AchievementDto } from "@/services/gamification-service"
import type { ChildProgressStats } from "@/hooks/use-child-progress-stats"
import { useTheme } from "next-themes"
import { useColorTheme } from "@/hooks/use-color-theme"
import ActivityHeatmap from "./activity-heatmap"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ChildProfileProps {
  childId: string
  name: string
  avatarSymbol: string
  avatarImageUrl?: string | null
  familyCode?: string
  stats?: ChildProgressStats
  statsLoading?: boolean
}

const achievementIconMap: Record<string, LucideIcon> = {
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  crown: Crown,
  trophy: Trophy,
}

const defaultStats: ChildProgressStats = {
  xp: 0,
  level: 1,
  points: 0,
  streak: 0,
  tasksCompleted: 0,
  rewardsPurchased: 0,
  totalPointsSpent: 0,
}

const rankLadder: Array<{ threshold: number; label: string }> = [
  { threshold: 1, label: "Новичок" },
  { threshold: 4, label: "Искатель" },
  { threshold: 7, label: "Мастер" },
  { threshold: 12, label: "Легенда" },
]

const resolveRank = (level: number) => {
  for (let index = rankLadder.length - 1; index >= 0; index -= 1) {
    if (level >= rankLadder[index].threshold) {
      return rankLadder[index].label
    }
  }
  return rankLadder[0].label
}

const getAchievementIcon = (icon: string) => achievementIconMap[icon] ?? Trophy

export default function ChildProfile({
  childId,
  name,
  avatarSymbol,
  avatarImageUrl,
  familyCode,
  stats,
  statsLoading,
}: ChildProfileProps) {
  const [copied, setCopied] = useState(false)
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme, themes } = useColorTheme()
  const { data: achievementsData, isLoading: achievementsLoading, isError: achievementsError } = useAchievements()
  const metrics = stats ?? defaultStats
  const rank = resolveRank(metrics.level)

  const achievementShowcase = useMemo(() => {
    if (!achievementsData) return [] as AchievementDto[]
    return [...achievementsData]
      .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
      .slice(0, 4)
  }, [achievementsData])

  const handleCopyId = () => {
    navigator.clipboard.writeText(childId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderMetricValue = (value: string, accent: string) =>
    statsLoading ? <Skeleton className="h-8 w-20" /> : <p className={`text-3xl font-bold ${accent}`}>{value}</p>

  return (
    <div className="grid gap-4">
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarImageUrl ? (
                <img src={avatarImageUrl} alt="Аватар" className="h-full w-full object-cover" />
              ) : (
                <span className="text-5xl">{avatarSymbol}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>ID профиля:</span>
                <code className="bg-secondary/30 px-3 py-1 rounded font-mono font-semibold text-xs break-all">{childId}</code>
                <Button size="sm" variant="ghost" onClick={handleCopyId} className="h-6 w-6 p-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {familyCode && (
                <p className="text-xs text-muted-foreground mt-1">
                  Код семьи: <span className="font-semibold text-foreground">{familyCode}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Настройки оформления</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Светлая/Тёмная тема */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-slate-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm">Режим</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Светлая
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Тёмная
                </>
              )}
            </Button>
          </div>

          {/* Выбор цветовой темы */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span className="text-sm">Цветовая тема</span>
            </div>
            <Select value={colorTheme} onValueChange={(value: any) => setColorTheme(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full ${t.color}`} />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Текущая серия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              {renderMetricValue(`${metrics.streak}`, "text-foreground")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">дней подряд с выполненными задачами</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ранг</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-3xl font-bold text-primary">{rank}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Уровень {metrics.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Купленные награды</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMetricValue(`${metrics.rewardsPurchased}`, "text-accent")}
            <p className="text-xs text-muted-foreground mt-1">Из магазина</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика прогресса</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[{
              label: "Баланс очков",
              value: `${metrics.points}`,
              accent: "text-secondary",
            },
            {
              label: "Набрано опыта",
              value: `${metrics.xp} XP`,
              accent: "text-accent",
            },
            {
              label: "Завершено задач",
              value: `${metrics.tasksCompleted}`,
              accent: "text-primary",
            },
            {
              label: "Списано очков",
              value: `${metrics.totalPointsSpent}`,
              accent: "text-muted-foreground",
            }].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{item.label}</p>
                {statsLoading ? <Skeleton className="h-7 w-24" /> : <p className={`text-xl font-semibold ${item.accent}`}>{item.value}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap - GitHub Style */}
      <ActivityHeatmap 
        data={[]} 
        isLoading={statsLoading}
        title="Активность за год"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievementsLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={`achievement-skeleton-${index}`}>
                  <CardContent className="pt-6 space-y-2">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!achievementsLoading && achievementsError && (
            <p className="text-sm text-destructive">Не удалось загрузить достижения.</p>
          )}

          {!achievementsLoading && !achievementsError && achievementShowcase.length === 0 && (
            <p className="text-sm text-muted-foreground">Достижения появятся, как только ты начнёшь выполнять миссии.</p>
          )}

          {!achievementsLoading && !achievementsError && achievementShowcase.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievementShowcase.map((achievement) => {
                const Icon = getAchievementIcon(achievement.icon)
                return (
                  <div
                    key={achievement.id}
                    className="text-center p-4 bg-background rounded-lg border border-border/60"
                  >
                    <div className={`mx-auto mb-2 h-12 w-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold mb-1 line-clamp-2">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{achievement.description}</p>
                    {achievement.unlocked ? (
                      <Badge className="bg-accent text-accent-foreground">Получено</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px]">
                        {achievement.progress} / {achievement.total}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
