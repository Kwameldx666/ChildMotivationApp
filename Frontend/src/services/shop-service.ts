import { httpClient } from '@/services/api/http-client'

export type OrderStatus = 
  | 'Pending'          // 0 - Ожидает оплаты
  | 'Paid'             // 1 - Оплачен
  | 'AwaitingDelivery' // 2 - Ожидает выдачи награды
  | 'Delivered'        // 3 - Награда выдана родителем
  | 'Confirmed'        // 4 - Получение подтверждено ребёнком
  | 'Completed'        // 5 - Завершён
  | 'Cancelled'        // 6 - Отменён
  | number

export interface ProductDto {
  id: string
  name: string
  description?: string | null
  price: number
  stock: number
  isActive: boolean
  createdAt: string
  isPremium?: boolean
  requiredTier?: string | null
  category?: string | null
  imageUrl?: string | null
  recommendedAge?: number | null
  isExclusive?: boolean
}

export interface OrderItemDto {
  id: string
  orderId: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderDto {
  id: string
  userId: string
  createdAt: string
  status: OrderStatus
  totalAmount: number
  items: OrderItemDto[]
  deliveredAt?: string | null
  deliveredByUserId?: string | null
  confirmedAt?: string | null
  confirmedByUserId?: string | null
  deliveryNotes?: string | null
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string
    quantity: number
  }>
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
}

export interface UpsertProductPayload {
  name: string
  description?: string | null
  price: number
  stock: number
  isActive?: boolean
}

export interface MarkOrderDeliveredPayload {
  deliveredByUserId: string
  notes?: string | null
}

export interface ConfirmOrderReceivedPayload {
  confirmedByUserId: string
}

export const shopService = {
  listProducts() {
    return httpClient.get<ProductDto[]>('/api-gateway/shop/products')
  },
  listOrders() {
    return httpClient.get<OrderDto[]>('/api-gateway/shop/orders')
  },
  createOrder(payload: CreateOrderPayload) {
    return httpClient.post<OrderDto>('/api-gateway/shop/orders', payload)
  },
  updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload) {
    return httpClient.put<void>(`/api-gateway/shop/orders/${orderId}/status`, payload)
  },
  deleteOrder(orderId: string) {
    return httpClient.delete<void>(`/api-gateway/shop/orders/${orderId}`)
  },
  createProduct(payload: UpsertProductPayload) {
    return httpClient.post<ProductDto>('/api-gateway/shop/products', {
      ...payload,
      isActive: payload.isActive ?? true,
    })
  },
  updateProduct(productId: string, payload: UpsertProductPayload) {
    return httpClient.put<ProductDto>(`/api-gateway/shop/products/${productId}`, {
      ...payload,
      isActive: payload.isActive ?? true,
    })
  },
  deleteProduct(productId: string) {
    return httpClient.delete<void>(`/api-gateway/shop/products/${productId}`)
  },
  markOrderAsDelivered(orderId: string, payload: MarkOrderDeliveredPayload) {
    return httpClient.post<void>(`/api-gateway/shop/orders/${orderId}/mark-delivered`, payload)
  },
  confirmOrderReceived(orderId: string, payload: ConfirmOrderReceivedPayload) {
    return httpClient.post<void>(`/api-gateway/shop/orders/${orderId}/confirm-received`, payload)
  },
}
