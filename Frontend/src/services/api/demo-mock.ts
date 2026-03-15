import type { RequestOptions } from '@/services/api/http-client'

const DEMO_MODE_STORAGE_KEY = 'familyquest:demo-mode'
const DEMO_DB_STORAGE_KEY = 'familyquest:demo-db:v1'

type DemoRole = 'parent' | 'child'

type DemoUser = {
  id: string
  email: string
  password: string
  name: string
  lastName: string
  role: DemoRole
  age?: number
  avatar?: string
  familyId: string
}

type DemoFamily = {
  id: string
  code: string
  name: string
  emblem: string
  parentIds: string[]
  childIds: string[]
}

type DemoTask = {
  id: string
  title: string
  description?: string
  completed: boolean
  pendingApproval: boolean
  createdAt: string
  updatedAt?: string | null
  completedAt?: string | null
  createdByUserId: string
  difficulty?: number
  reward?: number
  rewardPoints?: number
  evidence: {
    requirement: 0 | 1 | 2 | 3 | 'none' | 'photo' | 'video' | 'document'
    isSubmitted: boolean
    fileName?: string | null
    contentType?: string | null
    fileSize?: number | null
    uploadedAt?: string | null
    uploadedByUserId?: string | null
  }
  assignedToUserId?: string
  dueDate?: string | null
}

type DemoProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  stock: number
  isActive: boolean
  createdAt: string
  category?: string | null
  imageUrl?: string | null
}

