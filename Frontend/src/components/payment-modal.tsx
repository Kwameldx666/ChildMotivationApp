"use client"

import { useState } from "react"
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
import { CreditCard, Check, Loader2, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  tierName: string
  price: number
  onSuccess?: () => void
}

export default function PaymentModal({ open, onClose, tierName, price, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const { toast } = useToast()

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
    if (value.length <= 16) {
      setCardNumber(formatCardNumber(value))
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 4) {
      setCardExpiry(formatExpiry(value))
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 3) {
      setCardCvv(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля карты",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // TODO: Интеграция с реальной платёжной системой (Stripe, YooKassa)
    // В продакшне здесь должен быть вызов API платёжного провайдера
    // После успешной оплаты - вызов onSuccess() который активирует подписку через API
    
    // Симуляция обработки платежа (для демонстрации)
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
      
      toast({
        title: "Оплата успешна! 🎉",
        description: `Подписка "${tierName}" активирована`,
      })

      setTimeout(() => {
        onSuccess?.()
        onClose()
        setIsSuccess(false)
        setCardNumber("")
        setCardExpiry("")
        setCardCvv("")
        setCardName("")
      }, 2000)
    }, 2000)
  }

  const handleClose = () => {
    if (!isProcessing && !isSuccess) {
      onClose()
      setCardNumber("")
      setCardExpiry("")
      setCardCvv("")
      setCardName("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md top-[45%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Оплата подписки
          </DialogTitle>
          <DialogDescription>
            Оформление подписки "{tierName}" - {price} ₽/месяц
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Оплата прошла успешно!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ваша подписка активирована
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <CreditCard className="h-4 w-4" />
                  Данные карты
                </CardTitle>
                <CardDescription className="text-xs text-foreground/60">
                  Ваши данные защищены и не сохраняются
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-foreground">Номер карты</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={isProcessing}
                    className="font-mono bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-foreground">Имя владельца</Label>
                  <Input
                    id="cardName"
                    placeholder="IVAN IVANOV"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    disabled={isProcessing}
                    className="uppercase bg-background text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry" className="text-foreground">Срок действия</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      disabled={isProcessing}
                      className="font-mono bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvv" className="text-foreground">CVV</Label>
                    <Input
                      id="cardCvv"
                      type="password"
                      placeholder="123"
                      value={cardCvv}
                      onChange={handleCvvChange}
                      disabled={isProcessing}
                      className="font-mono bg-background text-foreground"
                      maxLength={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <span className="text-sm font-medium text-foreground">Итого к оплате:</span>
              <span className="text-lg font-bold text-foreground">${price.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  `Оплатить $${price.toFixed(2)}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
