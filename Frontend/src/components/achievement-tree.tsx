"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAchievements } from "@/services/gamification-queries"
import { AchievementDto } from "@/services/gamification-service"
import { Crown, Flame, LucideIcon, Star, Target, Trophy, Zap } from "lucide-react"

const achievementIconMap: Record<string, LucideIcon> = {
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  crown: Crown,
  trophy: Trophy,
}

const getAchievementIcon = (icon: string) => achievementIconMap[icon] ?? Trophy

const AchievementSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-2 w-full" />
    </CardContent>
  </Card>
)

export default function AchievementTree() {
  const { data, isLoading, isError } = useAchievements()
  const achievements = data ?? []

  const renderCard = (achievement: AchievementDto) => {
    const Icon = getAchievementIcon(achievement.icon)
    const progressPercent = achievement.total > 0 ? (achievement.progress / achievement.total) * 100 : 0

    return (
      <Card
        key={achievement.id}
        className={`relative overflow-hidden transition-all ${
          achievement.unlocked ? "border-accent shadow-md shadow-accent/20" : "hover:shadow-md hover:border-primary/50"
        }`}
      >
        {achievement.unlocked && <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />}

        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                achievement.unlocked ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            {achievement.unlocked && <Badge className="bg-accent text-accent-foreground">Разблокировано!</Badge>}
          </div>
          <CardTitle className="text-base mt-2">{achievement.title}</CardTitle>
        </CardHeader>

        <CardContent className="relative">
          <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {achievement.progress} / {achievement.total}
              </span>
              <span className="font-semibold text-primary">+{achievement.rewardXp} XP</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Дерево достижений</h2>
        <p className="text-sm text-muted-foreground">Выполняйте достижения и получайте награды</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && [0, 1, 2, 3, 4, 5].map((value) => <AchievementSkeleton key={`achievement-skeleton-${value}`} />)}
        {!isLoading && isError && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Не удалось загрузить достижения.
            </CardContent>
          </Card>
        )}
        {!isLoading && !isError && achievements.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Достижения скоро появятся!
            </CardContent>
          </Card>
        )}
        {!isLoading && !isError && achievements.map(renderCard)}
      </div>
    </div>
  )
}