type DemoOrderItem = {
  id: string
  orderId: string
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

type DemoOrder = {
  id: string
  userId: string
  createdAt: string
  status: string
  totalAmount: number
  items: DemoOrderItem[]
  deliveredAt?: string | null
  deliveredByUserId?: string | null
  confirmedAt?: string | null
  confirmedByUserId?: string | null
  deliveryNotes?: string | null
}

type DemoNotification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

type DemoMission = {
  id: string
  title: string
  description: string
  icon: string
  recurrence: 'daily' | 'weekly'
  progress: number
  total: number
  rewardXp: number
  completed: boolean
}

type DemoAchievement = {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  total: number
  unlocked: boolean
  rewardXp: number
}

type DemoSubscription = {
  tier: string
  status: string
  startDate: string
  endDate: string | null
  pricePerMonth: number
  autoRenew: boolean
  maxChildren: number
  maxTasksPerDay: number
  hasAIAssistant: boolean
  hasAdvancedAnalytics: boolean
  hasCustomRewards: boolean
  hasPrioritySupport: boolean
  hasFamilySharing: boolean
  hasOfflineMode: boolean
  daysRemaining: number | null
}

type DemoDb = {
  users: DemoUser[]
  families: DemoFamily[]
  tasks: DemoTask[]
  products: DemoProduct[]
  orders: DemoOrder[]
  notifications: DemoNotification[]
  missions: DemoMission[]
  achievements: DemoAchievement[]
  subscriptionsByUserId: Record<string, DemoSubscription>
}

export type DemoRequestInput = {
  path: string
  method?: string
  body?: unknown
  responseType?: RequestOptions['responseType']
}

type DemoResponse = {
  status: number
  data: unknown
}

let serverDb: DemoDb | null = null

const nowIso = () => new Date().toISOString()

const makeId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parseMaybeJson = <T>(value: unknown): T | null => {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

const createSeedDb = (): DemoDb => {
  const familyId = 'demo-family-1'
  const parentId = 'demo-parent-1'
  const childOneId = 'demo-child-1'
  const childTwoId = 'demo-child-2'
  const createdAt = nowIso()

  const users: DemoUser[] = [
    {
      id: parentId,
      email: 'parent@demo.local',
      password: 'demo123',
      name: 'Елена',
      lastName: 'Иванова',
      role: 'parent',
      avatar: '👩',
      familyId,
    },
    {
      id: childOneId,
      email: 'masha@demo.local',
      password: 'demo123',
      name: 'Маша',
      lastName: 'Иванова',
      role: 'child',
      age: 8,
      avatar: '👧',
      familyId,
    },
    {
      id: childTwoId,
      email: 'max@demo.local',
      password: 'demo123',
      name: 'Макс',
      lastName: 'Иванов',
      role: 'child',
      age: 12,
      avatar: '🧒',
      familyId,
    },
  ]

  const families: DemoFamily[] = [
    {
      id: familyId,
      code: 'DEMO123',
      name: 'Demo Family',
      emblem: '✨',
      parentIds: [parentId],
      childIds: [childOneId, childTwoId],
    },
  ]

  const tasks: DemoTask[] = [
    {
      id: 'demo-task-1',
      title: 'Убрать игрушки',
      description: 'Собрать игрушки в коробку и протереть стол',
      completed: false,
      pendingApproval: false,
      createdAt,
      createdByUserId: parentId,
      difficulty: 2,
      reward: 100,
      rewardPoints: 5,
      evidence: { requirement: 'photo', isSubmitted: false },
      assignedToUserId: childOneId,
    },
    {
      id: 'demo-task-2',
      title: 'Прочитать 10 страниц',
      description: 'Любая книга на выбор, затем краткий пересказ',
      completed: true,
      pendingApproval: false,
      createdAt,
      completedAt: createdAt,
      createdByUserId: parentId,
      difficulty: 3,
      reward: 140,
      rewardPoints: 10,
      evidence: { requirement: 'none', isSubmitted: false },
      assignedToUserId: childTwoId,
    },
    {
      id: 'demo-task-3',
      title: 'Помочь накрыть на стол',
      description: 'Расставить тарелки и приборы к ужину',
      completed: false,
      pendingApproval: true,
      createdAt,
      createdByUserId: parentId,
      difficulty: 1,
      reward: 80,
      rewardPoints: 2,
      evidence: {
        requirement: 'photo',
        isSubmitted: true,
        uploadedAt: createdAt,
        uploadedByUserId: childOneId,
        fileName: 'table.jpg',
        contentType: 'image/jpeg',
        fileSize: 183_000,
      },
      assignedToUserId: childOneId,
    },
  ]

  const products: DemoProduct[] = [
    {
      id: 'demo-product-1',
      name: 'Поход в кино',
      description: 'Совместный просмотр фильма',
      price: 350,
      stock: 5,
      isActive: true,
      createdAt,
      category: 'Leisure',
    },
    {
      id: 'demo-product-2',
      name: 'Пицца вечер',
      description: 'Выбор начинки ребёнком',
      price: 500,
      stock: 3,
      isActive: true,
      createdAt,
      category: 'Food',
    },
  ]

  const orderItem: DemoOrderItem = {
    id: 'demo-order-item-1',
    orderId: 'demo-order-1',
    productId: 'demo-product-1',
    productName: 'Поход в кино',
    unitPrice: 350,
    quantity: 1,
    lineTotal: 350,
  }

  const orders: DemoOrder[] = [
    {
      id: 'demo-order-1',
      userId: childOneId,
      createdAt,
      status: 'AwaitingDelivery',
      totalAmount: 350,
      items: [orderItem],
    },
  ]

  const notifications: DemoNotification[] = [
    {
      id: 'demo-notification-1',
      userId: parentId,
      type: 'task_completed',
      title: 'Задача выполнена',
      message: 'Маша отправила фото-подтверждение по задаче «Помочь накрыть на стол»',
      isRead: false,
      createdAt,
    },
    {
      id: 'demo-notification-2',
      userId: childOneId,
      type: 'reward_purchased',
      title: 'Награда куплена',
      message: 'Вы купили «Поход в кино» за 350 очков',
      isRead: false,
      createdAt,
    },
  ]

  const missions: DemoMission[] = [
    {
      id: 'demo-mission-1',
      title: '3 задания за день',
      description: 'Выполни 3 задания до вечера',
      icon: '🎯',
      recurrence: 'daily',
      progress: 2,
      total: 3,
      rewardXp: 40,
      completed: false,
    },
    {
      id: 'demo-mission-2',
      title: '5 подтверждений фото',
      description: 'Отправь 5 фото за неделю',
      icon: '📸',
      recurrence: 'weekly',
      progress: 3,
      total: 5,
      rewardXp: 120,
      completed: false,
    },
  ]

  const achievements: DemoAchievement[] = [
    {
      id: 'demo-achievement-1',
      title: 'Юный помощник',
      description: 'Выполни 10 задач',
      icon: '🏅',
      progress: 8,
      total: 10,
      unlocked: false,
      rewardXp: 100,
    },
    {
      id: 'demo-achievement-2',
      title: 'Супер серия',
      description: '7 дней подряд выполнять задания',
      icon: '🔥',
      progress: 7,
      total: 7,
      unlocked: true,
      rewardXp: 200,
    },
  ]

  const subscription: DemoSubscription = {
    tier: 'Premium',
    status: 'Active',
    startDate: createdAt,
    endDate: null,
    pricePerMonth: 9.99,
    autoRenew: true,
    maxChildren: 10,
    maxTasksPerDay: 100,
    hasAIAssistant: true,
    hasAdvancedAnalytics: true,
    hasCustomRewards: true,
    hasPrioritySupport: true,
    hasFamilySharing: true,
    hasOfflineMode: true,
    daysRemaining: null,
  }

  return {
    users,
    families,
    tasks,
    products,
    orders,
    notifications,
    missions,
    achievements,
    subscriptionsByUserId: {
      [parentId]: subscription,
      [childOneId]: subscription,
      [childTwoId]: subscription,
    },
  }
}

const loadDb = (): DemoDb => {
  if (typeof window === 'undefined') {
    if (!serverDb) serverDb = createSeedDb()
    return serverDb
  }

  try {
    const raw = window.localStorage.getItem(DEMO_DB_STORAGE_KEY)
    if (!raw) {
      const seeded = createSeedDb()
      window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw) as DemoDb
    return parsed
  } catch {
    const seeded = createSeedDb()
    try {
      window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(seeded))
    } catch {}
    return seeded
  }
}

const saveDb = (db: DemoDb) => {
  if (typeof window === 'undefined') {
    serverDb = db
    return
  }
  try {
    window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // ignore storage failures in demo mode
  }
}

const getCurrentUserId = (db: DemoDb): string => {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('familyapp_current_user')
      if (raw) {
        const user = JSON.parse(raw) as { id?: string }
        if (user?.id) return user.id
      }
    } catch {}
  }
  return db.users[0]?.id ?? 'demo-parent-1'
}

