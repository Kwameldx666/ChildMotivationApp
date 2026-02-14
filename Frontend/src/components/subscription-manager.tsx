"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Users, Star, Check, ArrowRight, Loader2, Zap, BarChart3, Gift, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"
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
import { useCurrentSubscription, useChangeSubscription, useCancelSubscription } from "@/services/subscription-queries"
import type { SubscriptionDto } from "@/services/subscription-service"

const TIER_ORDER: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  family: 3,
}

interface SubscriptionManagerProps {
  currentTier?: "free" | "basic" | "premium" | "family"
  onUpgrade?: (tier: string) => void
}

const tierInfo = {
  free: {
    nameKey: "subscriptionManager.tierFree",
    icon: Star,
    color: "text-slate-600",
    gradient: "from-slate-100 to-slate-200",
    darkGradient: "dark:from-slate-800 dark:to-slate-700"
  },
  basic: {
    nameKey: "subscriptionManager.tierBasic",
    icon: Sparkles,
    color: "text-blue-600",
    gradient: "from-blue-100 to-cyan-200",
    darkGradient: "dark:from-blue-900/40 dark:to-cyan-900/40",
    price: 49,
    yearlyPrice: 499
  },
  premium: {
    nameKey: "subscriptionManager.tierPremium",
    icon: Crown,
    color: "text-purple-600",
    gradient: "from-purple-100 to-pink-200",
    darkGradient: "dark:from-purple-900/40 dark:to-pink-900/40",
    price: 99,
    yearlyPrice: 999
  },
  family: {
    nameKey: "subscriptionManager.tierFamily",
    icon: Users,
    color: "text-amber-600",
    gradient: "from-amber-100 to-orange-200",
    darkGradient: "dark:from-amber-900/40 dark:to-orange-900/40",
    price: 149,
    yearlyPrice: 1499
  }
}

