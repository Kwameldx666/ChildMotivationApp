"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart, Package, Loader2, AlertCircle, Edit2, Trash2, Gift, Star,
  CheckCircle, Clock, MoreHorizontal, Pencil, Coins, Sparkles, ArrowRight, ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import {
  useCreateOrder,
  useDeleteProduct,
  useShopOrders,
  useShopProducts,
  useUpdateProduct,
  useMarkOrderAsDelivered,
  useConfirmOrderReceived,
  useAllShopOrders,
} from "@/services/shop-queries"
import { ProductDto } from "@/services/shop-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"
import { useAppSelector } from "@/store/hooks"
import { selectAuthSession } from "@/features/auth/store/authSlice"

interface RewardsShopProps {
  userType: "parent" | "child"
  locale?: string
  childBalance?: number
}

const resolveStatusKey = (status: any) => (typeof status === "number" ? String(status) : status)

const STATUS_MAP: Record<string, { color: string; icon: typeof Clock }> = {
  Pending: { color: "text-amber-600", icon: Clock },
  Paid: { color: "text-emerald-600", icon: CheckCircle },
  AwaitingDelivery: { color: "text-blue-600", icon: Package },
  Delivered: { color: "text-purple-600", icon: Gift },
  Confirmed: { color: "text-cyan-600", icon: CheckCircle },
  Completed: { color: "text-emerald-600", icon: CheckCircle },
  Cancelled: { color: "text-rose-500", icon: AlertCircle },
  "0": { color: "text-amber-600", icon: Clock },
  "1": { color: "text-emerald-600", icon: CheckCircle },
  "2": { color: "text-blue-600", icon: Package },
  "3": { color: "text-purple-600", icon: Gift },
  "4": { color: "text-cyan-600", icon: CheckCircle },
  "5": { color: "text-emerald-600", icon: CheckCircle },
  "6": { color: "text-rose-500", icon: AlertCircle },
}

function resolveIntlLocale(locale: string) {
  if (locale === "ru") return "ru-RU"
  return "en-US"
}

