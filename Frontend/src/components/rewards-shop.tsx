"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, Loader2, AlertCircle, Truck, Edit2, Trash2, Gift, Star, Sparkles, CheckCircle, Clock, XCircle, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateOrder,
  useDeleteProduct,
  useShopOrders,
  useShopProducts,
  useUpdateProduct,
  useMarkOrderAsDelivered,
  useConfirmOrderReceived,
} from "@/services/shop-queries"
import { OrderStatus, ProductDto } from "@/services/shop-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface RewardsShopProps {
  userType: "parent" | "child"
}

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: typeof Clock }> = {
  Pending: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/30", icon: Clock },
  Paid: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/30", icon: CheckCircle },
  AwaitingDelivery: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30", icon: Package },
  Delivered: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500/30", icon: Gift },
  Confirmed: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-500/30", icon: CheckCircle },
  Completed: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/30", icon: CheckCircle },
  Cancelled: { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-500/30", icon: XCircle },
  "0": { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/30", icon: Clock },
  "1": { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/30", icon: CheckCircle },
  "2": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/30", icon: Package },
  "3": { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500/30", icon: Gift },
  "4": { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-500/30", icon: CheckCircle },
  "5": { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/30", icon: CheckCircle },
  "6": { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-500/30", icon: XCircle },
}

const statusLabels: Record<string, string> = {
  Pending: "Ожидает оплаты",
  Paid: "Оплачен",
  AwaitingDelivery: "Ожидает выдачи",
  Delivered: "Награда выдана",
  Confirmed: "Получение подтверждено",
  Completed: "Завершён",
  Cancelled: "Отменён",
  "0": "Ожидает оплаты",
  "1": "Оплачен",
  "2": "Ожидает выдачи",
  "3": "Награда выдана",
  "4": "Получение подтверждено",
  "5": "Завершён",
  "6": "Отменён",
}

const formatPoints = (value: number) => `${value.toLocaleString("ru-RU")} очков`

const resolveStatusKey = (status: OrderStatus) => (typeof status === "number" ? String(status) : status)

export default function RewardsShop({ userType }: RewardsShopProps) {
  const { toast } = useToast()
  const productsQuery = useShopProducts()
  const ordersQuery = useShopOrders()
  const createOrder = useCreateOrder()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const markAsDelivered = useMarkOrderAsDelivered()
  const confirmReceived = useConfirmOrderReceived()
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null)
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    isActive: true,
  })
  const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(null)
  const isParent = userType === "parent"

  const visibleProducts = useMemo(() => {
    if (!productsQuery.data) return []
    return isParent ? productsQuery.data : productsQuery.data.filter((p) => p.isActive)
  }, [isParent, productsQuery.data])

  useEffect(() => {
    if (!selectedProduct) return

    setProductForm({
      name: selectedProduct.name,
      description: selectedProduct.description ?? "",
      price: String(selectedProduct.price),
      stock: String(selectedProduct.stock),
      isActive: selectedProduct.isActive,
    })
  }, [selectedProduct])

  const handlePurchase = async (product: ProductDto) => {
    if (product.stock <= 0) {
      toast({
        title: "Товар недоступен",
        description: "Этого товара нет в наличии.",
        variant: "destructive",
      })
      return
    }

    try {
      await createOrder.mutateAsync({
        items: [{ productId: product.id, quantity: 1 }],
      })

      toast({
        title: "Заказ создан",
        description: `${product.name} добавлен в ваши заказы`,
      })
    } catch (error) {
      toast({
        title: "Не удалось создать заказ",
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (product: ProductDto) => {
    const confirmed = window.confirm(`Удалить награду «${product.name}»?`)
    if (!confirmed) return

    try {
      setPendingDeletionId(product.id)
      await deleteProduct.mutateAsync(product.id)
      toast({ title: "Награда удалена" })
    } catch (error) {
      toast({
        title: "Не удалось удалить награду",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз",
        variant: "destructive",
      })
    } finally {
      setPendingDeletionId(null)
    }
  }

  const handleSaveProduct = async () => {
    if (!selectedProduct) return

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() ? productForm.description.trim() : null,
      price: Math.max(0, Number.parseInt(productForm.price, 10) || 0),
      stock: Math.max(0, Number.parseInt(productForm.stock, 10) || 0),
      isActive: productForm.isActive,
    }

    if (!payload.name) {
      toast({ title: "Введите название награды", variant: "destructive" })
      return
    }

    try {
      await updateProduct.mutateAsync({ id: selectedProduct.id, payload })
      toast({ title: "Награда обновлена" })
      setSelectedProduct(null)
    } catch (error) {
      toast({
        title: "Не удалось обновить награду",
        description: error instanceof Error ? error.message : "Попробуйте ещё раз",
        variant: "destructive",
      })
    }
  }

  const renderProducts = () => {
    if (productsQuery.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border/50 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 animate-pulse">
              <div className="h-8 w-3/4 bg-muted rounded-xl mb-3" />
              <div className="h-4 w-full bg-muted rounded-lg mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded-lg mb-4" />
              <div className="h-10 w-full bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      )
    }

    if (productsQuery.isError) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 px-6 py-4 text-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-700">Ошибка загрузки</p>
            <p className="text-red-600">Не удалось загрузить товары магазина</p>
          </div>
        </div>
      )
    }

    if (visibleProducts.length === 0) {
      return (
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800/50 px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Магазин пуст</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isParent ? "Добавьте первую награду, чтобы начать мотивировать ребёнка" : "Пока нет доступных наград. Скоро появятся новые!"}
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProducts.map((product, index) => {
          const isLowStock = product.stock < 5
          const isOutOfStock = product.stock === 0
          
          return (
            <div 
              key={product.id} 
              className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300",
                isOutOfStock 
                  ? "border-border/30 bg-muted/20 opacity-60" 
                  : "border-border/50 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1"
              )}
            >
              {/* Gradient overlay */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                index % 3 === 0 && "bg-gradient-to-br from-purple-500/5 to-pink-500/5",
                index % 3 === 1 && "bg-gradient-to-br from-blue-500/5 to-cyan-500/5",
                index % 3 === 2 && "bg-gradient-to-br from-amber-500/5 to-orange-500/5"
              )} />
              
              {/* Sparkle icon */}
              <div className="absolute top-4 right-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                  index % 3 === 0 && "bg-gradient-to-br from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20",
                  index % 3 === 1 && "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20",
                  index % 3 === 2 && "bg-gradient-to-br from-amber-500/10 to-orange-500/10 group-hover:from-amber-500/20 group-hover:to-orange-500/20"
                )}>
                  <Sparkles className={cn(
                    "h-6 w-6",
                    index % 3 === 0 && "text-purple-600",
                    index % 3 === 1 && "text-blue-600",
                    index % 3 === 2 && "text-amber-600"
                  )} />
                </div>
              </div>

              <div className="relative p-6">
                {/* Stock badge */}
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      isOutOfStock && "bg-rose-500/10 text-rose-700 border-rose-500/30",
                      isLowStock && !isOutOfStock && "bg-amber-500/10 text-amber-700 border-amber-500/30",
                      !isLowStock && "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                    )}
                  >
                    {isOutOfStock ? "Нет в наличии" : `${product.stock} шт.`}
                  </Badge>
                  {!product.isActive && isParent && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs bg-slate-500/10 text-slate-700 border-slate-500/30">
                      Скрыта
                    </Badge>
                  )}
                  {product.isPremium && (
                    <Badge className="rounded-full px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {product.isExclusive && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Эксклюзив
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors pr-16">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                  {product.description || "Уникальная награда за достижения"}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                    <span className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {product.price.toLocaleString("ru-RU")}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">баллов</span>
                  </div>
                </div>

                {/* Actions */}
                {userType === "child" ? (
                  <Button
                    className={cn(
                      "w-full gap-2 rounded-2xl h-12 text-base font-semibold shadow-lg transition-all",
                      isOutOfStock 
                        ? "bg-muted text-muted-foreground cursor-not-allowed" 
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                    )}
                    onClick={() => handlePurchase(product)}
                    disabled={createOrder.isPending || isOutOfStock}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-5 w-5" />
                    )}
                    {isOutOfStock ? "Недоступно" : "Обменять баллы"}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded-2xl h-12 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Править
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 rounded-2xl h-12 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={pendingDeletionId === product.id}
                    >
                      {pendingDeletionId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Удалить
                    </Button>
                  </div>
                )}

                {/* Parent info */}
                {isParent && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Создано {new Date(product.createdAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderOrders = () => {
    if (ordersQuery.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border/50 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 animate-pulse">
              <div className="h-6 w-32 bg-muted rounded-xl mb-3" />
              <div className="h-4 w-full bg-muted rounded-lg mb-2" />
              <div className="h-20 w-full bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      )
    }

    if (ordersQuery.isError) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 px-6 py-4 text-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-700">Ошибка загрузки</p>
            <p className="text-red-600">Не удалось загрузить заказы</p>
          </div>
        </div>
      )
    }

    if (!ordersQuery.data || ordersQuery.data.length === 0) {
      return (
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800/50 px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Нет заказов</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Обменивайте заработанные баллы на награды из каталога
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ordersQuery.data.map((order, index) => {
          const statusKey = resolveStatusKey(order.status)
          const statusStyle = statusStyles[statusKey] ?? { bg: "bg-muted", text: "text-foreground", border: "border-border", icon: Clock }
          const StatusIcon = statusStyle.icon
          const badgeLabel = statusLabels[statusKey] ?? "Статус неизвестен"

          return (
            <div 
              key={order.id}
              className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300",
                "border-border/50 bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50",
                "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
              )}
            >
              {/* Gradient overlay */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                index % 2 === 0 ? "bg-gradient-to-br from-blue-500/5 to-cyan-500/5" : "bg-gradient-to-br from-purple-500/5 to-pink-500/5"
              )} />

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-bold">Заказ #{order.id.slice(0, 8)}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5",
                      statusStyle.bg,
                      statusStyle.text,
                      statusStyle.border
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {badgeLabel}
                  </Badge>
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-border/50 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{order.items.length} позиций</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {order.totalAmount.toLocaleString("ru-RU")}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">баллов</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between rounded-2xl border border-border/50 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-900/50 px-4 py-3 transition-colors hover:border-primary/30"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground mb-0.5">{item.productName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{item.quantity} шт.</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span>{item.unitPrice.toLocaleString("ru-RU")} за шт.</span>
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1 ml-4">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        <span className="text-base font-bold text-amber-600">
                          {item.lineTotal.toLocaleString("ru-RU")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {order.deliveryNotes && (
                  <div className="mt-4 rounded-2xl border border-border/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Комментарий родителя:</p>
                    <p className="text-sm text-muted-foreground">{order.deliveryNotes}</p>
                  </div>
                )}

                {isParent && statusKey === "1" && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={async () => {
                        try {
                          await markAsDelivered.mutateAsync({
                            id: order.id,
                            payload: { deliveredByUserId: "parent-user-id", notes: "Награда выдана" }
                          })
                          toast({
                            title: "Успешно!",
                            description: "Вы отметили, что награда выдана",
                          })
                        } catch (error) {
                          toast({
                            title: "Ошибка",
                            description: "Не удалось подтвердить выдачу награды",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={markAsDelivered.isPending}
                    >
                      {markAsDelivered.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Подтверждение...
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Подтвердить выдачу награды
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!isParent && statusKey === "3" && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      onClick={async () => {
                        try {
                          await confirmReceived.mutateAsync({
                            id: order.id,
                            payload: { confirmedByUserId: "child-user-id" }
                          })
                          toast({
                            title: "Успешно!",
                            description: "Вы подтвердили получение награды",
                          })
                        } catch (error) {
                          toast({
                            title: "Ошибка",
                            description: "Не удалось подтвердить получение награды",
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={confirmReceived.isPending}
                    >
                      {confirmReceived.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Подтверждение...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Подтвердить получение
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 px-8 py-10 text-white shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Магазин наград</p>
              <h2 className="text-3xl font-bold">
                {isParent ? "Управление каталогом" : "Обменяй баллы на награды"}
              </h2>
            </div>
          </div>
          
          <p className="text-base text-white/80 max-w-2xl mb-6">
            {isParent
              ? "Редактируйте награды, управляйте запасами и мотивируйте детей достигать новых целей"
              : "Выбирайте желанные награды и обменивайте заработанные баллы на реальные подарки"}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Доступно</p>
              </div>
              <p className="text-2xl font-bold">{visibleProducts.length}</p>
              <p className="text-xs text-white/70">наград в каталоге</p>
            </div>
            {userType === "child" && (
              <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Заказы</p>
                </div>
                <p className="text-2xl font-bold">{ordersQuery.data?.length ?? 0}</p>
                <p className="text-xs text-white/70">активных обменов</p>
              </div>
            )}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-400" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Информация</p>
              </div>
              <p className="text-sm text-white/90 font-medium">Обновлено</p>
              <p className="text-xs text-white/70">{new Date().toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Каталог наград</h3>
            <p className="text-sm text-muted-foreground">
              {isParent
                ? "Редактируйте награды и управляйте запасами"
                : "Выбирайте и обменивайте баллы на желанные подарки"}
            </p>
          </div>
        </div>
        {renderProducts()}
      </div>

      {/* Orders Section */}
      {userType === "child" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">Мои обмены</h3>
              <p className="text-sm text-muted-foreground">История обмена баллов на награды</p>
            </div>
          </div>
          {renderOrders()}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => (!open ? setSelectedProduct(null) : undefined)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Редактировать награду</DialogTitle>
            <DialogDescription className="text-base">
              Обновите информацию о награде, стоимость или доступность
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name" className="text-sm font-semibold">Название награды</Label>
              <Input
                id="reward-name"
                className="h-12 rounded-xl"
                placeholder="Например: Поход в кино"
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-description" className="text-sm font-semibold">Описание</Label>
              <Textarea
                id="reward-description"
                className="rounded-xl resize-none"
                rows={4}
                placeholder="Опишите награду подробнее..."
                value={productForm.description}
                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-price" className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Стоимость (баллы)
                </Label>
                <Input
                  id="reward-price"
                  type="number"
                  min="0"
                  step="10"
                  className="h-12 rounded-xl"
                  placeholder="100"
                  value={productForm.price}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-stock" className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Количество
                </Label>
                <Input
                  id="reward-stock"
                  type="number"
                  min="0"
                  step="1"
                  className="h-12 rounded-xl"
                  placeholder="10"
                  value={productForm.stock}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  checked={productForm.isActive}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  disabled={updateProduct.isPending}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Отображать в магазине</p>
                  <p className="text-xs text-muted-foreground">Награда будет видна в каталоге для детей</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={() => setSelectedProduct(null)}
              disabled={updateProduct.isPending}
            >
              Отмена
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30" 
              onClick={handleSaveProduct} 
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
