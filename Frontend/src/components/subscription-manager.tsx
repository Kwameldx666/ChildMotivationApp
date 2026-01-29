"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Users, Star, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import PremiumPricing from "./premium-pricing"
import PaymentModal from "./payment-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionManagerProps {
  currentTier?: "free" | "basic" | "premium" | "family"
  onUpgrade?: (tier: string) => void
}

const tierInfo = {
  free: {
    name: "Бесплатный",
    icon: Star,
    color: "text-slate-600",
    gradient: "from-slate-100 to-slate-200"
  },
  basic: {
    name: "Базовый",
    icon: Sparkles,
    color: "text-blue-600",
    gradient: "from-blue-100 to-cyan-200",
    price: 4.99
  },
  premium: {
    name: "Премиум",
    icon: Crown,
    color: "text-purple-600",
    gradient: "from-purple-100 to-pink-200",
    price: 9.99
  },
  family: {
    name: "Семейный",
    icon: Users,
    color: "text-amber-600",
    gradient: "from-amber-100 to-orange-200",
    price: 14.99
  }
}

export default function SubscriptionManager({ currentTier = "free", onUpgrade }: SubscriptionManagerProps) {
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<{ id: string; name: string; price: number } | null>(null)
  const { toast } = useToast()
  const tier = tierInfo[currentTier]
  const TierIcon = tier.icon

  const handleSelectTier = (tierId: string) => {
    if (tierId === "free") {
      toast({
        title: "Бесплатный тариф",
        description: "Вы уже используете бесплатный тариф",
      })
      return
    }

    const tierData = tierInfo[tierId as keyof typeof tierInfo]
    if (tierData && 'price' in tierData) {
      setSelectedTier({
        id: tierId,
        name: tierData.name,
        price: tierData.price
      })
      setShowPricingDialog(false)
      setShowPaymentModal(true)
    }
  }

  const handlePaymentSuccess = () => {
    if (selectedTier) {
      onUpgrade?.(selectedTier.id)
      toast({
        title: "Подписка активирована! 🎉",
        description: `Тариф "${selectedTier.name}" успешно подключён`,
      })
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className={cn("h-2 bg-gradient-to-r", tier.gradient)} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br", tier.gradient)}>
                <TierIcon className={cn("h-6 w-6", tier.color)} />
              </div>
              <div>
                <CardTitle className="text-xl">Текущая подписка</CardTitle>
                <CardDescription>Управление тарифным планом</CardDescription>
              </div>
            </div>
            {currentTier !== "free" && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Активна
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="font-semibold text-lg">{tier.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentTier === "free" && "Основные функции приложения"}
                {currentTier === "basic" && "Расширенные возможности для активных семей"}
                {currentTier === "premium" && "Все возможности приложения"}
                {currentTier === "family" && "Максимальные возможности для больших семей"}
              </p>
            </div>
            {currentTier === "free" && (
              <Button onClick={() => setShowPricingDialog(true)} className="gap-2">
                <Crown className="h-4 w-4" />
                Улучшить
              </Button>
            )}
          </div>

          {currentTier !== "free" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Следующий платеж</p>
                  <p className="font-semibold">20 февраля 2026</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Сумма</p>
                  <p className="font-semibold">
                    {currentTier === "basic" && "$4.99"}
                    {currentTier === "premium" && "$9.99"}
                    {currentTier === "family" && "$14.99"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPricingDialog(true)} className="flex-1">
                  Изменить план
                </Button>
                <Button variant="outline" className="flex-1">
                  Отменить подписку
                </Button>
              </div>
            </>
          )}

          {currentTier === "free" && (
            <div className="space-y-2 pt-4 border-t">
              <p className="font-medium text-sm mb-3">Преимущества премиум подписки:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">AI помощник для умных рекомендаций</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">Неограниченное количество задач и детей</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">Продвинутая аналитика и отчеты</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">Эксклюзивные награды и достижения</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">Выберите план</DialogTitle>
            <DialogDescription className="text-sm">
              Улучшите подписку для доступа к расширенным функциям
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <PremiumPricing currentTier={currentTier} onSelectTier={handleSelectTier} />
          </div>
        </DialogContent>
      </Dialog>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tierName={selectedTier?.name || ""}
        price={selectedTier?.price || 0}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