export default function RewardsShop({ userType, locale = "ru", childBalance }: RewardsShopProps) {
  const { toast } = useToast()
  const { t, locale: activeLocale } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const currentUserId = session?.user.id ?? ""
  const isParent = userType === "parent"

  const productsQuery = useShopProducts()
  const ordersQuery = useShopOrders(currentUserId, Boolean(currentUserId))
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
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)

  // ── Family-wide orders (parent only): see all children's requests ──────────
  const familyOrdersQuery = useAllShopOrders(isParent)
  const pendingFamilyOrders = useMemo(() => {
    if (!isParent || !familyOrdersQuery.data) return []
    const needsAction = new Set(['Pending', 'Paid', 'AwaitingDelivery', '0', '1', '2'])
    return familyOrdersQuery.data.filter(o => needsAction.has(String(o.status)))
  }, [isParent, familyOrdersQuery.data])

  const intlLocale = useMemo(() => resolveIntlLocale(locale), [locale])
  const numberFormatter = useMemo(() => new Intl.NumberFormat(intlLocale), [intlLocale])
  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeStyle: "short" }),
    [intlLocale],
  )

  const statusLabels = useMemo(
    () => ({
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
    }),
    [t],
  )

  const visibleProducts = useMemo(() => {
    if (!productsQuery.data) return []
    const list = isParent ? productsQuery.data : productsQuery.data.filter((p: ProductDto) => p.isActive)
    return [...list].sort((a, b) => a.price - b.price)
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

  /* ---- Handlers ---- */

  const balance = childBalance ?? 0
  const parentManageLabel = useMemo(() => {
    const key = "rewardsShop.catalog.parentManageCount"
    const translated = t(key)
    if (translated !== key) return translated

    if (activeLocale === "en") return "Reward management"
    if (activeLocale === "ro") return "Gestionare recompense"
    return "Управление наградами"
  }, [activeLocale, t])

  const handlePurchase = async (product: ProductDto) => {
    if (!currentUserId) {
      toast({
        title: t("common.error"),
        description: t("rewardsShop.toasts.tryAgain"),
        variant: "destructive",
      })
      return
    }
    if (product.stock <= 0) {
      toast({
        title: t("rewardsShop.toasts.productUnavailable.title"),
        description: t("rewardsShop.toasts.productUnavailable.description"),
        variant: "destructive",
      })
      return
    }
    if (balance < product.price) {
      toast({
        title: t("rewardsShop.toasts.notEnoughPoints.title"),
        description: t("rewardsShop.toasts.notEnoughPoints.description", { need: product.price, have: balance }),
        variant: "destructive",
      })
      return
    }
    try {
      await createOrder.mutateAsync({ userId: currentUserId, items: [{ productId: product.id, quantity: 1 }] })
      toast({
        title: t("rewardsShop.toasts.orderCreated.title"),
        description: t("rewardsShop.toasts.orderCreated.description", { name: product.name }),
      })
    } catch (error) {
      toast({
        title: t("rewardsShop.toasts.orderFailed.title"),
        description: mapApiError(error, t("rewardsShop.toasts.tryAgain")),
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
        description: mapApiError(error, t("rewardsShop.toasts.tryAgain")),
        variant: "destructive",
      })
    } finally {
      setPendingDeletionId(null)
    }
  }

  const handleApproveOrder = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      await markAsDelivered.mutateAsync({
        id: orderId,
        payload: { deliveredByUserId: currentUserId, notes: "Награда выдана родителем" },
      })
      toast({
        title: "✅ Готово!",
        description: "Вы подтвердили выдачу награды ребёнку",
      })
    } catch {
      toast({
        title: t("common.error"),
        description: t("rewardsShop.toasts.deliveryFailed"),
        variant: "destructive",
      })
    } finally {
      setProcessingOrderId(null)
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
        description: mapApiError(error, t("rewardsShop.toasts.tryAgain")),
        variant: "destructive",
      })
    }
  }

  /* ---- Render ---- */

  const ITEM_EMOJIS = ["🎮", "🧸", "🎨", "📚", "🍭", "🎠", "🎪", "🎭", "🎵", "🌈"]

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ═══════════ Pending child orders (parent only) ═══════════ */}
      {isParent && pendingFamilyOrders.length > 0 && (
        <div className="space-y-3">
          {/* Section header */}
          <div
            className="relative overflow-hidden rounded-3xl border-2 p-5"
            style={{ background: "linear-gradient(135deg,#fffbeb 0%,#fef3c7 60%,#fde68a 100%)", borderColor: "#f59e0b" }}
          >
            <div className="absolute -top-4 -right-4 text-6xl opacity-[0.1] select-none pointer-events-none animate-hero-float">🎁</div>
            <div className="flex items-center gap-4">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", width: 52, height: 52 }}
              >
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-amber-900">Запросы детей</h2>
                <p className="text-sm text-amber-700">
                  {pendingFamilyOrders.length === 1
                    ? "1 запрос ожидает вашего подтверждения"
                    : `${pendingFamilyOrders.length} запроса(ов) ожидают подтверждения`}
                </p>
              </div>
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-black flex-shrink-0 animate-pulse"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.5)" }}
              >
                {pendingFamilyOrders.length}
              </span>
            </div>
          </div>

          {/* Individual order cards */}
          {pendingFamilyOrders.map((order, idx) => (
            <div
              key={order.id}
              className="rounded-3xl border-2 overflow-hidden bg-card animate-card-appear shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: "#fde68a", animationDelay: `${idx * 80}ms` }}
            >
              {/* Order header bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b"
                style={{ background: "linear-gradient(135deg,#fef9c3 0%,#fefce8 100%)", borderColor: "#fde68a" }}
              >
                <span className="text-base">🛍️</span>
                <span className="text-xs text-amber-700 flex-1 font-medium">
                  Заказ от {dateTimeFormatter.format(new Date(order.createdAt))}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1"
                  style={{ background: "#fef3c7", color: "#d97706" }}
                >
                  <Clock className="h-3 w-3" />
                  Ожидает выдачи
                </span>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3">
                {order.items.map((item, itemIdx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                      style={{ background: "linear-gradient(135deg,#fef3c7,#fed7aa)" }}
                    >
                      {ITEM_EMOJIS[(idx + itemIdx) % ITEM_EMOJIS.length]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-snug">{item.productName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-semibold text-amber-700">
                          {numberFormatter.format(item.lineTotal)} звёзд
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-muted-foreground">× {item.quantity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approve button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => handleApproveOrder(order.id)}
                  disabled={processingOrderId === order.id}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 6px 16px -3px rgba(16,185,129,0.55)" }}
                >
                  {processingOrderId === order.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {processingOrderId === order.id ? "Подтверждаю..." : "✅ Выдать награду"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ Products grid ═══════════ */}
      {productsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border-2 border-border/20 p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted/60 rounded-lg" />
                  <div className="h-3 w-1/2 bg-muted/40 rounded-lg" />
                </div>
              </div>
              <div className="h-12 w-full bg-muted/40 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : productsQuery.isError ? (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-red-200/40 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 p-6">
          <div className="text-3xl">😿</div>
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{t("rewardsShop.errors.loadProducts")}</p>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/30 py-16 text-center">
          <div className="text-5xl mb-4 animate-kid-bounce">🎁</div>
          <p className="font-bold text-lg">{t("rewardsShop.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
            {isParent ? t("rewardsShop.empty.parentHint") : t("rewardsShop.empty.childHint")}
          </p>
        </div>
      ) : (
        <div>
          {/* Shop header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500/8 via-purple-500/5 to-fuchsia-500/8 dark:from-violet-500/12 dark:via-purple-500/8 dark:to-fuchsia-500/12 border border-violet-500/15 p-5 mb-6">
            <div className="absolute -top-4 -right-4 text-6xl opacity-[0.06] select-none pointer-events-none animate-hero-float">🎁</div>
            <div className="absolute bottom-2 right-16 text-3xl opacity-[0.08] select-none pointer-events-none animate-star-twinkle">✨</div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black">{t("rewardsShop.title") || "Магазин наград"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isParent
                    ? t("rewardsShop.catalog.parentSubtitle") || "Редактируйте награды и управляйте запасами"
                    : t("rewardsShop.subtitle") || "Обменяй свои звёзды на крутые призы!"}
                </p>
              </div>
              {isParent ? (
                <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-violet-500/10 border border-violet-400/20">
                  <Package className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                    {parentManageLabel}: {visibleProducts.length}
                  </span>
                </div>
              ) : (
                <div 
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-500/10 border border-purple-400/20"
                  title={t("rewardsShop.availablePrizesTITLE") || "Доступно наград"}
                >
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                    {visibleProducts.length} {t("rewardsShop.availablePrizesText")}
                  </span>
                </div>
              )}
              {userType === "child" && (
                <div 
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-400/20"
                  title={t("rewardsShop.yourBalanceTITLE") || "Твой баланс звёзд"}
                >
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {numberFormatter.format(balance)} {t("rewardsShop.currencyStars")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProducts.map((product: ProductDto, index: number) => {
              const outOfStock = product.stock === 0
              const PRODUCT_EMOJIS = ["🎮", "🧸", "🎨", "📚", "🍭", "🎠", "🎪", "🎭", "🎵", "🌈"]

              return (
                <div
                  key={product.id}
                  className={cn(
                    "group relative flex flex-col rounded-3xl border-2 bg-card transition-all duration-300 child-card-hover animate-card-appear overflow-hidden",
                    outOfStock
                      ? "opacity-50 border-border/20"
                      : "border-border/20 hover:border-primary/30",
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                {/* Parent kebab menu (top-right) */}
                {isParent && (
                  <div className="absolute right-3 top-3 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[150px]">
                        <DropdownMenuItem
                          onClick={() => setSelectedProduct(product)}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                          {t("rewardsShop.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteProduct(product)}
                          disabled={pendingDeletionId === product.id}
                          className="gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Card body */}
                <div className="flex flex-col flex-1 p-5 pb-4">
                  {/* Fun emoji + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      {PRODUCT_EMOJIS[index % PRODUCT_EMOJIS.length]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[15px] leading-snug line-clamp-2 pr-6">
                        {product.name}
                      </h3>
                      {!product.isActive && isParent && (
                        <Badge variant="secondary" className="text-[10px] mt-1 shrink-0 rounded-full">
                          {t("rewardsShop.stock.hidden")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {product.description ? (
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-auto">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-[13px] text-muted-foreground/50 italic mb-auto">
                      {t("rewardsShop.fallbackDescription")}
                    </p>
                  )}
                </div>

                {/* Footer: Price + action — treasure style */}
                <div className={cn(
                  "flex items-center justify-between gap-3 border-t px-5 py-4",
                  "border-border/20 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 dark:from-amber-500/5 dark:to-orange-500/5"
                )}>
                  {/* Price — treasure coin */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 shadow-md shadow-amber-400/20">
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                    <span className="text-xl font-black tabular-nums">{numberFormatter.format(product.price)}</span>
                  </div>

                  {/* Stock or Action */}
                  {userType === "child" ? (
                    (() => {
                      const cantAfford = balance < product.price
                      return (
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            size="sm"
                            className={cn(
                              "h-10 rounded-2xl px-5 gap-2 text-sm font-black text-white transition-all duration-200 btn-bounce",
                              outOfStock || cantAfford
                                ? "bg-muted text-muted-foreground pointer-events-none"
                                : "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-[1.03]",
                            )}
                            onClick={() => handlePurchase(product)}
                            disabled={createOrder.isPending || outOfStock || cantAfford}
                          >
                            {createOrder.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : outOfStock || cantAfford ? null : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                            {outOfStock ? t("rewardsShop.actions.unavailable") : cantAfford ? t("rewardsShop.actions.notEnough") : t("rewardsShop.actions.exchange")} {!outOfStock && !cantAfford && "🎉"}
                          </Button>
                          {cantAfford && !outOfStock && (
                            <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                              {t("rewardsShop.actions.needMore", { amount: product.price - balance })}
                            </span>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <span className={cn(
                      "text-xs font-medium tabular-nums",
                      outOfStock ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {outOfStock
                        ? t("rewardsShop.stock.outOfStock")
                        : t("rewardsShop.stock.inStock", { count: product.stock })}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {/* ═══════════ Orders ═══════════ */}
      {userType === "child" && (
        <div className="space-y-5">
          {/* Orders header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500/8 via-indigo-500/5 to-cyan-500/8 dark:from-blue-500/12 dark:via-indigo-500/8 dark:to-cyan-500/12 border border-blue-500/15 p-5">
            <div className="absolute -top-4 -right-4 text-5xl opacity-[0.06] select-none pointer-events-none animate-hero-float">📦</div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black">{t("rewardsShop.orders.title")}</h2>
                <p className="text-xs text-muted-foreground">{t("rewardsShop.orders.subtitle")}</p>
              </div>
            </div>
          </div>

          {ordersQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border/40 p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/60" />
                    <div className="h-4 w-32 bg-muted/60 rounded-lg" />
                    <div className="flex-1" />
                    <div className="h-5 w-20 bg-muted/40 rounded-full" />
                  </div>
                  <div className="h-10 w-full bg-muted/30 rounded-xl" />
                </div>
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 p-5">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{t("rewardsShop.errors.loadOrders")}</p>
            </div>
          ) : !ordersQuery.data || ordersQuery.data.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border/30 py-14 text-center">
              <div className="text-4xl mb-3 animate-kid-bounce">📦</div>
              <p className="font-bold text-sm">{t("rewardsShop.orders.emptyTitle")}</p>
              <p className="text-[13px] text-muted-foreground mt-1">{t("rewardsShop.orders.emptySubtitle")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersQuery.data.map((order) => {
                const statusKey = resolveStatusKey(order.status)
                const statusStyle = STATUS_MAP[statusKey] ?? { color: "text-muted-foreground", icon: Clock }
                const StatusIcon = statusStyle.icon
                const label =
                  statusLabels[statusKey as keyof typeof statusLabels] ?? t("rewardsShop.status.unknown")

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border-2 border-border/20 overflow-hidden transition-all hover:shadow-md child-card-hover bg-card"
                  >
                    {/* Order header */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
                      <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30 border border-blue-200/40 dark:border-blue-700/30">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {t("rewardsShop.orders.orderNumber", { id: order.id.slice(0, 8) })}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          {dateTimeFormatter.format(new Date(order.createdAt))}
                        </span>
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        statusStyle.color,
                        "bg-current/5"
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {label}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-5 py-3 space-y-1.5">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm py-1.5"
                        >
                          <span className="text-foreground/80">{item.productName}</span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span className="font-medium text-foreground tabular-nums">
                              {numberFormatter.format(item.lineTotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total + action */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-muted/10">
                      <span className="text-xs text-muted-foreground">{t("rewardsShop.orderTotal")}</span>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        <span className="font-bold tabular-nums">{numberFormatter.format(order.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Delivery notes */}
                    {order.deliveryNotes && (
                      <div className="mx-5 mb-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/15 px-4 py-2.5 text-sm">
                        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-0.5">
                          {t("rewardsShop.orders.parentNote")}
                        </p>
                        <p className="text-[13px] text-muted-foreground">{order.deliveryNotes}</p>
                      </div>
                    )}

                    {/* Parent: confirm delivery */}
                    {isParent && statusKey === "1" && (
                      <div className="px-5 pb-4">
                        <Button
                          size="sm"
                          className={cn(
                            "w-full h-10 rounded-xl gap-2 text-sm font-medium text-white",
                            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
                            "shadow-sm shadow-emerald-500/20"
                          )}
                          onClick={async () => {
                            try {
                              await markAsDelivered.mutateAsync({
                                id: order.id,
                                payload: { deliveredByUserId: currentUserId, notes: "Награда выдана" },
                              })
                              toast({
                                title: t("rewardsShop.toasts.success"),
                                description: t("rewardsShop.toasts.deliveryConfirmed"),
                              })
                            } catch {
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
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Gift className="h-4 w-4" />
                          )}
                          {t("rewardsShop.actions.confirmDelivery")}
                        </Button>
                      </div>
                    )}

                    {/* Child: confirm receipt */}
                    {!isParent && statusKey === "3" && (
                      <div className="px-5 pb-4">
                        <Button
                          size="sm"
                          className={cn(
                            "w-full h-10 rounded-xl gap-2 text-sm font-medium text-white",
                            "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                            "shadow-sm shadow-violet-500/20"
                          )}
                          onClick={async () => {
                            try {
                              await confirmReceived.mutateAsync({
                                id: order.id,
                                payload: { confirmedByUserId: currentUserId },
                              })
                              toast({
                                title: t("rewardsShop.toasts.success"),
                                description: t("rewardsShop.toasts.receiptConfirmed"),
                              })
                            } catch {
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
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {t("rewardsShop.actions.confirmReceipt")}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ Edit Dialog ═══════════ */}
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => (!open ? setSelectedProduct(null) : undefined)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-base">{t("rewardsShop.edit.title")}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-3">
            <div>
              <Label className="text-[13px] text-muted-foreground">{t("rewardsShop.edit.name")}</Label>
              <Input
                className="mt-1.5 rounded-xl h-11 border-border/50 focus-visible:ring-primary/20"
                placeholder={t("rewardsShop.edit.namePlaceholder")}
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div>
              <Label className="text-[13px] text-muted-foreground">{t("rewardsShop.edit.description")}</Label>
              <Textarea
                className="mt-1.5 rounded-xl resize-none border-border/50 focus-visible:ring-primary/20"
                rows={3}
                placeholder={t("rewardsShop.edit.descriptionPlaceholder")}
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-amber-500" />
                  {t("rewardsShop.edit.price")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1.5 rounded-xl h-11 border-border/50 focus-visible:ring-primary/20"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
              <div>
                <Label className="text-[13px] text-muted-foreground">{t("rewardsShop.edit.stock")}</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1.5 rounded-xl h-11 border-border/50 focus-visible:ring-primary/20"
                  value={productForm.stock}
                  onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/40 p-3.5">
              <div>
                <p className="text-sm font-medium">{t("rewardsShop.edit.activeTitle")}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{t("rewardsShop.edit.activeHint")}</p>
              </div>
              <Switch
                checked={productForm.isActive}
                onCheckedChange={(v) => setProductForm((p) => ({ ...p, isActive: v }))}
                disabled={updateProduct.isPending}
              />
            </div>
          </div>

          <div className="flex gap-2 px-6 pb-6 pt-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl h-11"
              onClick={() => setSelectedProduct(null)}
              disabled={updateProduct.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className={cn(
                "flex-1 rounded-xl h-11 gap-2 font-medium text-white",
                "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                "shadow-sm shadow-primary/20"
              )}
              onClick={handleSaveProduct}
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("rewardsShop.actions.saveChanges")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
