"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Check, Loader2, Crown, Shield, ArrowLeft, Sparkles, Zap, ChevronRight, Users, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/i18n/provider"
import { cn } from "@/lib/utils"

type Step = "summary" | "payment" | "processing" | "success"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  tierName: string
  tierId?: string
  price: number
  yearlyPrice?: number
  onSuccess?: () => void
}

const tierMeta: Record<string, { icon: typeof Crown; gradient: string; emoji: string; color: string }> = {
  basic: { icon: Sparkles, gradient: "from-blue-500 to-indigo-600", emoji: "⚡", color: "text-blue-600" },
  premium: { icon: Crown, gradient: "from-purple-500 to-pink-600", emoji: "👑", color: "text-purple-600" },
  family: { icon: Users, gradient: "from-amber-500 to-orange-600", emoji: "👨‍👩‍👧‍👦", color: "text-amber-600" },
}

export default function PaymentModal({ open, onClose, tierName, tierId, price, yearlyPrice, onSuccess }: PaymentModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>("summary")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { toast } = useToast()

  const meta = tierMeta[(tierId ?? tierName)?.toLowerCase()] ?? tierMeta.premium
  const TierIcon = meta.icon
  const displayPrice = billingCycle === "yearly" && yearlyPrice ? yearlyPrice : price
  const monthlySavings = yearlyPrice && price > 0 ? Math.round((1 - yearlyPrice / (price * 12)) * 100) : 0

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("summary")
      setBillingCycle("monthly")
      setAgreedToTerms(false)
    }
  }, [open])

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(" ") : cleaned
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 16) setCardNumber(formatCardNumber(value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 4) setCardExpiry(formatExpiry(value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 3) setCardCvv(value)
  }

  const isCardValid = cardNumber.replace(/\s/g, "").length === 16 &&
    cardExpiry.length === 5 && cardCvv.length === 3 && cardName.length > 2

  const handleProceedToPayment = () => setStep("payment")

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCardValid) {
      toast({
        title: t("paymentModal.errorTitle"),
        description: t("paymentModal.fillAllFields"),
        variant: "destructive",
      })
      return
    }

    setStep("processing")

    // TODO: Real payment provider integration (Stripe, YooKassa)
    // In production this would call the payment provider API
    // After successful payment — onSuccess() activates the subscription via our API
    setTimeout(() => {
      setStep("success")
      toast({
        title: t("paymentModal.paymentSuccess"),
        description: t("paymentModal.subscriptionActivatedToast", { tierName }),
      })

      setTimeout(() => {
        onSuccess?.()
        handleReset()
        onClose()
      }, 2500)
    }, 2200)
  }

  const handleReset = () => {
    setCardNumber("")
    setCardExpiry("")
    setCardCvv("")
    setCardName("")
    setStep("summary")
    setAgreedToTerms(false)
  }

  const handleClose = () => {
    if (step === "processing" || step === "success") return
    handleReset()
    onClose()
  }

  // ─── Step 1: Plan Summary ─────────────────────────────────────────
  const renderSummary = () => (
    <div className="space-y-5">
      {/* Plan card */}
      <div className={cn("relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br", meta.gradient)}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-2xl">
            {meta.emoji}
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/70 font-medium">{t("paymentModal.subscribingTo")}</p>
            <h3 className="text-xl font-bold">{tierName}</h3>
          </div>
        </div>
      </div>

      {/* Billing cycle selector */}
      {yearlyPrice != null && yearlyPrice > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("paymentModal.billingCycle")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "relative rounded-xl border-2 p-3 text-left transition-all",
                billingCycle === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <p className="text-sm font-semibold text-foreground">{t("paymentModal.monthly")}</p>
              <p className="text-lg font-bold text-foreground">{price.toFixed(0)} lei<span className="text-xs font-normal text-muted-foreground">/{t("paymentModal.mo")}</span></p>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "relative rounded-xl border-2 p-3 text-left transition-all",
                billingCycle === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              {monthlySavings > 0 && (
                <span className="absolute -top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{monthlySavings}%
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{t("paymentModal.yearly")}</p>
              <p className="text-lg font-bold text-foreground">{(yearlyPrice / 12).toFixed(0)} lei<span className="text-xs font-normal text-muted-foreground">/{t("paymentModal.mo")}</span></p>
              <p className="text-[11px] text-muted-foreground">{yearlyPrice.toFixed(0)} lei/{t("paymentModal.year")}</p>
            </button>
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("paymentModal.plan")}</span>
          <span className="font-medium text-foreground">{tierName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("paymentModal.billing")}</span>
          <span className="font-medium text-foreground">
            {billingCycle === "yearly" ? t("paymentModal.yearly") : t("paymentModal.monthly")}
          </span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-semibold text-foreground">{t("paymentModal.totalAmount")}</span>
          <div className="text-right">
            <span className="text-lg font-bold text-foreground">
              {billingCycle === "yearly" && yearlyPrice ? yearlyPrice.toFixed(0) : displayPrice.toFixed(0)} lei
            </span>
            <span className="text-xs text-muted-foreground block">
              {billingCycle === "yearly" ? t("paymentModal.perYear") : t("paymentModal.perMonthShort")}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleProceedToPayment}
        className={cn("w-full bg-gradient-to-r text-white hover:opacity-90 h-11", meta.gradient)}
      >
        {t("paymentModal.continueToPayment")}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )

  // ─── Step 2: Payment Details ──────────────────────────────────────
  const renderPayment = () => (
    <form onSubmit={handleSubmitPayment} className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={() => setStep("summary")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("paymentModal.backToPlan")}
      </button>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4" />
            {t("paymentModal.cardDetails")}
          </CardTitle>
          <CardDescription className="text-xs flex items-center gap-1 text-foreground/60">
            <Shield className="h-3 w-3" />
            {t("paymentModal.cardSecure")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-foreground">{t("paymentModal.cardNumber")}</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="font-mono bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName" className="text-foreground">{t("paymentModal.cardholderName")}</Label>
            <Input
              id="cardName"
              placeholder="IVAN IVANOV"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              className="uppercase bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardExpiry" className="text-foreground">{t("paymentModal.expiryDate")}</Label>
              <Input
                id="cardExpiry"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={handleExpiryChange}
                className="font-mono bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardCvv" className="text-foreground">CVV</Label>
              <Input
                id="cardCvv"
                type="password"
                placeholder="•••"
                value={cardCvv}
                onChange={handleCvvChange}
                className="font-mono bg-background text-foreground"
                maxLength={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price summary line */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
        <span className="text-sm font-medium text-foreground">{t("paymentModal.totalAmount")}</span>
        <span className="text-lg font-bold text-foreground">
          {billingCycle === "yearly" && yearlyPrice ? yearlyPrice.toFixed(0) : displayPrice.toFixed(0)} lei
        </span>
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 rounded border-border"
        />
        <span className="text-xs text-muted-foreground leading-tight">
          {t("paymentModal.agreeToTerms")}
        </span>
      </label>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          {t("paymentModal.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={!isCardValid || !agreedToTerms}
          className={cn("flex-1 bg-gradient-to-r text-white hover:opacity-90", meta.gradient)}
        >
          {t("paymentModal.pay", { price: (billingCycle === "yearly" && yearlyPrice ? yearlyPrice : displayPrice).toFixed(0) + " lei" })}
        </Button>
      </div>
    </form>
  )

  // ─── Step 3: Processing ───────────────────────────────────────────
  const renderProcessing = () => (
    <div className="py-10 text-center space-y-5">
      <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <Loader2 className={cn("h-10 w-10 animate-spin", meta.color)} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("paymentModal.processingPayment")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("paymentModal.doNotClose")}</p>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        {t("paymentModal.secureTransaction")}
      </div>
    </div>
  )

  // ─── Step 4: Success ──────────────────────────────────────────────
  const renderSuccess = () => (
    <div className="py-8 text-center space-y-5">
      {/* Animated success ring */}
      <div className="relative mx-auto w-24 h-24">
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br opacity-20 animate-ping",
          meta.gradient
        )} style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-foreground">{t("paymentModal.successTitle")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("paymentModal.successDescription")}
        </p>
      </div>

      {/* Tier activated badge */}
      <div className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2 bg-gradient-to-r text-white text-sm font-semibold", meta.gradient)}>
        <TierIcon className="h-4 w-4" />
        {tierName} {t("paymentModal.activated")}
      </div>

      {/* Feature highlights */}
      <div className="text-left mx-auto max-w-xs space-y-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
          {t("paymentModal.nowAvailable")}
        </p>
        {(tierId === "basic" || tierId === "premium" || tierId === "family") && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Zap className="h-4 w-4 text-amber-500" />
            {t("paymentModal.featureAI")}
          </div>
        )}
        {(tierId === "premium" || tierId === "family") && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {t("paymentModal.featureAnalytics")}
          </div>
        )}
        {tierId === "family" && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Users className="h-4 w-4 text-orange-500" />
            {t("paymentModal.featureFamily")}
          </div>
        )}
      </div>
    </div>
  )

  // Step indicator positions
  const stepIndex: Record<Step, number> = { summary: 0, payment: 1, processing: 2, success: 3 }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md top-[45%] p-0 gap-0 overflow-hidden">
        {/* Gradient top bar */}
        <div className={cn("h-1.5 bg-gradient-to-r", meta.gradient)} />

        <div className="px-6 pt-5 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "success" ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <TierIcon className={cn("h-5 w-5", meta.color)} />
              )}
              {step === "success" ? t("paymentModal.successTitle") : t("paymentModal.title")}
            </DialogTitle>
            {step !== "success" && step !== "processing" && (
              <DialogDescription>
                {t("paymentModal.description", { tierName, price: displayPrice.toFixed(0) + " lei" })}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Step indicator */}
          {step !== "success" && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {(["summary", "payment", "processing"] as const).map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i <= stepIndex[step] ? "bg-primary w-6" : "bg-muted w-4"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2">
          {step === "summary" && renderSummary()}
          {step === "payment" && renderPayment()}
          {step === "processing" && renderProcessing()}
          {step === "success" && renderSuccess()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
