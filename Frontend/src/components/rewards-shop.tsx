"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, Loader2, AlertCircle, Truck, Edit2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateOrder,
  useDeleteProduct,
  useShopOrders,
  useShopProducts,
  useUpdateProduct,
} from "@/services/shop-queries"
import { OrderStatus, ProductDto } from "@/services/shop-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RewardsShopProps {
  userType: "parent" | "child"
}

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Shipped: "bg-sky-50 text-sky-700 border-sky-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  "0": "bg-amber-50 text-amber-700 border-amber-200",
  "1": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "2": "bg-sky-50 text-sky-700 border-sky-200",
  "3": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "4": "bg-rose-50 text-rose-700 border-rose-200",
}

const statusLabels: Record<string, string> = {
  Pending: "Ожидает оплаты",
  Paid: "Оплачен",
  Shipped: "Отгружен",
  Completed: "Завершен",
  Cancelled: "Отменен",
  "0": "Ожидает оплаты",
  "1": "Оплачен",
  "2": "Отгружен",
  "3": "Завершен",
  "4": "Отменен",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-dashed border-border/60 bg-muted/40 animate-pulse">
              <CardContent className="pt-6 h-44" />
            </Card>
          ))}
        </div>
      )
    }

    if (productsQuery.isError) {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>Не удалось загрузить товары</span>
        </div>
      )
    }

    if (visibleProducts.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Пока нет добавленных наград
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span className="text-balance">{product.name}</span>
                <Badge variant="outline" className="rounded-full border-border px-2 py-0 text-[11px]">
                  В наличии: {product.stock}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground min-h-[48px]">{product.description || "Описание отсутствует"}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-primary">{formatPoints(product.price)}</span>
                {userType === "child" ? (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handlePurchase(product)}
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    Купить
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Править
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={pendingDeletionId === product.id}
                    >
                      {pendingDeletionId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Удалить
                    </Button>
                  </div>
                )}
              </div>
              {isParent && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className={product.isActive ? "text-emerald-600" : "text-muted-foreground"}>
                    {product.isActive ? "Активна" : "Скрыта"}
                  </span>
                  <span>Создано: {new Date(product.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderOrders = () => {
    if (ordersQuery.isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index} className="border-dashed border-border/60 bg-muted/40 animate-pulse">
              <CardContent className="pt-6 h-36" />
            </Card>
          ))}
        </div>
      )
    }

    if (ordersQuery.isError) {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>Не удалось загрузить заказы</span>
        </div>
      )
    }

    if (!ordersQuery.data || ordersQuery.data.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          У вас пока нет заказов
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordersQuery.data.map((order) => {
          const statusKey = resolveStatusKey(order.status)
          const badgeStyle = statusStyles[statusKey] ?? "bg-muted text-foreground border-border"
          const badgeLabel = statusLabels[statusKey] ?? "Статус неизвестен"

          return (
            <Card key={order.id} className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Заказ #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <Badge variant="outline" className={`border px-2 py-1 text-[11px] ${badgeStyle}`}>
                    {badgeLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{order.items.length} поз.</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Truck className="h-4 w-4" />
                    {formatPoints(order.totalAmount)}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} шт. · {formatPoints(item.unitPrice)} за шт.
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatPoints(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Каталог наград</h3>
            <p className="text-sm text-muted-foreground">
              {isParent
                ? "Редактируйте награды и управляйте запасами в реальном времени"
                : "Обменивайте заработанные очки на награды"}
            </p>
          </div>
        </div>
        {renderProducts()}
      </div>

      {userType === "child" && (
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-semibold">Мои обмены</h3>
            <p className="text-sm text-muted-foreground">История списаний очков</p>
          </div>
          {renderOrders()}
        </div>
      )}

      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => (!open ? setSelectedProduct(null) : undefined)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать награду</DialogTitle>
            <DialogDescription>Обновите название, описание, стоимость или статус награды</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Название</Label>
              <Input
                id="reward-name"
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-description">Описание</Label>
              <Textarea
                id="reward-description"
                rows={3}
                value={productForm.description}
                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={updateProduct.isPending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-price">Стоимость (очки)</Label>
                <Input
                  id="reward-price"
                  type="number"
                  min="0"
                  step="10"
                  value={productForm.price}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-stock">Количество</Label>
                <Input
                  id="reward-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.stock}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
                  disabled={updateProduct.isPending}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={productForm.isActive}
                onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                disabled={updateProduct.isPending}
              />
              Отображать в магазине
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedProduct(null)}
              disabled={updateProduct.isPending}
            >
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleSaveProduct} disabled={updateProduct.isPending}>
              {updateProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
