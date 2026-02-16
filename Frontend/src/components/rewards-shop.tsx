"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Loader2, AlertCircle, Edit2, Trash2, Gift, Star, CheckCircle, Clock } from "lucide-react"
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
import { ProductDto } from "@/services/shop-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/provider"

interface RewardsShopProps {
  userType: "parent" | "child"
  locale?: string
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

export default function RewardsShop({ userType, locale = "ru" }: RewardsShopProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const isParent = userType === "parent"

  const productsQuery = useShopProducts()
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
      await createOrder.mutateAsync({ items: [{ productId: product.id, quantity: 1 }] })
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

  /* ---- Render ---- */

  return (
    <div className="space-y-8">
      {/* Products */}
      {productsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-muted rounded-lg mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-10 w-full bg-muted rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : productsQuery.isError ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{t("rewardsShop.errors.loadProducts")}</p>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border/50 py-12 text-center">
          <Gift className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("rewardsShop.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isParent ? t("rewardsShop.empty.parentHint") : t("rewardsShop.empty.childHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProducts.map((product: ProductDto) => {
            const outOfStock = product.stock === 0

            return (
              <div
                key={product.id}
                className={cn(
                  "rounded-xl border p-5 transition-shadow hover:shadow-md",
                  outOfStock ? "opacity-50 border-border/30" : "border-border/50",
                )}
              >
                {/* Name & hidden badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base leading-snug line-clamp-2">{product.name}</h3>
                  {!product.isActive && isParent && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {t("rewardsShop.stock.hidden")}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                  {product.description || t("rewardsShop.fallbackDescription")}
                </p>

                {/* Price row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                    <span className="text-2xl font-bold">{numberFormatter.format(product.price)}</span>
                    <span className="text-xs text-muted-foreground">{t("rewardsShop.pointsShort")}</span>
                  </div>
                  <span className={cn("text-xs", outOfStock ? "text-red-500" : "text-muted-foreground")}>
                    {outOfStock
                      ? t("rewardsShop.stock.outOfStock")
                      : t("rewardsShop.stock.inStock", { count: product.stock })}
                  </span>
                </div>

                {/* Actions */}
                {userType === "child" ? (
                  <Button
                    className="w-full rounded-xl h-10 gap-2"
                    onClick={() => handlePurchase(product)}
                    disabled={createOrder.isPending || outOfStock}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    {outOfStock ? t("rewardsShop.actions.unavailable") : t("rewardsShop.actions.exchange")}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 gap-1.5 text-sm"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {t("rewardsShop.actions.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={pendingDeletionId === product.id}
                    >
                      {pendingDeletionId === product.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Orders section — child only */}
      {userType === "child" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("rewardsShop.orders.title")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("rewardsShop.orders.subtitle")}</p>
          </div>

          {ordersQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border p-4 animate-pulse">
                  <div className="h-4 w-40 bg-muted rounded mb-2" />
                  <div className="h-12 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{t("rewardsShop.errors.loadOrders")}</p>
            </div>
          ) : !ordersQuery.data || ordersQuery.data.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border/50 py-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">{t("rewardsShop.orders.emptyTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("rewardsShop.orders.emptySubtitle")}</p>
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
                  <div key={order.id} className="rounded-xl border border-border/50 p-4">
                    {/* Order header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {t("rewardsShop.orders.orderNumber", { id: order.id.slice(0, 8) })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dateTimeFormatter.format(new Date(order.createdAt))}
                        </span>
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs font-medium", statusStyle.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2"
                        >
                          <span>{item.productName}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                            <span className="font-medium">{numberFormatter.format(item.lineTotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-end gap-1.5 mt-3 text-sm">
                      <span className="text-muted-foreground">{t("rewardsShop.orderTotal")}:</span>
                      <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-lg">{numberFormatter.format(order.totalAmount)}</span>
                    </div>

                    {/* Delivery notes */}
                    {order.deliveryNotes && (
                      <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                          {t("rewardsShop.orders.parentNote")}
                        </p>
                        <p className="text-muted-foreground">{order.deliveryNotes}</p>
                      </div>
                    )}

                    {/* Parent: confirm delivery */}
                    {isParent && statusKey === "1" && (
                      <Button
                        size="sm"
                        className="w-full mt-3 rounded-xl gap-2"
                        onClick={async () => {
                          try {
                            await markAsDelivered.mutateAsync({
                              id: order.id,
                              payload: { deliveredByUserId: "parent-user-id", notes: "Награда выдана" },
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
                    )}

                    {/* Child: confirm receipt */}
                    {!isParent && statusKey === "3" && (
                      <Button
                        size="sm"
                        className="w-full mt-3 rounded-xl gap-2"
                        onClick={async () => {
                          try {
                            await confirmReceived.mutateAsync({
                              id: order.id,
                              payload: { confirmedByUserId: "child-user-id" },
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
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => (!open ? setSelectedProduct(null) : undefined)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("rewardsShop.edit.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">{t("rewardsShop.edit.name")}</Label>
              <Input
                className="mt-1.5 rounded-xl h-11"
                placeholder={t("rewardsShop.edit.namePlaceholder")}
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div>
              <Label className="text-sm">{t("rewardsShop.edit.description")}</Label>
              <Textarea
                className="mt-1.5 rounded-xl resize-none"
                rows={3}
                placeholder={t("rewardsShop.edit.descriptionPlaceholder")}
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {t("rewardsShop.edit.price")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1.5 rounded-xl h-11"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
              <div>
                <Label className="text-sm">{t("rewardsShop.edit.stock")}</Label>
                <Input
                  type="number"
                  min="0"
                  className="mt-1.5 rounded-xl h-11"
                  value={productForm.stock}
                  onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">{t("rewardsShop.edit.activeTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("rewardsShop.edit.activeHint")}</p>
              </div>
              <Switch
                checked={productForm.isActive}
                onCheckedChange={(v) => setProductForm((p) => ({ ...p, isActive: v }))}
                disabled={updateProduct.isPending}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={() => setSelectedProduct(null)}
              disabled={updateProduct.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 gap-2"
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
