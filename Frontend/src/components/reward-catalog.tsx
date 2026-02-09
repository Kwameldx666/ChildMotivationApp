"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface Reward {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  category: string
  difficulty: "easy" | "medium" | "hard"
  popular: boolean
}

const getCatalogRewards = (t: (key: string) => string): Reward[] => [
  {
    id: "1",
    name: t("rewardCatalog.items.movieTrip.name"),
    description: t("rewardCatalog.items.movieTrip.description"),
    icon: "🎬",
    cost: 500,
    category: "entertainment",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "2",
    name: t("rewardCatalog.items.pizza.name"),
    description: t("rewardCatalog.items.pizza.description"),
    icon: "🍕",
    cost: 150,
    category: "food",
    difficulty: "easy",
    popular: true,
  },
  {
    id: "3",
    name: t("rewardCatalog.items.avatarSkin.name"),
    description: t("rewardCatalog.items.avatarSkin.description"),
    icon: "🎨",
    cost: 200,
    category: "digital",
    difficulty: "medium",
    popular: false,
  },
  {
    id: "4",
    name: t("rewardCatalog.items.chocolate.name"),
    description: t("rewardCatalog.items.chocolate.description"),
    icon: "🍫",
    cost: 50,
    category: "food",
    difficulty: "easy",
    popular: false,
  },
  {
    id: "5",
    name: t("rewardCatalog.items.videoGame.name"),
    description: t("rewardCatalog.items.videoGame.description"),
    icon: "🎮",
    cost: 800,
    category: "technology",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "6",
    name: t("rewardCatalog.items.dayOff.name"),
    description: t("rewardCatalog.items.dayOff.description"),
    icon: "😎",
    cost: 300,
    category: "privilege",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "7",
    name: t("rewardCatalog.items.book.name"),
    description: t("rewardCatalog.items.book.description"),
    icon: "📚",
    cost: 250,
    category: "education",
    difficulty: "medium",
    popular: false,
  },
  {
    id: "8",
    name: t("rewardCatalog.items.sneakers.name"),
    description: t("rewardCatalog.items.sneakers.description"),
    icon: "👟",
    cost: 1000,
    category: "clothing",
    difficulty: "hard",
    popular: false,
  },
]

export default function RewardCatalog() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const CATALOG_REWARDS = getCatalogRewards(t)

  const categories = Array.from(new Set(CATALOG_REWARDS.map((r) => r.category)))

  const filteredRewards = selectedCategory
    ? CATALOG_REWARDS.filter((r) => r.category === selectedCategory)
    : CATALOG_REWARDS

  const popularRewards = CATALOG_REWARDS.filter((r) => r.popular)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return t("rewardCatalog.difficulty.easy")
      case "medium":
        return t("rewardCatalog.difficulty.medium")
      case "hard":
        return t("rewardCatalog.difficulty.hard")
      default:
        return ""
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("rewardCatalog.title")}</h1>
        <p className="text-muted-foreground">{t("rewardCatalog.subtitle")}</p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">{t("rewardCatalog.popularRewards")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {popularRewards.map((reward) => (
            <Card key={reward.id} className="hover:shadow-lg transition-all border-2 border-accent/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <h3 className="font-semibold mb-1">{reward.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accent">{reward.cost} pts</span>
                    <Button size="sm" onClick={() => {}}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t("rewardCatalog.allRewards")}</h2>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            {t("rewardCatalog.filters")}
          </Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            {t("common.all")}
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {t(`rewardCatalog.categories.${category}`)}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{reward.icon}</div>
                  <Badge className={getDifficultyColor(reward.difficulty)}>
                    {getDifficultyLabel(reward.difficulty)}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{reward.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-bold text-accent">{reward.cost} {t("rewardCatalog.points")}</span>
                  <Button size="sm" onClick={() => {}}>
                    <Plus className="w-3 h-3 mr-1" />
                    {t("rewardCatalog.add")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