export default function SubscriptionManager({ currentTier: propTier, onUpgrade }: SubscriptionManagerProps) {
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<{ id: string; name: string; price: number; yearlyPrice?: number } | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  // Загружаем реальную подписку с сервера
  const { data: subscription, isLoading, error } = useCurrentSubscription()
  const changeSubscription = useChangeSubscription()
  const cancelSubscription = useCancelSubscription()
  
  // Используем tier из API или fallback на prop
  const currentTier = subscription?.tier?.toLowerCase() as "free" | "basic" | "premium" | "family" ?? propTier ?? "free"
  const tier = tierInfo[currentTier] ?? tierInfo.free
  const TierIcon = tier.icon

  const handleSelectTier = async (tierId: string) => {
    if (tierId === currentTier) {
      toast({
        title: t("subscription.currentPlan"),
        description: t("subscription.currentlyActive"),
      })
      return
    }

    // Block downgrade — if selected tier is lower than current
    const selectedOrder = TIER_ORDER[tierId] ?? 0
    const currentOrder = TIER_ORDER[currentTier] ?? 0
    if (selectedOrder < currentOrder) {
      toast({
        title: t("subscription.downgradeBlocked"),
        description: t("subscription.cannotDowngrade"),
      })
      return
    }

    const tierData = tierInfo[tierId as keyof typeof tierInfo]
    if (tierData && 'price' in tierData) {
      setSelectedTier({
        id: tierId,
        name: t(tierData.nameKey),
        price: tierData.price,
        yearlyPrice: tierData.yearlyPrice
      })
      setShowPricingDialog(false)
      setShowPaymentModal(true)
    }
  }

  const handlePaymentSuccess = async () => {
    if (selectedTier) {
      try {
        await changeSubscription.mutateAsync({ tier: selectedTier.id, autoRenew: true })
        onUpgrade?.(selectedTier.id)
        toast({
          title: t("subscription.subscriptionChanged") + " 🎉",
          description: `${t("subscription.changePlan")} "${selectedTier.name}" ${t("common.success")}`,
        })
      } catch (err) {
        toast({
          title: t("common.error"),
          description: t("errors.serverError"),
          variant: "destructive",
        })
      }
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync()
      toast({
        title: t("subscriptionManager.subscriptionCancelled"),
        description: t("subscriptionManager.switchedToFree"),
      })
      onUpgrade?.("free")
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("subscriptionManager.cancelError"),
        variant: "destructive",
      })
    }
  }

  // Показываем загрузку только при первом запросе (нет кэша)
  if (isLoading && !subscription) {
    return (
      <Card className="overflow-hidden">
        <div className={cn("h-2 bg-gradient-to-r", tier.gradient)} />
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Форматируем дату окончания подписки
  const formatEndDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
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
                <CardTitle className="text-xl">{t("subscription.currentSubscription")}</CardTitle>
                <CardDescription>{t("subscription.managePlan")}</CardDescription>
              </div>
            </div>
            {currentTier !== "free" && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                {t("subscription.currentlyActive")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="font-semibold text-lg">{t(tier.nameKey)}</p>
              <p className="text-sm text-muted-foreground">
                {currentTier === "free" && t("subscription.tierDescriptions.free")}
                {currentTier === "basic" && t("subscription.tierDescriptions.basic")}
                {currentTier === "premium" && t("subscription.tierDescriptions.premium")}
                {currentTier === "family" && t("subscription.tierDescriptions.family")}
              </p>
            </div>
            {currentTier === "free" && (
              <Button onClick={() => setShowPricingDialog(true)} className="gap-2">
                <Crown className="h-4 w-4" />
                {t("subscription.upgrade")}
              </Button>
            )}
          </div>

          {currentTier !== "free" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">{t("subscriptionManager.validUntil")}</p>
                  <p className="font-semibold">
                    {subscription?.endDate ? formatEndDate(subscription.endDate) : t("common.none")}
                  </p>
                  {subscription?.daysRemaining != null && (
                    <p className="text-xs text-muted-foreground">
                      {t("common.daysRemaining", { days: subscription.daysRemaining })}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">{t("common.price")}</p>
                  <p className="font-semibold">
                    {subscription?.pricePerMonth ?  (subscription.pricePerMonth + " " + t("subscription.perMonth")) : "-"}
                  </p>
                  {subscription?.autoRenew && (
                    <p className="text-xs text-green-600">{t("subscription.autoRenewal")}</p>
                  )}
                </div>
              </div>

              {/* Feature access indicators */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t("subscriptionManager.includedFeatures")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className={cn("h-4 w-4", subscription?.hasAIAssistant ? "text-amber-500" : "text-muted-foreground/30")} />
                    <span className={cn(subscription?.hasAIAssistant ? "text-foreground" : "text-muted-foreground line-through")}>
                      {t("subscriptionManager.featureAI")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className={cn("h-4 w-4", subscription?.hasAdvancedAnalytics ? "text-blue-500" : "text-muted-foreground/30")} />
                    <span className={cn(subscription?.hasAdvancedAnalytics ? "text-foreground" : "text-muted-foreground line-through")}>
                      {t("subscriptionManager.featureAnalytics")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className={cn("h-4 w-4", subscription?.hasCustomRewards ? "text-pink-500" : "text-muted-foreground/30")} />
                    <span className={cn(subscription?.hasCustomRewards ? "text-foreground" : "text-muted-foreground line-through")}>
                      {t("subscriptionManager.featureRewards")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className={cn("h-4 w-4", subscription?.hasPrioritySupport ? "text-green-500" : "text-muted-foreground/30")} />
                    <span className={cn(subscription?.hasPrioritySupport ? "text-foreground" : "text-muted-foreground line-through")}>
                      {t("subscriptionManager.featureSupport")}
                    </span>
                  </div>
                </div>
                {/* Limits */}
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("subscriptionManager.limitChildren")}</span>
                    <span className="font-medium text-foreground">
                      {subscription?.maxChildren === 0 ? "∞" : subscription?.maxChildren}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("subscriptionManager.limitTasks")}</span>
                    <span className="font-medium text-foreground">
                      {subscription?.maxTasksPerDay === 0 ? "∞" : subscription?.maxTasksPerDay}{t("subscriptionManager.perDay")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPricingDialog(true)} className="flex-1">
                  {t("subscription.changePlan")}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("subscription.cancel")
                  )}
                </Button>
              </div>
            </>
          )}

          {currentTier === "free" && (
            <div className="space-y-3 pt-4 border-t">
              <p className="font-medium text-sm mb-3">{t("subscription.upgradeBenefits")}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t("subscription.benefit1")}</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t("subscription.benefit2")}</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                  <Gift className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t("subscription.benefit3")}</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                  <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t("subscription.benefit4")}</span>
                </div>
              </div>
              {/* Quick upgrade CTA */}
              <Button
                onClick={() => setShowPricingDialog(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 h-11"
              >
                <Crown className="h-4 w-4" />
                {t("subscriptionManager.viewPlans")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">{t("subscription.chooseYourPlan")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("subscription.upgradeDescription")}
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
        tierId={selectedTier?.id}
        price={selectedTier?.price || 0}
        yearlyPrice={selectedTier?.yearlyPrice}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
