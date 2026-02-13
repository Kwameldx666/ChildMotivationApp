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
import { useTranslation } from "@/i18n/provider"

interface RewardsShopProps {
  userType: "parent" | "child"
}

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: typeof Clock }> = {
  Pending: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", icon: Clock },
  Paid: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  AwaitingDelivery: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", icon: Package },
  Delivered: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", icon: Gift },
  Confirmed: { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800", icon: CheckCircle },
  Completed: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  Cancelled: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", icon: XCircle },
  "0": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", icon: Clock },
  "1": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  "2": { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", icon: Package },
  "3": { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", icon: Gift },
  "4": { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800", icon: CheckCircle },
  "5": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  "6": { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", icon: XCircle },
}

const resolveStatusKey = (status: OrderStatus) => (typeof status === "number" ? String(status) : status)

// Категории наград по стоимости
type RewardTier = "instant" | "medium" | "big"

interface RewardTierConfig {
  id: RewardTier
  label: string
  description: string
  icon: string
  pointsRange: string
  minPoints: number
  maxPoints: number
  color: string
  bgGradient: string
}

const getRewardTiers = (t: (key: string, params?: Record<string, string | number>) => string): RewardTierConfig[] => [
  {
    id: "instant",
    label: t("rewardsShop.tiers.instant.label"),
    description: t("rewardsShop.tiers.instant.description"),
    icon: "⚡",
    pointsRange: t("rewardsShop.tiers.instant.range"),
    minPoints: 0,
    maxPoints: 50,
    color: "text-emerald-600",
    bgGradient: "from-emerald-500/10 to-green-500/10 border-emerald-500/30",
  },
  {
    id: "medium",
    label: t("rewardsShop.tiers.medium.label"),
    description: t("rewardsShop.tiers.medium.description"),
    icon: "🎯",
    pointsRange: t("rewardsShop.tiers.medium.range"),
    minPoints: 51,
    maxPoints: 200,
    color: "text-blue-600",
    bgGradient: "from-blue-500/10 to-cyan-500/10 border-blue-500/30",
  },
  {
    id: "big",
    label: t("rewardsShop.tiers.big.label"),
    description: t("rewardsShop.tiers.big.description"),
    icon: "🏆",
    pointsRange: t("rewardsShop.tiers.big.range"),
    minPoints: 201,
    maxPoints: Infinity,
    color: "text-purple-600",
    bgGradient: "from-purple-500/10 to-pink-500/10 border-purple-500/30",
  },
]

const resolveIntlLocale = (locale: string) => {
  if (locale === "ru") return "ru-RU"
  if (locale === "ro") return "ro-RO"
  return "en-US"
}

const getRewardTier = (price: number): RewardTier => {
  if (price <= 50) return "instant"
  if (price <= 200) return "medium"
  return "big"
}

export default function RewardsShop({ userType }: RewardsShopProps) {
  const { t, locale } = useTranslation()
  const { toast } = useToast()
  const isParent = userType === "parent"
  const productsQuery = useShopProducts()
  // Отложенная загрузка заказов для родителей - они нужны только детям
  const ordersQuery = useShopOrders(!isParent)
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

  const intlLocale = useMemo(() => resolveIntlLocale(locale), [locale])
  const numberFormatter = useMemo(() => new Intl.NumberFormat(intlLocale), [intlLocale])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(intlLocale), [intlLocale])
  const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }), [intlLocale])

  const rewardTiers = useMemo(() => getRewardTiers(t), [t])
  const statusLabels = useMemo(() => ({
    Pending: t("rewardsShop.status.pending"),
    Paid: t("rewardsShop.status.paid"),
    AwaitingDelivery: t("rewardsShop.status.awaitingDelivery"),
    Delivered: t("rewardsShop.status.delivered"),
    Confirmed: t("rewardsShop.status.confirmed"),
    Completed: t("rewardsShop.status.completed"),
    Cancelled: t("rewardsShop.status.cancelled"),
    "0": t("rewardsShop.status.pending"),
    "1": t("rewardsShop.status.paid"),
    "2": t("rewardsShop.status.awaitingDelivery"),
    "3": t("rewardsShop.status.delivered"),
    "4": t("rewardsShop.status.confirmed"),
    "5": t("rewardsShop.status.completed"),
    "6": t("rewardsShop.status.cancelled"),
  }), [t])

  const formatRewardCount = (count: number) => {
    if (locale === "ru") {
      const mod10 = count % 10
      const mod100 = count % 100
      if (mod10 === 1 && mod100 !== 11) {
        return `${count} ${t("rewardsShop.rewardCount.one")}`
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return `${count} ${t("rewardsShop.rewardCount.few")}`
      }
      return `${count} ${t("rewardsShop.rewardCount.many")}`
    }

    const key = count === 1 ? "one" : "other"
    return `${count} ${t(`rewardsShop.rewardCount.${key}`)}`
  }

  const visibleProducts = useMemo(() => {
    if (!productsQuery.data) return []
    return isParent ? productsQuery.data : productsQuery.data.filter((p) => p.isActive)
  }, [isParent, productsQuery.data])

  // Группировка продуктов по категориям
  const groupedProducts = useMemo(() => {
    const groups: Record<RewardTier, ProductDto[]> = {
      instant: [],
      medium: [],
      big: [],
    }
    
    visibleProducts.forEach((product) => {
      const tier = getRewardTier(product.price)
      groups[tier].push(product)
    })
    
    // Сортировка внутри каждой группы по цене
    Object.keys(groups).forEach((key) => {
      groups[key as RewardTier].sort((a, b) => a.price - b.price)
    })
    
    return groups
  }, [visibleProducts])

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
        title: t("rewardsShop.toasts.productUnavailable.title"),
        description: t("rewardsShop.toasts.productUnavailable.description"),
        variant: "destructive",
      })
      return
    }

    try {
      await createOrder.mutateAsync({
        items: [{ productId: product.id, quantity: 1 }],
      })

      toast({
        title: t("rewardsShop.toasts.orderCreated.title"),
        description: t("rewardsShop.toasts.orderCreated.description", { name: product.name }),
      })
    } catch (error) {
      toast({
        title: t("rewardsShop.toasts.orderFailed.title"),
        description: error instanceof Error ? error.message : t("rewardsShop.toasts.tryAgain"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (product: ProductDto) => {
    const confirmed = window.confirm(t("rewardsShop.confirmDelete", { name: product.name }))
    if (!confirmed) return

    try {
      setPendingDeletionId(product.id)
      await deleteProduct.mutateAsync(product.id)
      toast({ title: t("rewardsShop.toasts.rewardDeleted") })
    } catch (error) {
      toast({
        title: t("rewardsShop.toasts.rewardDeleteFailed.title"),
        description: error instanceof Error ? error.message : t("rewardsShop.toasts.tryAgain"),
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
      toast({ title: t("rewardsShop.toasts.rewardNameRequired"), variant: "destructive" })
      return
    }

    try {
      await updateProduct.mutateAsync({ id: selectedProduct.id, payload })
      toast({ title: t("rewardsShop.toasts.rewardUpdated") })
      setSelectedProduct(null)
    } catch (error) {
      toast({
        title: t("rewardsShop.toasts.rewardUpdateFailed.title"),
        description: error instanceof Error ? error.message : t("rewardsShop.toasts.tryAgain"),
        variant: "destructive",
      })
    }
  }

  const renderProducts = () => {
    if (productsQuery.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border/50 bg-muted/5 p-6 animate-pulse">
              <div className="h-8 w-3/4 bg-muted/50 rounded-xl mb-3" />
              <div className="h-4 w-full bg-muted/50 rounded-lg mb-2" />
              <div className="h-4 w-2/3 bg-muted/50 rounded-lg mb-4" />
              <div className="h-10 w-full bg-muted/50 rounded-xl" />
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
            <p className="font-semibold text-red-700">{t("rewardsShop.errors.loadTitle")}</p>
            <p className="text-red-600">{t("rewardsShop.errors.loadProducts")}</p>
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
          <h3 className="text-lg font-semibold mb-2">{t("rewardsShop.empty.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isParent ? t("rewardsShop.empty.parentHint") : t("rewardsShop.empty.childHint")}
          </p>
        </div>
      )
    }

    // Отображаем награды по категориям
    return (
      <div className="space-y-12">
        {rewardTiers.map((tierConfig) => {
          const products = groupedProducts[tierConfig.id]
          if (products.length === 0 && !isParent) return null

          return (
            <div key={tierConfig.id} className="space-y-6">
              {/* Заголовок категории */}
              <div className={`rounded-2xl border-2 p-6 ${tierConfig.bgGradient}`}>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{tierConfig.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold ${tierConfig.color}`}>{tierConfig.label}</h3>
                    <p className="text-sm text-muted-foreground">{tierConfig.description}</p>
                    <p className={`text-sm font-semibold mt-1 ${tierConfig.color}`}>{tierConfig.pointsRange}</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {formatRewardCount(products.length)}
                  </Badge>
                </div>
              </div>

              {/* Сетка продуктов */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => {
                    const isLowStock = product.stock < 5
                    const isOutOfStock = product.stock === 0

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "group relative overflow-hidden rounded-3xl border-2 transition-all duration-500 transform",
                          isOutOfStock
                            ? "border-border/30 bg-muted/20 opacity-60"
                            : "border-border/40 bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-2 hover:scale-[1.02]"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative p-7 z-10">
                          <div className="mb-5 flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm",
                                isOutOfStock && "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-rose-500/20",
                                isLowStock && !isOutOfStock && "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-amber-500/20",
                                !isLowStock && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/20"
                              )}
                            >
                              {isOutOfStock ? t("rewardsShop.stock.outOfStock") : t("rewardsShop.stock.inStock", { count: product.stock })}
                            </Badge>
                            {!product.isActive && isParent && (
                              <Badge variant="outline" className="rounded-full px-4 py-1.5 text-xs bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/40 shadow-sm backdrop-blur-sm">
                                {t("rewardsShop.stock.hidden")}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors pr-20 leading-tight">
                            {product.name}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                            {product.description || t("rewardsShop.fallbackDescription")}
                          </p>

                          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
                            <div className="flex items-baseline gap-2">
                              <Star className="h-6 w-6 text-amber-500 fill-amber-400 drop-shadow-lg" />
                              <span className="text-4xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent drop-shadow">
                                {numberFormatter.format(product.price)}
                              </span>
                              <span className="text-sm text-amber-700 dark:text-amber-400 font-bold">{t("rewardsShop.pointsShort")}</span>
                            </div>
                          </div>

                          {userType === "child" ? (
                            <Button
                              className={cn(
                                "w-full gap-2 rounded-2xl h-14 text-base font-bold shadow-xl transition-all transform hover:scale-105",
                                isOutOfStock
                                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/50"
                              )}
                              onClick={() => handlePurchase(product)}
                              disabled={createOrder.isPending || isOutOfStock}
                            >
                              {createOrder.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                              {isOutOfStock ? t("rewardsShop.actions.unavailable") : t("rewardsShop.actions.exchange")}
                            </Button>
                          ) : (
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                className="flex-1 gap-2 rounded-2xl h-12 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/30 dark:hover:to-cyan-950/30 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-400 transition-all duration-300 font-semibold"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Edit2 className="h-4 w-4" />
                                {t("rewardsShop.actions.edit")}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 gap-2 rounded-2xl h-12 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                                onClick={() => handleDeleteProduct(product)}
                                disabled={pendingDeletionId === product.id}
                              >
                                {pendingDeletionId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                {t("rewardsShop.actions.delete")}
                              </Button>
                            </div>
                          )}

                          {isParent && (
                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{t("rewardsShop.createdAt", { date: dateFormatter.format(new Date(product.createdAt)) })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                isParent && (
                  <div className="rounded-2xl border-2 border-dashed border-border/40 bg-muted/5 px-6 py-8 text-center">
                    <p className="text-sm text-muted-foreground">{t("rewardsShop.emptyCategory")}</p>
                  </div>
                )
              )}
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
            <div key={index} className="rounded-3xl border border-border/50 bg-muted/5 p-6 animate-pulse">
              <div className="h-6 w-32 bg-muted/50 rounded-xl mb-3" />
              <div className="h-4 w-full bg-muted/50 rounded-lg mb-2" />
              <div className="h-20 w-full bg-muted/50 rounded-xl" />
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
            <p className="font-semibold text-red-700">{t("rewardsShop.errors.loadTitle")}</p>
            <p className="text-red-600">{t("rewardsShop.errors.loadOrders")}</p>
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
          <h3 className="text-lg font-semibold mb-2">{t("rewardsShop.orders.emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t("rewardsShop.orders.emptySubtitle")}
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
          const badgeLabel = statusLabels[statusKey] ?? t("rewardsShop.status.unknown")

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
                      <h3 className="text-lg font-bold">{t("rewardsShop.orders.orderNumber", { id: order.id.slice(0, 8) })}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {dateTimeFormatter.format(new Date(order.createdAt))}
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
                      <span className="font-medium">{t("rewardsShop.orders.itemsCount", { count: order.items.length })}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {numberFormatter.format(order.totalAmount)}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{t("rewardsShop.pointsShort")}</span>
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
                          <span>{t("rewardsShop.quantityShort", { count: item.quantity })}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                          <span>{t("rewardsShop.unitPrice", { value: numberFormatter.format(item.unitPrice) })}</span>
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1 ml-4">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        <span className="text-base font-bold text-amber-600">
                          {numberFormatter.format(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                {order.deliveryNotes && (
                  <div className="mt-4 rounded-2xl border border-border/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">{t("rewardsShop.orders.parentNote")}</p>
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
                            title: t("rewardsShop.toasts.success"),
                            description: t("rewardsShop.toasts.deliveryConfirmed"),
                          })
                        } catch (error) {
                          toast({
                            title: t("common.error"),
                            description: t("rewardsShop.toasts.deliveryFailed"),
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={markAsDelivered.isPending}
                    >
                      {markAsDelivered.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("rewardsShop.actions.confirming")}
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          {t("rewardsShop.actions.confirmDelivery")}
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
                            title: t("rewardsShop.toasts.success"),
                            description: t("rewardsShop.toasts.receiptConfirmed"),
                          })
                        } catch (error) {
                          toast({
                            title: t("common.error"),
                            description: t("rewardsShop.toasts.receiptFailed"),
                            variant: "destructive",
                          })
                        }
                      }}
                      disabled={confirmReceived.isPending}
                    >
                      {confirmReceived.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("rewardsShop.actions.confirming")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t("rewardsShop.actions.confirmReceipt")}
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
      {/* Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">{t("rewardsShop.catalog.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {isParent
                ? t("rewardsShop.catalog.parentSubtitle")
                : t("rewardsShop.catalog.childSubtitle")}
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
              <h3 className="text-2xl font-bold mb-1">{t("rewardsShop.orders.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("rewardsShop.orders.subtitle")}</p>
            </div>
          </div>
          {renderOrders()}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => (!open ? setSelectedProduct(null) : undefined)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("rewardsShop.edit.title")}</DialogTitle>
            <DialogDescription className="text-base">{t("rewardsShop.edit.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name" className="text-sm font-semibold">{t("rewardsShop.edit.name")}</Label>
              <Input
                id="reward-name"
                className="h-12 rounded-xl"
                placeholder={t("rewardsShop.edit.namePlaceholder")}
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-description" className="text-sm font-semibold">{t("rewardsShop.edit.description")}</Label>
              <Textarea
                id="reward-description"
                className="rounded-xl resize-none"
                rows={4}
                placeholder={t("rewardsShop.edit.descriptionPlaceholder")}
                value={productForm.description}
                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-price" className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  {t("rewardsShop.edit.price")}
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
                  {t("rewardsShop.edit.stock")}
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
                  <p className="text-sm font-semibold">{t("rewardsShop.edit.activeTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("rewardsShop.edit.activeHint")}</p>
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
              {t("common.cancel")}
            </Button>
            <Button 
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30" 
              onClick={handleSaveProduct} 
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t("rewardsShop.actions.saving")}
                </>
              ) : (
                t("rewardsShop.actions.saveChanges")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
