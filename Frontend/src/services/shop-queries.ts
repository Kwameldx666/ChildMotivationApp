import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  shopService,
  CreateOrderPayload,
  OrderDto,
  ProductDto,
  UpdateOrderStatusPayload,
  UpsertProductPayload,
  MarkOrderDeliveredPayload,
  ConfirmOrderReceivedPayload,
} from './shop-service'

export function useShopProducts() {
  return useQuery<ProductDto[]>({
    queryKey: ['shop', 'products'],
    queryFn: () => shopService.listProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    // refetchOnMount: true (default) — ensures data loads when the shop tab opens
  })
}

export function useShopOrders(userId?: string, enabled: boolean = true) {
  return useQuery<OrderDto[]>({
    queryKey: ['shop', 'orders', userId ?? 'all'],
    queryFn: () => shopService.listOrders(userId),
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    enabled,
    refetchOnWindowFocus: false,
    // refetchOnMount: true (default)
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => shopService.createOrder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'orders'] })
    },
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertProductPayload) => shopService.createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'products'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderStatusPayload }) =>
      shopService.updateOrderStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'orders'] })
    },
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shopService.deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'orders'] })
    },
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertProductPayload }) =>
      shopService.updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => shopService.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'products'] })
    },
  })
}

export function useMarkOrderAsDelivered() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkOrderDeliveredPayload }) =>
      shopService.markOrderAsDelivered(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'orders'] })
    },
  })
}

export function useConfirmOrderReceived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ConfirmOrderReceivedPayload }) =>
      shopService.confirmOrderReceived(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop', 'orders'] })
    },
  })
}

/**
 * Fetch ALL orders (no userId filter) — for parent to see children's pending requests.
 * Polls every 30 s so the parent sees new orders without refreshing.
 */
export function useAllShopOrders(enabled: boolean = true) {
  return useQuery<OrderDto[]>({
    queryKey: ['shop', 'orders', 'all-family'],
    queryFn: () => shopService.listOrders(),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
}
