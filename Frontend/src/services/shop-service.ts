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
  userId: string
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

// ─── Mock fallback products (mirrors ShopService DB seed) ──────────────────
// Used when the real API is unreachable so the shop always shows content.

const MOCK_PRODUCTS: ProductDto[] = [
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000001',
    name: 'Наклейка на выбор',
    description: 'Ребёнок выбирает одну наклейку из коллекции',
    price: 20, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'stickers', imageUrl: '/icons/sticker.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000002',
    name: 'Выбор музыки в машине',
    description: 'Ребёнок выбирает плейлист на поездку',
    price: 25, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'privileges', imageUrl: '/icons/music.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000003',
    name: 'Дополнительные 15 минут игры',
    description: 'Ещё 15 минут любимой игры или мультика',
    price: 30, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'screen_time', imageUrl: '/icons/gamepad.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000004',
    name: 'Сладкий бонус',
    description: 'Одна конфета или печенье на выбор',
    price: 20, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'treats', imageUrl: '/icons/candy.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000005',
    name: 'Не заправлять кровать',
    description: 'Один день без заправки кровати',
    price: 40, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'privileges', imageUrl: '/icons/bed.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-2222-4000-8000-000000000001',
    name: 'Настольная игра с родителем',
    description: 'Сесть и сыграть в настолку вместе',
    price: 100, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'family', imageUrl: '/icons/board-game.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-2222-4000-8000-000000000002',
    name: 'Пикник в гостиной',
    description: 'Расстелить плед и устроить пикник с закусками дома',
    price: 120, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'family', imageUrl: '/icons/picnic.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-2222-4000-8000-000000000003',
    name: 'Мини-кинотеатр',
    description: 'Выбрать мультфильм и посмотреть с попкорном',
    price: 150, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'entertainment', imageUrl: '/icons/cinema.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-2222-4000-8000-000000000004',
    name: 'Поход в парк',
    description: 'Провести время на свежем воздухе',
    price: 200, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: false, category: 'family', imageUrl: '/icons/park.png', isExclusive: false,
  },
  {
    id: 'a1b2c3d4-3333-4000-8000-000000000001',
    name: 'Поездка в зоопарк',
    description: 'Целый день в зоопарке',
    price: 500, stock: 999, isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    isPremium: true, category: 'entertainment', imageUrl: '/icons/zoo.png', isExclusive: false,
  },
]

// In-memory overrides applied by createProduct / updateProduct / deleteProduct
// so the mock stays consistent within a session.
const mockOverrides: Map<string, ProductDto | null> = new Map()

function getMockProducts(): ProductDto[] {
  const base = MOCK_PRODUCTS.map(p => {
    if (mockOverrides.has(p.id)) {
      return mockOverrides.get(p.id) as ProductDto | null
    }
    return p
  }).filter((p): p is ProductDto => p !== null)

  // Add any newly created products (keys not in MOCK_PRODUCTS)
  for (const [id, product] of mockOverrides) {
    if (product && !MOCK_PRODUCTS.some(p => p.id === id)) {
      base.push(product)
    }
  }

  return base
}

// ─── Mock orders storage ────────────────────────────────────────────────────
const MOCK_ORDERS_KEY = 'familyquest:mock-shop-orders:v1'

function loadMockOrders(): OrderDto[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(MOCK_ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function saveMockOrders(orders: OrderDto[]): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders)) } catch { /* ignore */ }
}

// ─── Service ────────────────────────────────────────────────────────────────

