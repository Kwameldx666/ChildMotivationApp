"use client"

import { ArrowLeft, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/i18n/provider"

interface RewardHistoryPageProps {
  onBack: () => void
}

export default function RewardHistoryPage({ onBack }: RewardHistoryPageProps) {
  const { t } = useTranslation()
  const purchases = [
    { date: t("rewardHistory.dateDec20"), reward: t("rewardHistory.pizza"), cost: 500, user: t("rewardHistory.userMaria") },
    { date: t("rewardHistory.dateDec18"), reward: t("rewardHistory.cinemaTrip"), cost: 750, user: t("rewardHistory.userIvan") },
    { date: t("rewardHistory.dateDec15"), reward: t("rewardHistory.newGame"), cost: 1000, user: t("rewardHistory.userIvan") },
    { date: t("rewardHistory.dateDec10"), reward: t("rewardHistory.stickerPack"), cost: 100, user: t("rewardHistory.userMaria") },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {t("rewardHistory.title")}
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {purchases.map((purchase, idx) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{purchase.reward}</p>
                  <p className="text-xs text-muted-foreground">{purchase.user}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">-{purchase.cost}</p>
                  <p className="text-xs text-muted-foreground">{purchase.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  )
}