const getUserById = (db: DemoDb, userId: string | undefined) => {
  if (!userId) return undefined
  return db.users.find(user => user.id === userId)
}

const toAuthPayload = (db: DemoDb, user: DemoUser) => {
  const family = db.families.find(entry => entry.id === user.familyId)
  return {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    tokenType: 'Bearer',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
    },
    profile: {
      name: user.name,
      lastName: user.lastName,
      avatar: user.avatar ?? '',
      role: user.role,
      age: user.age,
    },
    family: family
      ? {
          code: family.code,
          name: family.name,
          emblem: family.emblem,
        }
      : undefined,
  }
}

const buildFamilyMembers = (db: DemoDb, userId: string): Array<{
  id: string
  role: string
  name: string
  lastName?: string | null
  avatar?: string | null
  age?: number | null
}> => {
  const sourceUser = getUserById(db, userId)
  if (!sourceUser) return []
  return db.users
    .filter(user => user.familyId === sourceUser.familyId)
    .map(user => ({
      id: user.id,
      role: user.role,
      name: user.name,
      lastName: user.lastName,
      avatar: user.avatar ?? null,
      age: user.age ?? null,
    }))
}

const normalizeMethod = (method?: string) => (method ?? 'GET').toUpperCase()

const pathMatches = (pathname: string, pattern: RegExp) => pattern.exec(pathname)

const makeAnalytics = (db: DemoDb) => {
  const children = db.users.filter(user => user.role === 'child')
  const completed = db.tasks.filter(task => task.completed).length
  const total = db.tasks.length
  const points = db.tasks.reduce((sum, task) => sum + (task.reward ?? 0), 0)
  const today = new Date()

  const weeklyActivity = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - idx))
    return {
      day: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      tasksCompleted: Math.max(0, completed - (6 - idx) % 3),
      pointsEarned: 40 + idx * 10,
    }
  })

  const childrenStats = children.map((child, index) => {
    const childTasks = db.tasks.filter(task => task.assignedToUserId === child.id)
    const childCompleted = childTasks.filter(task => task.completed).length
    const palette = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981']
    return {
      childId: child.id,
      childName: child.name,
      totalPoints: childTasks.reduce((sum, task) => sum + (task.reward ?? 0), 0),
      completedTasks: childCompleted,
      pendingTasks: Math.max(0, childTasks.length - childCompleted),
      color: palette[index % palette.length],
    }
  })

  const perChildActivity = children.map(child => ({
    childId: child.id,
    data: weeklyActivity,
  }))

  const perChildDifficulty = children.map(child => ({
    childId: child.id,
    data: [
      { name: 'Легко', value: 3, color: '#84cc16' },
      { name: 'Средне', value: 4, color: '#eab308' },
      { name: 'Сложно', value: 2, color: '#f97316' },
    ],
  }))

  const progressData = [
    { week: 'W1', completed: 8, total: 12 },
    { week: 'W2', completed: 10, total: 12 },
    { week: 'W3', completed: 9, total: 12 },
    { week: 'W4', completed: 11, total: 12 },
  ]

  const pointsTrend = [
    { date: '01.03', points: 120 },
    { date: '05.03', points: 190 },
    { date: '10.03', points: 260 },
    { date: '15.03', points: 340 },
  ]

  return {
    totalPoints: points,
    completedTasks: completed,
    totalTasks: total,
    activeChildren: children.length,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    weeklyActivity,
    childrenStats,
    difficultyDistribution: [
      { name: 'Легко', value: 6, color: '#84cc16' },
      { name: 'Средне', value: 7, color: '#eab308' },
      { name: 'Сложно', value: 3, color: '#f97316' },
    ],
    weeklyProgress: progressData,
    taskStatus: {
      completed,
      inProgress: db.tasks.filter(task => !task.completed && !task.pendingApproval).length,
      overdue: db.tasks.filter(task => !task.completed && !!task.dueDate && new Date(task.dueDate) < new Date()).length,
    },
    pointsTrend,
    perChildActivity,
    perChildDifficulty,
    perChildProgress: children.map(child => ({ childId: child.id, data: progressData })),
    perChildPointsTrend: children.map(child => ({ childId: child.id, data: pointsTrend })),
  }
}

