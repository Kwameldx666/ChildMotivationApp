import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Edit2, Trash2 } from "lucide-react"

interface RewardsShopProps {
  userType: "parent" | "child"
}

const MOCK_REWARDS = [
  {
    id: 1,
    title: "Час игр на консоли",
    icon: "🎮",
    cost: 500,
    description: "Час свободной игры на PlayStation или Xbox",
  },
  {
    id: 2,
    title: "Пиццерия на выбор",
    icon: "🍕",
    cost: 1000,
    description: "Выбери пиццерию и заказ на семью",
  },
  {
    id: 3,
    title: "Фильм вечеров",
    icon: "🎬",
    cost: 300,
    description: "Выбери фильм для семейного кино",
  },
  {
    id: 4,
    title: "Поездка в парк развлечений",
    icon: "🎡",
    cost: 2000,
    description: "Поездка в парк выходного дня вся семьей",
  },
  {
    id: 5,
    title: "Новая книга",
    icon: "📚",
    cost: 400,
    description: "Выбери любую книгу из магазина",
  },
  {
    id: 6,
    title: "День без домашних дел",
    icon: "😎",
    cost: 1500,
    description: "Один день перерыва от всех задач",
  },
]

export default function RewardsShop({ userType }: RewardsShopProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MOCK_REWARDS.map((reward) => (
        <Card
          key={reward.id}
          className={`hover:shadow-lg transition-shadow ${userType === "parent" ? "cursor-pointer" : ""}`}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-5xl mb-3">{reward.icon}</div>
              <h3 className="font-bold text-lg mb-2 text-balance">{reward.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>

              <div className="flex items-center justify-center gap-2 mb-4 bg-accent/10 py-2 px-3 rounded-lg">
                <span className="font-bold text-lg text-accent">{reward.cost}</span>
                <span className="text-sm text-accent font-semibold">очков</span>
              </div>

              {userType === "child" && (
                <Button className="w-full gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Купить
                </Button>
              )}

              {userType === "parent" && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