export const shopService = {
  async listProducts(): Promise<ProductDto[]> {
    try {
      const result = await httpClient.get<ProductDto[]>('/api-gateway/shop/products')
      // Guard: API must return a real non-empty array; otherwise fall back to mock
      if (Array.isArray(result) && result.length > 0) return result
      return getMockProducts()
    } catch {
      return getMockProducts()
    }
  },

  async listOrders(userId?: string): Promise<OrderDto[]> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
    try {
      const result = await httpClient.get<OrderDto[]>(`/api-gateway/shop/orders${query}`)
      if (Array.isArray(result)) return result
      return loadMockOrders().filter(o => !userId || o.userId === userId)
    } catch {
      return loadMockOrders().filter(o => !userId || o.userId === userId)
    }
  },

  async createOrder(payload: CreateOrderPayload): Promise<OrderDto> {
    try {
      return await httpClient.post<OrderDto>('/api-gateway/shop/orders', payload)
    } catch {
      // Mock order creation
      const products = getMockProducts()
      const items: OrderItemDto[] = payload.items.map(item => {
        const product = products.find(p => p.id === item.productId)
        const unitPrice = product?.price ?? 0
        return {
          id: `mock-item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          orderId: '',
          productId: item.productId,
          productName: product?.name ?? 'Товар',
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        }
      })
      const totalAmount = items.reduce((sum, i) => sum + i.lineTotal, 0)
      const orderId = `mock-order-${Date.now()}`
      const order: OrderDto = {
        id: orderId,
        userId: payload.userId,
        createdAt: new Date().toISOString(),
        status: 'Pending',
        totalAmount,
        items: items.map(i => ({ ...i, orderId })),
      }
      const existing = loadMockOrders()
      saveMockOrders([...existing, order])
      return order
    }
  },

  updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload) {
    return httpClient.put<void>(`/api-gateway/shop/orders/${orderId}/status`, payload)
  },

  deleteOrder(orderId: string) {
    return httpClient.delete<void>(`/api-gateway/shop/orders/${orderId}`)
  },

  async createProduct(payload: UpsertProductPayload): Promise<ProductDto> {
    try {
      return await httpClient.post<ProductDto>('/api-gateway/shop/products', {
        ...payload,
        isActive: payload.isActive ?? true,
      })
    } catch {
      const newProduct: ProductDto = {
        id: `mock-product-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price,
        stock: payload.stock,
        isActive: payload.isActive ?? true,
        createdAt: new Date().toISOString(),
        isPremium: false,
        isExclusive: false,
      }
      mockOverrides.set(newProduct.id, newProduct)
      return newProduct
    }
  },

  async updateProduct(productId: string, payload: UpsertProductPayload): Promise<ProductDto> {
    try {
      return await httpClient.put<ProductDto>(`/api-gateway/shop/products/${productId}`, {
        ...payload,
        isActive: payload.isActive ?? true,
      })
    } catch {
      const existing = getMockProducts().find(p => p.id === productId)
      const updated: ProductDto = {
        ...(existing ?? { id: productId, createdAt: new Date().toISOString(), isPremium: false, isExclusive: false }),
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price,
        stock: payload.stock,
        isActive: payload.isActive ?? true,
      }
      mockOverrides.set(productId, updated)
      return updated
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      await httpClient.delete<void>(`/api-gateway/shop/products/${productId}`)
    } catch {
      mockOverrides.set(productId, null)
    }
  },

  async markOrderAsDelivered(orderId: string, payload: MarkOrderDeliveredPayload): Promise<void> {
    try {
      await httpClient.post<void>(`/api-gateway/shop/orders/${orderId}/mark-delivered`, payload)
    } catch {
      const orders = loadMockOrders().map(o =>
        o.id === orderId
          ? { ...o, status: 'Delivered' as OrderStatus, deliveredAt: new Date().toISOString(), deliveredByUserId: payload.deliveredByUserId, deliveryNotes: payload.notes ?? null }
          : o
      )
      saveMockOrders(orders)
    }
  },

  async confirmOrderReceived(orderId: string, payload: ConfirmOrderReceivedPayload): Promise<void> {
    try {
      await httpClient.post<void>(`/api-gateway/shop/orders/${orderId}/confirm-received`, payload)
    } catch {
      const orders = loadMockOrders().map(o =>
        o.id === orderId
          ? { ...o, status: 'Confirmed' as OrderStatus, confirmedAt: new Date().toISOString(), confirmedByUserId: payload.confirmedByUserId }
          : o
      )
      saveMockOrders(orders)
    }
  },
}
