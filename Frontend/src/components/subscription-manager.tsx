"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Users, Star, Check, ArrowRight, Loader2, Zap, BarChart3, Gift, ShieldCheck, Calendar, CreditCard } from "lucide-react"
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
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    accent: "border-slate-200 dark:border-slate-700",
    gradient: "from-slate-100 to-slate-200",
    price: 0,
    yearlyPrice: 0,
  },
  basic: {
    nameKey: "subscriptionManager.tierBasic",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    accent: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-100 to-cyan-200",
    price: 299,
    yearlyPrice: 2990,
  },
  premium: {
    nameKey: "subscriptionManager.tierPremium",
    icon: Crown,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    accent: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-100 to-pink-200",
    price: 599,
    yearlyPrice: 5990,
  },
  family: {
    nameKey: "subscriptionManager.tierFamily",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    accent: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-100 to-orange-200",
    price: 999,
    yearlyPrice: 9990,
  },
}

export default function SubscriptionManager({ currentTier: propTier, onUpgrade }: SubscriptionManagerProps) {
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<{ id: string; name: string; price: number; yearlyPrice?: number } | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const { data: subscription, isLoading } = useCurrentSubscription()
  const changeSubscription = useChangeSubscription()
  const cancelSubscription = useCancelSubscription()
  
  const currentTier = subscription?.tier?.toLowerCase() as "free" | "basic" | "premium" | "family" ?? propTier ?? "free"
  const tier = tierInfo[currentTier] ?? tierInfo.free
  const TierIcon = tier.icon
  const isFree = currentTier === "free"

  const handleSelectTier = async (tierId: string) => {
    if (tierId === currentTier) {
      toast({ title: t("subscription.currentPlan"), description: t("subscription.currentlyActive") })
      return
    }
    const selectedOrder = TIER_ORDER[tierId] ?? 0
    const currentOrder = TIER_ORDER[currentTier] ?? 0
    if (selectedOrder < currentOrder) {
      toast({ title: t("subscription.downgradeBlocked"), description: t("subscription.cannotDowngrade") })
      return
    }
    const tierData = tierInfo[tierId as keyof typeof tierInfo]
    if (tierData && tierData.price > 0) {
      setSelectedTier({
        id: tierId,
        name: t(tierData.nameKey),
        price: tierData.price,
        yearlyPrice: tierData.yearlyPrice,
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
      } catch {
        toast({ title: t("common.error"), description: t("errors.serverError"), variant: "destructive" })
      }
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync()
      toast({ title: t("subscriptionManager.subscriptionCancelled"), description: t("subscriptionManager.switchedToFree") })
      onUpgrade?.("free")
    } catch {
      toast({ title: t("common.error"), description: t("subscriptionManager.cancelError"), variant: "destructive" })
    }
  }

  if (isLoading && !subscription) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const formatEndDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
  }

  // Feature items for paid tiers
  const features = [
    { icon: Zap, label: t("subscriptionManager.featureAI"), active: subscription?.hasAIAssistant, activeColor: "text-amber-500" },
    { icon: BarChart3, label: t("subscriptionManager.featureAnalytics"), active: subscription?.hasAdvancedAnalytics, activeColor: "text-blue-500" },
    { icon: Gift, label: t("subscriptionManager.featureRewards"), active: subscription?.hasCustomRewards, activeColor: "text-pink-500" },
    { icon: ShieldCheck, label: t("subscriptionManager.featureSupport"), active: subscription?.hasPrioritySupport, activeColor: "text-green-500" },
  ]

  /* Values >= 1 billion are effectively unlimited (server sends INT_MAX = 2147483647) */
  const isUnlimited = (v: number | null | undefined) => !v || v >= 1_000_000_000
  const displayChildren = isUnlimited(subscription?.maxChildren) ? "∞" : subscription?.maxChildren
  const displayTasks = isUnlimited(subscription?.maxTasksPerDay)
    ? `∞${t("subscriptionManager.perDay")}`
    : `${subscription?.maxTasksPerDay}${t("subscriptionManager.perDay")}`

  return (
    <>
      <Card className={cn("overflow-hidden border", tier.accent)}>
        {/* Compact header row */}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tier.bg)}>
              <TierIcon className={cn("h-5 w-5", tier.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base truncate">{t(tier.nameKey)}</span>
                {!isFree && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5 gap-1 shrink-0">
                    <Check className="h-2.5 w-2.5" />
                    {t("subscription.currentlyActive")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {t(`subscription.tierDescriptions.${currentTier}`)}
              </p>
            </div>
            <Button
              size="sm"
              variant={isFree ? "default" : "outline"}
              className={cn(
                "shrink-0 h-9 text-sm gap-1.5",
                isFree && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              )}
              onClick={() => setShowPricingDialog(true)}
            >
              <Crown className="h-3.5 w-3.5" />
              {isFree ? t("subscription.upgrade") : t("subscription.changePlan")}
            </Button>
          </div>

          {/* Paid tier: compact info + features */}
          {!isFree && (
            <>
              {/* Stats row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Price chip */}
                <div className="inline-flex items-center gap-1.5 text-sm bg-muted/60 rounded-md px-2.5 py-1.5">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {subscription?.pricePerMonth ? `${subscription.pricePerMonth} ${t("subscription.currency")} ${t("subscription.perMonth")}` : "—"}
                  </span>
                  {subscription?.autoRenew && (
                    <span className="text-green-600 text-[10px]">• {t("subscription.autoRenewal")}</span>
                  )}
                </div>
                {/* Validity chip */}
                {subscription?.endDate && (
                  <div className="inline-flex items-center gap-1.5 text-sm bg-muted/60 rounded-md px-2.5 py-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{t("subscriptionManager.validUntil")} {formatEndDate(subscription.endDate)}</span>
                    {subscription.daysRemaining != null && (
                      <span className="text-muted-foreground">({subscription.daysRemaining}д)</span>
                    )}
                  </div>
                )}
                {/* Limits chips */}
                <div className="inline-flex items-center gap-1.5 text-sm bg-muted/60 rounded-md px-2.5 py-1.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{displayChildren}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-sm bg-muted/60 rounded-md px-2.5 py-1.5">
                  <Check className="h-3 w-3 text-muted-foreground" />
                  <span>{displayTasks}</span>
                </div>
              </div>

              {/* Features as inline chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {features.map(({ icon: Icon, label, active, activeColor }) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border",
                      active
                        ? "bg-background border-border/60 text-foreground"
                        : "bg-muted/30 border-transparent text-muted-foreground/50 line-through"
                    )}
                  >
                    <Icon className={cn("h-3 w-3", active ? activeColor : "text-muted-foreground/30")} />
                    {label}
                  </span>
                ))}
              </div>

              {/* Cancel button */}
              <div className="pt-1">
                <button
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  ) : null}
                  {t("subscription.cancel")}
                </button>
              </div>
            </>
          )}

          {/* Free tier: compact upgrade prompt */}
          {isFree && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {[
                  { icon: Zap, text: t("subscription.benefit1"), color: "text-amber-500" },
                  { icon: BarChart3, text: t("subscription.benefit2"), color: "text-blue-500" },
                  { icon: Gift, text: t("subscription.benefit3"), color: "text-pink-500" },
                  { icon: ShieldCheck, text: t("subscription.benefit4"), color: "text-green-500" },
                ].map(({ icon: Icon, text, color }) => (
                  <span key={text} className="inline-flex items-center gap-1 text-xs text-foreground/80">
                    <Icon className={cn("h-3 w-3 shrink-0", color)} />
                    <span className="truncate">{text}</span>
                  </span>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 h-7 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 gap-1"
                onClick={() => setShowPricingDialog(true)}
              >
                {t("subscriptionManager.viewPlans")}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="text-lg">{t("subscription.chooseYourPlan")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("subscription.upgradeDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-5 overflow-y-auto">
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