const asBlob = (text: string) => {
  if (typeof Blob === 'undefined') return text
  return new Blob([text], { type: 'text/plain' })
}

const listNotificationsForCurrentUser = (db: DemoDb) => {
  const userId = getCurrentUserId(db)
  return db.notifications.filter(item => item.userId === userId)
}

const buildAiReply = (message: string) => {
  return `Отличная идея!\n\nПо запросу «${message}» предлагаю:\n- разбить задачу на 2-3 шага\n- добавить понятный дедлайн\n- закрепить быструю награду за выполнение\n\nЕсли хотите, могу сразу создать черновик задач.`
}

const resolveDemo = (input: DemoRequestInput): DemoResponse | null => {
  const method = normalizeMethod(input.method)
  const url = new URL(input.path, 'http://demo.local')
  const pathname = url.pathname
  const query = url.searchParams

  const db = loadDb()
  const currentUserId = getCurrentUserId(db)

  const body = parseMaybeJson<Record<string, unknown>>(input.body) ?? (input.body as Record<string, unknown> | null)

  if (method === 'POST' && pathname === '/api-gateway/auth/login') {
    const email = String(body?.email ?? '').toLowerCase()
    const password = String(body?.password ?? '')
    const user = db.users.find(item => item.email.toLowerCase() === email && item.password === password)
    if (!user) {
      return { status: 401, data: { message: 'Invalid credentials' } }
    }
    return { status: 200, data: toAuthPayload(db, user) }
  }

  if (method === 'POST' && pathname === '/api-gateway/auth/register') {
    const role = (body?.role as DemoRole | undefined) ?? 'parent'
    const profile = (body?.profile as Record<string, unknown> | undefined) ?? {}
    const familyPayload = (body?.family as Record<string, unknown> | undefined) ?? {}
    const userId = makeId('demo-user')
    const familyId = role === 'parent' ? makeId('demo-family') : db.families[0]?.id ?? makeId('demo-family')

    if (role === 'parent') {
      db.families.push({
        id: familyId,
        code: String(familyPayload.code ?? Math.random().toString(36).slice(2, 8).toUpperCase()),
        name: String(familyPayload.name ?? 'My Demo Family'),
        emblem: String(familyPayload.emblem ?? '✨'),
        parentIds: [userId],
        childIds: [],
      })
    }

    const user: DemoUser = {
      id: userId,
      email: String(body?.email ?? `${userId}@demo.local`),
      password: String(body?.password ?? 'demo123'),
      name: String(profile.name ?? 'Demo'),
      lastName: String(profile.lastName ?? 'User'),
      role,
      age: typeof profile.age === 'number' ? profile.age : undefined,
      avatar: String(profile.avatar ?? ''),
      familyId,
    }

    db.users.push(user)
    saveDb(db)
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/auth/me') {
    const user = getUserById(db, currentUserId) ?? db.users[0]
    return { status: 200, data: toAuthPayload(db, user) }
  }

  if (method === 'POST' && pathname === '/api-gateway/auth/logout') {
    return { status: 200, data: {} }
  }

  if (method === 'POST' && pathname === '/api-gateway/auth/refresh') {
    return {
      status: 200,
      data: {
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        tokenType: 'Bearer',
      },
    }
  }

  if (method === 'POST' && pathname.startsWith('/api-gateway/auth/')) {
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/tasks') {
    return { status: 200, data: db.tasks }
  }

  if (method === 'POST' && pathname === '/api-gateway/tasks') {
    const payload = body ?? {}
    const created: DemoTask = {
      id: makeId('task'),
      title: String(payload.title ?? 'Новая задача'),
      description: typeof payload.description === 'string' ? payload.description : undefined,
      completed: false,
      pendingApproval: false,
      createdAt: nowIso(),
      createdByUserId: currentUserId,
      difficulty: typeof payload.difficulty === 'number' ? payload.difficulty : 2,
      reward: typeof payload.reward === 'number' ? payload.reward : 100,
      rewardPoints: 5,
      evidence: {
        requirement: (payload.confirmationType as DemoTask['evidence']['requirement']) ?? 'photo',
        isSubmitted: false,
      },
      assignedToUserId: typeof payload.assignedToUserId === 'string' ? payload.assignedToUserId : undefined,
      dueDate: typeof payload.dueDate === 'string' ? payload.dueDate : null,
    }
    db.tasks = [created, ...db.tasks]
    saveDb(db)
    return { status: 200, data: created }
  }

  const taskById = pathMatches(pathname, /^\/api-gateway\/tasks\/([^/]+)$/)
  if (taskById && method === 'PUT') {
    const taskId = taskById[1]
    const idx = db.tasks.findIndex(task => task.id === taskId)
    if (idx < 0) return { status: 404, data: { message: 'Task not found' } }

    const current = db.tasks[idx]
    const next: DemoTask = {
      ...current,
      title: typeof body?.title === 'string' ? body.title : current.title,
      description: typeof body?.description === 'string' ? body.description : current.description,
      difficulty: typeof body?.difficulty === 'number' ? body.difficulty : current.difficulty,
      completed: typeof body?.completed === 'boolean' ? body.completed : current.completed,
      updatedAt: nowIso(),
      assignedToUserId: typeof body?.assignedToUserId === 'string' ? body.assignedToUserId : current.assignedToUserId,
    }
    db.tasks[idx] = next
    saveDb(db)
    return { status: 200, data: next }
  }

  if (taskById && method === 'DELETE') {
    const taskId = taskById[1]
    db.tasks = db.tasks.filter(task => task.id !== taskId)
    saveDb(db)
    return { status: 200, data: {} }
  }

  const completeTask = pathMatches(pathname, /^\/api-gateway\/tasks\/([^/]+)\/(complete|request-approval|approve|reject)$/)
  if (completeTask && method === 'POST') {
    const taskId = completeTask[1]
    const action = completeTask[2]
    const task = db.tasks.find(item => item.id === taskId)
    if (task) {
      if (action === 'complete') {
        task.completed = true
        task.completedAt = nowIso()
        task.pendingApproval = false
      }
      if (action === 'request-approval') {
        task.pendingApproval = true
      }
      if (action === 'approve') {
        task.pendingApproval = false
        task.completed = true
        task.completedAt = nowIso()
      }
      if (action === 'reject') {
        task.pendingApproval = false
        task.completed = false
      }
      task.updatedAt = nowIso()
      saveDb(db)
    }
    return { status: 200, data: {} }
  }

  const evidencePath = pathMatches(pathname, /^\/api-gateway\/tasks\/([^/]+)\/evidence$/)
  if (evidencePath && method === 'POST') {
    const taskId = evidencePath[1]
    const task = db.tasks.find(item => item.id === taskId)
    if (!task) return { status: 404, data: { message: 'Task not found' } }
    task.evidence = {
      requirement: task.evidence.requirement,
      isSubmitted: true,
      uploadedAt: nowIso(),
      uploadedByUserId: currentUserId,
      fileName: 'evidence.jpg',
      contentType: 'image/jpeg',
      fileSize: 245_000,
    }
    task.pendingApproval = true
    saveDb(db)
    return { status: 200, data: task }
  }

  if (evidencePath && method === 'GET') {
    return { status: 200, data: asBlob('demo evidence') }
  }

  if (method === 'GET' && pathname === '/api-gateway/shop/products') {
    return { status: 200, data: db.products }
  }

  if (method === 'POST' && pathname === '/api-gateway/shop/products') {
    const created: DemoProduct = {
      id: makeId('product'),
      name: String(body?.name ?? 'Новая награда'),
      description: typeof body?.description === 'string' ? body.description : null,
      price: typeof body?.price === 'number' ? body.price : 100,
      stock: typeof body?.stock === 'number' ? body.stock : 1,
      isActive: typeof body?.isActive === 'boolean' ? body.isActive : true,
      createdAt: nowIso(),
      category: typeof body?.category === 'string' ? body.category : null,
      imageUrl: null,
    }
    db.products = [created, ...db.products]
    saveDb(db)
    return { status: 200, data: created }
  }

  const productById = pathMatches(pathname, /^\/api-gateway\/shop\/products\/([^/]+)$/)
  if (productById && method === 'PUT') {
    const productId = productById[1]
    const product = db.products.find(item => item.id === productId)
    if (!product) return { status: 404, data: { message: 'Product not found' } }
    product.name = typeof body?.name === 'string' ? body.name : product.name
    product.description = typeof body?.description === 'string' ? body.description : product.description
    product.price = typeof body?.price === 'number' ? body.price : product.price
    product.stock = typeof body?.stock === 'number' ? body.stock : product.stock
    product.isActive = typeof body?.isActive === 'boolean' ? body.isActive : product.isActive
    saveDb(db)
    return { status: 200, data: product }
  }

  if (productById && method === 'DELETE') {
    db.products = db.products.filter(item => item.id !== productById[1])
    saveDb(db)
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/shop/orders') {
    return { status: 200, data: db.orders }
  }

  if (method === 'POST' && pathname === '/api-gateway/shop/orders') {
    const payloadItems = Array.isArray(body?.items) ? body.items as Array<{ productId: string; quantity: number }> : []
    const items: DemoOrderItem[] = payloadItems
      .map(item => {
        const product = db.products.find(entry => entry.id === item.productId)
        if (!product) return null
        return {
          id: makeId('order-item'),
          orderId: 'temp',
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        }
      })
      .filter(Boolean) as DemoOrderItem[]

    const orderId = makeId('order')
    const order: DemoOrder = {
      id: orderId,
      userId: currentUserId,
      createdAt: nowIso(),
      status: 'AwaitingDelivery',
      totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      items: items.map(item => ({ ...item, orderId })),
    }

    db.orders = [order, ...db.orders]
    saveDb(db)
    return { status: 200, data: order }
  }

  const orderStatusPath = pathMatches(pathname, /^\/api-gateway\/shop\/orders\/([^/]+)\/status$/)
  if (orderStatusPath && method === 'PUT') {
    const order = db.orders.find(item => item.id === orderStatusPath[1])
    if (order && typeof body?.status !== 'undefined') {
      order.status = String(body.status)
      saveDb(db)
    }
    return { status: 200, data: {} }
  }

  const orderDeletePath = pathMatches(pathname, /^\/api-gateway\/shop\/orders\/([^/]+)$/)
  if (orderDeletePath && method === 'DELETE') {
    db.orders = db.orders.filter(item => item.id !== orderDeletePath[1])
    saveDb(db)
    return { status: 200, data: {} }
  }

  const orderMarkPath = pathMatches(pathname, /^\/api-gateway\/shop\/orders\/([^/]+)\/(mark-delivered|confirm-received)$/)
  if (orderMarkPath && method === 'POST') {
    const order = db.orders.find(item => item.id === orderMarkPath[1])
    if (order) {
      if (orderMarkPath[2] === 'mark-delivered') {
        order.status = 'Delivered'
        order.deliveredAt = nowIso()
        order.deliveredByUserId = String(body?.deliveredByUserId ?? currentUserId)
        order.deliveryNotes = typeof body?.notes === 'string' ? body.notes : null
      } else {
        order.status = 'Completed'
        order.confirmedAt = nowIso()
        order.confirmedByUserId = String(body?.confirmedByUserId ?? currentUserId)
      }
      saveDb(db)
    }
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/notifications') {
    return { status: 200, data: listNotificationsForCurrentUser(db) }
  }

  if (method === 'GET' && pathname === '/api-gateway/notifications/unread') {
    const unread = listNotificationsForCurrentUser(db).filter(item => !item.isRead)
    return { status: 200, data: unread }
  }

  if (method === 'GET' && pathname === '/api-gateway/notifications/unread/count') {
    const count = listNotificationsForCurrentUser(db).filter(item => !item.isRead).length
    return { status: 200, data: { count } }
  }

  if (method === 'POST' && pathname === '/api-gateway/notifications/mark-read') {
    const ids = Array.isArray(body?.notificationIds) ? body.notificationIds as string[] : []
    db.notifications = db.notifications.map(item => (ids.includes(item.id) ? { ...item, isRead: true } : item))
    saveDb(db)
    return { status: 200, data: {} }
  }

  if (method === 'POST' && pathname === '/api-gateway/notifications/mark-all-read') {
    const userId = currentUserId
    db.notifications = db.notifications.map(item => (item.userId === userId ? { ...item, isRead: true } : item))
    saveDb(db)
    return { status: 200, data: {} }
  }

  const notificationDelete = pathMatches(pathname, /^\/api-gateway\/notifications\/([^/]+)$/)
  if (notificationDelete && method === 'DELETE') {
    db.notifications = db.notifications.filter(item => item.id !== notificationDelete[1])
    saveDb(db)
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/missions') {
    const recurrence = query.get('recurrence')
    const result = recurrence ? db.missions.filter(item => item.recurrence === recurrence) : db.missions
    return { status: 200, data: result }
  }

  const missionProgress = pathMatches(pathname, /^\/api-gateway\/missions\/([^/]+)\/progress$/)
  if (missionProgress && method === 'POST') {
    const mission = db.missions.find(item => item.id === missionProgress[1])
    if (mission) {
      const delta = typeof body?.progressDelta === 'number' ? body.progressDelta : 1
      mission.progress = Math.min(mission.total, mission.progress + delta)
      mission.completed = mission.progress >= mission.total
      saveDb(db)
      return { status: 200, data: mission }
    }
    return { status: 404, data: { message: 'Mission not found' } }
  }

  if (method === 'GET' && pathname === '/api-gateway/achievements') {
    return { status: 200, data: db.achievements }
  }

  const achievementProgress = pathMatches(pathname, /^\/api-gateway\/achievements\/([^/]+)\/progress$/)
  if (achievementProgress && method === 'POST') {
    const achievement = db.achievements.find(item => item.id === achievementProgress[1])
    if (!achievement) return { status: 404, data: { message: 'Achievement not found' } }
    const delta = typeof body?.progressDelta === 'number' ? body.progressDelta : 1
    achievement.progress = Math.min(achievement.total, achievement.progress + delta)
    achievement.unlocked = achievement.progress >= achievement.total
    saveDb(db)
    return { status: 200, data: achievement }
  }

  if (method === 'GET' && pathname === '/api-gateway/analytics/tasks') {
    return { status: 200, data: makeAnalytics(db) }
  }

  if (method === 'GET' && pathname === '/api-gateway/profile/me/family-members') {
    return { status: 200, data: buildFamilyMembers(db, currentUserId) }
  }

  const familyMembersById = pathMatches(pathname, /^\/api-gateway\/profile\/([^/]+)\/family-members$/)
  if (familyMembersById && method === 'GET') {
    return { status: 200, data: buildFamilyMembers(db, familyMembersById[1]) }
  }

  const profileById = pathMatches(pathname, /^\/api-gateway\/profile\/([^/]+)$/)
  if (profileById && method === 'GET') {
    const user = getUserById(db, profileById[1])
    if (!user) return { status: 404, data: { message: 'User not found' } }
    return {
      status: 200,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
        },
        profile: {
          name: user.name,
          lastName: user.lastName,
          avatar: user.avatar ?? '',
          role: user.role,
          age: user.age,
        },
        family: db.families.find(item => item.id === user.familyId),
      },
    }
  }

  if (profileById && method === 'PUT') {
    const user = getUserById(db, profileById[1])
    if (!user) return { status: 404, data: { message: 'User not found' } }

    if (typeof body?.name === 'string') user.name = body.name
    if (typeof body?.lastName === 'string') user.lastName = body.lastName
    if (typeof body?.avatar === 'string') user.avatar = body.avatar
    if (typeof body?.age === 'number') user.age = body.age

    saveDb(db)

    return {
      status: 200,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
        },
        profile: {
          name: user.name,
          lastName: user.lastName,
          avatar: user.avatar ?? '',
          role: user.role,
          age: user.age,
        },
        family: db.families.find(item => item.id === user.familyId),
      },
    }
  }

  const uploadAvatarPath = pathMatches(pathname, /^\/api-gateway\/profile\/([^/]+)\/avatar$/)
  if (uploadAvatarPath && method === 'POST') {
    const user = getUserById(db, uploadAvatarPath[1])
    if (user) {
      user.avatar = '🖼️'
      saveDb(db)
    }
    return { status: 200, data: {} }
  }

  if (method === 'GET' && pathname === '/api-gateway/user-service/subscription/me') {
    return { status: 200, data: db.subscriptionsByUserId[currentUserId] ?? Object.values(db.subscriptionsByUserId)[0] }
  }

  const subByUser = pathMatches(pathname, /^\/api-gateway\/user-service\/subscription\/([^/]+)$/)
  if (subByUser && method === 'GET') {
    return { status: 200, data: db.subscriptionsByUserId[subByUser[1]] ?? Object.values(db.subscriptionsByUserId)[0] }
  }

  if (method === 'POST' && pathname === '/api-gateway/user-service/subscription/change') {
    const current = db.subscriptionsByUserId[currentUserId] ?? Object.values(db.subscriptionsByUserId)[0]
    const tier = typeof body?.tier === 'string' ? body.tier : current.tier
    const next = {
      ...current,
      tier,
      pricePerMonth: tier.toLowerCase() === 'free' ? 0 : tier.toLowerCase() === 'basic' ? 4.99 : tier.toLowerCase() === 'premium' ? 9.99 : 14.99,
      autoRenew: typeof body?.autoRenew === 'boolean' ? body.autoRenew : current.autoRenew,
    }
    db.subscriptionsByUserId[currentUserId] = next
    saveDb(db)
    return { status: 200, data: next }
  }

  if (method === 'POST' && pathname === '/api-gateway/user-service/subscription/cancel') {
    const next = {
      ...db.subscriptionsByUserId[currentUserId],
      tier: 'Free',
      pricePerMonth: 0,
      autoRenew: false,
    }
    db.subscriptionsByUserId[currentUserId] = next
    saveDb(db)
    return { status: 200, data: next }
  }

  if (method === 'GET' && pathname === '/api-gateway/user-service/subscription/tiers') {
    return {
      status: 200,
      data: [
        { name: 'Free', displayName: 'Free', price: 0, maxChildren: 1, maxTasksPerDay: 5 },
        { name: 'Basic', displayName: 'Basic', price: 4.99, maxChildren: 3, maxTasksPerDay: 20 },
        { name: 'Premium', displayName: 'Premium', price: 9.99, maxChildren: 10, maxTasksPerDay: 100 },
      ],
    }
  }

  if (method === 'POST' && pathname === '/api-gateway/ai/chat') {
    const userMessage = String(body?.message ?? '')
    return {
      status: 200,
      data: {
        conversationId: makeId('ai-conv'),
        reply: buildAiReply(userMessage),
        followUpSuggestions: ['Сделай 3 задачи для младшего ребёнка', 'Предложи 5 наград до 300 очков', 'Собери план на неделю'],
        actions: [
          {
            type: 'CreateTasks',
            label: 'Создать задачи',
            description: 'Быстро добавить предложенные задачи',
            variant: 'primary',
            priority: 1,
            payload: {
              tasks: [
                { title: 'Протереть стол', difficulty: 1, rewardXp: 20 },
                { title: 'Собрать рюкзак на завтра', difficulty: 2, rewardXp: 30 },
              ],
            },
          },
        ],
        generatedAt: nowIso(),
      },
    }
  }

  if (method === 'POST' && pathname === '/api-gateway/ai/execute-action') {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Действие выполнено в демо-режиме',
      },
    }
  }

  if (method === 'POST' && pathname === '/api-gateway/ai/task-description') {
    const text = String(body?.taskDescription ?? 'Помочь по дому')
    return {
      status: 200,
      data: {
        description: `${text}.\n\nШаги: 1) подготовь всё необходимое; 2) выполни аккуратно; 3) сделай фото результата.`,
      },
    }
  }

  if (method === 'POST' && pathname === '/api-gateway/ai/task-suggestions') {
    return {
      status: 200,
      data: {
        suggestions: [
          {
            title: 'Утренняя рутина',
            description: 'Заправить кровать, умыться, собрать рюкзак',
            difficulty: 2,
            tags: ['morning', 'discipline'],
            category: 'Daily',
            impactSummary: 'Формирует самостоятельность',
          },
          {
            title: 'Помощь на кухне',
            description: 'Разложить приборы и убрать посуду после ужина',
            difficulty: 2,
            tags: ['home', 'care'],
            category: 'Home',
            impactSummary: 'Развивает ответственность',
          },
        ],
        strategySummary: 'Чередуйте бытовые и учебные задачи.',
        tips: ['Давайте короткие и понятные инструкции', 'Добавляйте маленькие награды сразу после выполнения'],
      },
    }
  }

  if (method === 'POST' && pathname === '/api-gateway/ai/reward-suggestions') {
    return {
      status: 200,
      data: {
        suggestions: [
          { title: 'Доп. 30 минут игры', description: 'Выбор любимой игры', cost: 220, icon: '🎮' },
          { title: 'Семейный десерт', description: 'Выбор десерта на вечер', cost: 180, icon: '🍰' },
        ],
      },
    }
  }

  if (pathname.startsWith('/api-gateway/auth/')) {
    return { status: 200, data: {} }
  }

  return null
}

export const isDemoModeEnabled = () => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return false

  if (typeof window === 'undefined') {
    return process.env.NODE_ENV !== 'production'
  }

  const stored = window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)
  if (stored === '1' || stored === 'true') return true
  if (stored === '0' || stored === 'false') return false

  return true
}

export const resolveDemoRequest = (input: DemoRequestInput): DemoResponse | null => {
  if (!isDemoModeEnabled()) return null
  return resolveDemo(input)
}

export const createDemoAxiosAdapter = (mock: DemoResponse) => {
  return async (config: any) => ({
    data: mock.data,
    status: mock.status,
    statusText: mock.status >= 400 ? 'ERROR' : 'OK',
    headers: {},
    config,
    request: {},
  })
}
