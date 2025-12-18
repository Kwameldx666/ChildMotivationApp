"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter } from "lucide-react"

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

const CATALOG_REWARDS: Reward[] = [
  {
    id: "1",
    name: "Поход в кино",
    description: "Семейный вечер в кинотеатре на фильм по выбору",
    icon: "🎬",
    cost: 500,
    category: "Развлечение",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "2",
    name: "Пицца",
    description: "Заказ пиццы на ужин",
    icon: "🍕",
    cost: 150,
    category: "Еда",
    difficulty: "easy",
    popular: true,
  },
  {
    id: "3",
    name: "Новый скин для аватара",
    description: "Цифровой скин, меняющий внешний вид персонажа",
    icon: "🎨",
    cost: 200,
    category: "Цифровое",
    difficulty: "medium",
    popular: false,
  },
  {
    id: "4",
    name: "Шоколад",
    description: "Плитка качественного шоколада",
    icon: "🍫",
    cost: 50,
    category: "Еда",
    difficulty: "easy",
    popular: false,
  },
  {
    id: "5",
    name: "Видеоигра",
    description: "Выбор игры в App Store или Steam",
    icon: "🎮",
    cost: 800,
    category: "Технология",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "6",
    name: "День без домашних дел",
    description: "Полный день без выполнения обязанностей",
    icon: "😎",
    cost: 300,
    category: "Привилегия",
    difficulty: "hard",
    popular: true,
  },
  {
    id: "7",
    name: "Книга",
    description: "Любимая книга или комикс",
    icon: "📚",
    cost: 250,
    category: "Обучение",
    difficulty: "medium",
    popular: false,
  },
  {
    id: "8",
    name: "Новые кроссовки",
    description: "Кроссовки на выбор",
    icon: "👟",
    cost: 1000,
    category: "Одежда",
    difficulty: "hard",
    popular: false,
  },
]

export default function RewardCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
        return "Легко"
      case "medium":
        return "Средне"
      case "hard":
        return "Сложно"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Каталог наград</h1>
        <p className="text-muted-foreground">Предложенные награды для вдохновения</p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Популярные награды</h2>
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
          <h2 className="text-xl font-bold">Все награды</h2>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Фильтры
          </Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            Все
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
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
                  <span className="font-bold text-accent">{reward.cost} очков</span>
                  <Button size="sm" onClick={() => {}}>
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить
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
