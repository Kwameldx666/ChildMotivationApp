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
  startedByChild?: boolean
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

const deriveStartedByChild = (task: DemoTask) => {
  if (typeof task.startedByChild === 'boolean') {
    return task.startedByChild
  }
  return task.pendingApproval || task.completed || !!task.completedAt
}

const isValidDemoDb = (value: unknown): value is DemoDb => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DemoDb>
  return Array.isArray(candidate.users)
    && Array.isArray(candidate.families)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.products)
    && Array.isArray(candidate.orders)
    && Array.isArray(candidate.notifications)
    && Array.isArray(candidate.missions)
    && Array.isArray(candidate.achievements)
    && !!candidate.subscriptionsByUserId
    && typeof candidate.subscriptionsByUserId === 'object'
}

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
  const parentTwoId = 'demo-parent-2'
  const childOneId = 'demo-child-1'
  const childTwoId = 'demo-child-2'
  const childThreeId = 'demo-child-3'
  const childFourId = 'demo-child-4'
  const createdAt = nowIso()
  const dayMs = 24 * 60 * 60 * 1000
  const shiftDays = (days: number) => new Date(Date.now() + days * dayMs).toISOString()

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
      id: parentTwoId,
      email: 'dad@demo.local',
      password: 'demo123',
      name: 'Артём',
      lastName: 'Иванов',
      role: 'parent',
      avatar: '👨',
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
    {
      id: childThreeId,
      email: 'liza@demo.local',
      password: 'demo123',
      name: 'Лиза',
      lastName: 'Иванова',
      role: 'child',
      age: 10,
      avatar: '👧',
      familyId,
    },
    {
      id: childFourId,
      email: 'dima@demo.local',
      password: 'demo123',
      name: 'Дима',
      lastName: 'Иванов',
      role: 'child',
      age: 14,
      avatar: '🧑',
      familyId,
    },
  ]

  const families: DemoFamily[] = [
    {
      id: familyId,
      code: 'DEMO123',
      name: 'Семья Ивановых',
      emblem: '✨',
      parentIds: [parentId, parentTwoId],
      childIds: [childOneId, childTwoId, childThreeId, childFourId],
    },
  ]

  const tasks: DemoTask[] = [
    {
      id: 'demo-task-1',
      title: 'Убрать игрушки',
      description: 'Собрать игрушки в коробку и протереть стол',
      completed: false,
      pendingApproval: false,
      startedByChild: false,
      createdAt: shiftDays(-2),
      createdByUserId: parentId,
      difficulty: 2,
      reward: 100,
      rewardPoints: 5,
      evidence: { requirement: 'photo', isSubmitted: false },
      assignedToUserId: childOneId,
      dueDate: shiftDays(1),
    },
    {
      id: 'demo-task-2',
      title: 'Прочитать 10 страниц',
      description: 'Любая книга на выбор, затем краткий пересказ',
      completed: true,
      pendingApproval: false,
      startedByChild: true,
      createdAt: shiftDays(-5),
      completedAt: shiftDays(-4),
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
      startedByChild: true,
      createdAt: shiftDays(-1),
      createdByUserId: parentId,
      difficulty: 1,
      reward: 80,
      rewardPoints: 2,
      evidence: {
        requirement: 'photo',
        isSubmitted: true,
        uploadedAt: shiftDays(-1),
        uploadedByUserId: childOneId,
        fileName: 'table.jpg',
        contentType: 'image/jpeg',
        fileSize: 183_000,
      },
      assignedToUserId: childOneId,
    },
    {
      id: 'demo-task-4',
      title: 'Сделать математику',
      description: 'Решить 2 упражнения и проверить ответы',
      completed: false,
      pendingApproval: false,
      startedByChild: false,
      createdAt: shiftDays(-3),
      createdByUserId: parentTwoId,
      difficulty: 2,
      reward: 120,
      rewardPoints: 6,
      evidence: { requirement: 'document', isSubmitted: false },
      assignedToUserId: childThreeId,
      dueDate: shiftDays(2),
    },
    {
      id: 'demo-task-5',
      title: 'Прогулка с собакой',
      description: 'Погулять минимум 25 минут',
      completed: true,
      pendingApproval: false,
      startedByChild: true,
      createdAt: shiftDays(-6),
      completedAt: shiftDays(-6),
      createdByUserId: parentTwoId,
      difficulty: 2,
      reward: 110,
      rewardPoints: 5,
      evidence: { requirement: 'photo', isSubmitted: true, uploadedAt: shiftDays(-6), uploadedByUserId: childFourId },
      assignedToUserId: childFourId,
    },
    {
      id: 'demo-task-6',
      title: 'Полить цветы',
      description: 'Полить все растения в гостиной и на кухне',
      completed: false,
      pendingApproval: false,
      startedByChild: true,
      createdAt: shiftDays(-1),
      createdByUserId: parentId,
      difficulty: 1,
      reward: 70,
      rewardPoints: 3,
      evidence: { requirement: 'none', isSubmitted: false },
      assignedToUserId: childThreeId,
      dueDate: shiftDays(1),
    },
    {
      id: 'demo-task-7',
      title: 'Подготовить рюкзак',
      description: 'Проверить тетради, пенал и форму на завтра',
      completed: true,
      pendingApproval: false,
      startedByChild: true,
      createdAt: shiftDays(-2),
      completedAt: shiftDays(-2),
      createdByUserId: parentId,
      difficulty: 1,
      reward: 60,
      rewardPoints: 2,
      evidence: { requirement: 'photo', isSubmitted: true, uploadedAt: shiftDays(-2), uploadedByUserId: childOneId },
      assignedToUserId: childOneId,
    },
    {
      id: 'demo-task-8',
      title: 'Разобрать полку с книгами',
      description: 'Отсортировать книги по предметам',
      completed: false,
      pendingApproval: false,
      startedByChild: false,
      createdAt: shiftDays(-7),
      createdByUserId: parentTwoId,
      difficulty: 3,
      reward: 180,
      rewardPoints: 12,
      evidence: { requirement: 'photo', isSubmitted: false },
      assignedToUserId: childTwoId,
      dueDate: shiftDays(-1),
    },
    {
      id: 'demo-task-9',
      title: 'Сделать зарядку',
      description: '15 минут утренней зарядки',
      completed: false,
      pendingApproval: true,
      startedByChild: true,
      createdAt: shiftDays(0),
      createdByUserId: parentId,
      difficulty: 1,
      reward: 90,
      rewardPoints: 4,
      evidence: {
        requirement: 'video',
        isSubmitted: true,
        uploadedAt: shiftDays(0),
        uploadedByUserId: childFourId,
        fileName: 'workout.mp4',
        contentType: 'video/mp4',
        fileSize: 2_120_000,
      },
      assignedToUserId: childFourId,
    },
    {
      id: 'demo-task-10',
      title: 'Повторить английские слова',
      description: 'Выучить 15 новых слов и пройти мини-тест',
      completed: false,
      pendingApproval: false,
      startedByChild: false,
      createdAt: shiftDays(-4),
      createdByUserId: parentTwoId,
      difficulty: 2,
      reward: 130,
      rewardPoints: 7,
      evidence: { requirement: 'document', isSubmitted: false },
      assignedToUserId: childTwoId,
      dueDate: shiftDays(3),
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
    {
      id: 'demo-product-3',
      name: 'Новый набор LEGO',
      description: 'Конструктор на выбор до 2000₽',
      price: 1200,
      stock: 2,
      isActive: true,
      createdAt: shiftDays(-8),
      category: 'Toys',
    },
    {
      id: 'demo-product-4',
      name: 'Выходной без домашних дел',
      description: 'Один день без бытовых задач',
      price: 800,
      stock: 4,
      isActive: true,
      createdAt: shiftDays(-12),
      category: 'Privileges',
    },
    {
      id: 'demo-product-5',
      name: 'Настольная игра',
      description: 'Совместная игра всей семьёй вечером',
      price: 650,
      stock: 2,
      isActive: true,
      createdAt: shiftDays(-10),
      category: 'Leisure',
    },
    {
      id: 'demo-product-6',
      name: 'Смузи на выбор',
      description: 'Любимый смузи после школы',
      price: 180,
      stock: 12,
      isActive: true,
      createdAt: shiftDays(-2),
      category: 'Food',
    },
    {
      id: 'demo-product-7',
      name: '30 минут видеоигр',
      description: 'Дополнительное игровое время',
      price: 260,
      stock: 15,
      isActive: true,
      createdAt: shiftDays(-3),
      category: 'Privileges',
    },
    {
      id: 'demo-product-8',
      name: 'Семейный пикник',
      description: 'Пикник в парке на выходных',
      price: 950,
      stock: 1,
      isActive: true,
      createdAt: shiftDays(-15),
      category: 'Leisure',
    },
  ]

  const orders: DemoOrder[] = [
    {
      id: 'demo-order-1',
      userId: childOneId,
      createdAt: shiftDays(-3),
      status: 'AwaitingDelivery',
      totalAmount: 350,
      items: [
        {
          id: 'demo-order-item-1',
          orderId: 'demo-order-1',
          productId: 'demo-product-1',
          productName: 'Поход в кино',
          unitPrice: 350,
          quantity: 1,
          lineTotal: 350,
        },
      ],
    },
    {
      id: 'demo-order-2',
      userId: childTwoId,
      createdAt: shiftDays(-6),
      status: 'Delivered',
      totalAmount: 940,
      items: [
        {
          id: 'demo-order-item-2',
          orderId: 'demo-order-2',
          productId: 'demo-product-6',
          productName: 'Смузи на выбор',
          unitPrice: 180,
          quantity: 1,
          lineTotal: 180,
        },
        {
          id: 'demo-order-item-3',
          orderId: 'demo-order-2',
          productId: 'demo-product-7',
          productName: '30 минут видеоигр',
          unitPrice: 260,
          quantity: 1,
          lineTotal: 260,
        },
        {
          id: 'demo-order-item-4',
          orderId: 'demo-order-2',
          productId: 'demo-product-2',
          productName: 'Пицца вечер',
          unitPrice: 500,
          quantity: 1,
          lineTotal: 500,
        },
      ],
      deliveredAt: shiftDays(-5),
      deliveredByUserId: parentId,
      deliveryNotes: 'Передано после уроков.',
    },
    {
      id: 'demo-order-3',
      userId: childThreeId,
      createdAt: shiftDays(-9),
      status: 'Completed',
      totalAmount: 650,
      items: [
        {
          id: 'demo-order-item-5',
          orderId: 'demo-order-3',
          productId: 'demo-product-5',
          productName: 'Настольная игра',
          unitPrice: 650,
          quantity: 1,
          lineTotal: 650,
        },
      ],
      deliveredAt: shiftDays(-8),
      deliveredByUserId: parentTwoId,
      confirmedAt: shiftDays(-8),
      confirmedByUserId: childThreeId,
    },
    {
      id: 'demo-order-4',
      userId: childFourId,
      createdAt: shiftDays(-1),
      status: 'PendingApproval',
      totalAmount: 1200,
      items: [
        {
          id: 'demo-order-item-6',
          orderId: 'demo-order-4',
          productId: 'demo-product-3',
          productName: 'Новый набор LEGO',
          unitPrice: 1200,
          quantity: 1,
          lineTotal: 1200,
        },
      ],
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
      createdAt: shiftDays(0),
    },
    {
      id: 'demo-notification-2',
      userId: childOneId,
      type: 'reward_purchased',
      title: 'Награда куплена',
      message: 'Вы купили «Поход в кино» за 350 очков',
      isRead: false,
      createdAt: shiftDays(-3),
    },
    {
      id: 'demo-notification-3',
      userId: parentTwoId,
      type: 'order_pending',
      title: 'Новый запрос на награду',
      message: 'Дима запросил «Новый набор LEGO».',
      isRead: false,
      createdAt: shiftDays(-1),
    },
    {
      id: 'demo-notification-4',
      userId: childTwoId,
      type: 'task_assigned',
      title: 'Новая задача',
      message: 'Вам назначена задача «Повторить английские слова».',
      isRead: true,
      createdAt: shiftDays(-4),
    },
    {
      id: 'demo-notification-5',
      userId: childThreeId,
      type: 'achievement_unlocked',
      title: 'Достижение почти открыто',
      message: 'Осталась 1 задача до достижения «Юный помощник».',
      isRead: false,
      createdAt: shiftDays(-2),
    },
    {
      id: 'demo-notification-6',
      userId: childFourId,
      type: 'task_approval',
      title: 'Ожидается проверка',
      message: 'Видео по зарядке отправлено на проверку.',
      isRead: false,
      createdAt: shiftDays(0),
    },
    {
      id: 'demo-notification-7',
      userId: parentId,
      type: 'mission_completed',
      title: 'Недельная миссия закрыта',
      message: 'Лиза завершила миссию «7 дней без пропусков».',
      isRead: true,
      createdAt: shiftDays(-7),
    },
    {
      id: 'demo-notification-8',
      userId: childOneId,
      type: 'points_added',
      title: '+60 очков',
      message: 'Награда начислена за задачу «Подготовить рюкзак».',
      isRead: true,
      createdAt: shiftDays(-2),
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
    {
      id: 'demo-mission-3',
      title: '7 дней без пропусков',
      description: 'Каждый день закрывать минимум 1 задачу',
      icon: '🔥',
      recurrence: 'weekly',
      progress: 7,
      total: 7,
      rewardXp: 240,
      completed: true,
    },
    {
      id: 'demo-mission-4',
      title: '2 добрых поступка',
      description: 'Помочь кому-то в семье 2 раза',
      icon: '💛',
      recurrence: 'daily',
      progress: 1,
      total: 2,
      rewardXp: 60,
      completed: false,
    },
    {
      id: 'demo-mission-5',
      title: 'Неделя чтения',
      description: 'Читать минимум 15 минут каждый день',
      icon: '📚',
      recurrence: 'weekly',
      progress: 5,
      total: 7,
      rewardXp: 180,
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
    {
      id: 'demo-achievement-3',
      title: 'Мастер фото-отчётов',
      description: 'Загрузить 20 подтверждений',
      icon: '📷',
      progress: 14,
      total: 20,
      unlocked: false,
      rewardXp: 150,
    },
    {
      id: 'demo-achievement-4',
      title: 'Командный игрок',
      description: '5 раз помочь брату/сестре с задачей',
      icon: '🤝',
      progress: 5,
      total: 5,
      unlocked: true,
      rewardXp: 180,
    },
    {
      id: 'demo-achievement-5',
      title: 'Звезда недели',
      description: 'Набрать 1000 очков за неделю',
      icon: '🌟',
      progress: 760,
      total: 1000,
      unlocked: false,
      rewardXp: 300,
    },
    {
      id: 'demo-achievement-6',
      title: 'Порядок в комнате',
      description: '10 раз выполнить задачи по дому',
      icon: '🧹',
      progress: 10,
      total: 10,
      unlocked: true,
      rewardXp: 130,
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
      [parentTwoId]: subscription,
      [childOneId]: subscription,
      [childTwoId]: subscription,
      [childThreeId]: subscription,
      [childFourId]: subscription,
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
    const parsed = JSON.parse(raw) as unknown
    if (!isValidDemoDb(parsed)) {
      const seeded = createSeedDb()
      window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsedDb = parsed as DemoDb
    const normalizedTasks = parsedDb.tasks.map(task => ({
      ...task,
      startedByChild: deriveStartedByChild(task),
    }))
    const normalizedDb: DemoDb = {
      ...parsedDb,
      tasks: normalizedTasks,
    }

    const hasTaskLifecyclePatch = parsedDb.tasks.some((task, index) => {
      return task.startedByChild !== normalizedTasks[index].startedByChild
    })

    if (hasTaskLifecyclePatch) {
      window.localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(normalizedDb))
    }

    return normalizedDb
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

const makeAnalytics = (db: DemoDb, windowDays: number = 30) => {
  const now = Date.now()
  const dayMs = 86_400_000
  const safeWindowDays = Number.isFinite(windowDays) ? Math.min(365, Math.max(7, Math.floor(windowDays))) : 30
  const cutoff = now - safeWindowDays * dayMs
  const children = db.users.filter(user => user.role === 'child')
  const palette = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#3b82f6']

  const scopedTasks = db.tasks.filter(task => new Date(task.createdAt).getTime() >= cutoff)
  const tasks = scopedTasks.length > 0 ? scopedTasks : db.tasks

  const toPeriodLabel = (date: Date) => date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })

  const buildBuckets = (source: DemoTask[]) => {
    const bucketSizeDays = safeWindowDays <= 14 ? 1 : 7
    const bucketCount = Math.max(1, Math.ceil(safeWindowDays / bucketSizeDays))
    return Array.from({ length: bucketCount }, (_, idx) => {
      const daysAgoStart = (bucketCount - 1 - idx) * bucketSizeDays
      const start = new Date(now - daysAgoStart * dayMs)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + bucketSizeDays)

      const completedInBucket = source.filter(task => {
        if (!task.completedAt) return false
        const ts = new Date(task.completedAt).getTime()
        return ts >= start.getTime() && ts < end.getTime()
      })

      const createdInBucket = source.filter(task => {
        const ts = new Date(task.createdAt).getTime()
        return ts >= start.getTime() && ts < end.getTime()
      })

      return {
        label: bucketSizeDays === 1
          ? toPeriodLabel(start)
          : `${toPeriodLabel(start)}–${toPeriodLabel(new Date(end.getTime() - 1))}`,
        completedInBucket,
        createdInBucket,
      }
    })
  }

  const buckets = buildBuckets(tasks)
  const completed = tasks.filter(task => task.completed).length
  const total = tasks.length
  const points = tasks.filter(task => task.completed).reduce((sum, task) => sum + (task.reward ?? 0), 0)

  const weeklyActivity = buckets.map(bucket => ({
    day: bucket.label,
    tasksCompleted: bucket.completedInBucket.length,
    pointsEarned: bucket.completedInBucket.reduce((sum, task) => sum + (task.reward ?? 0), 0),
  }))

  const childrenStats = children.map((child, index) => {
    const childTasks = tasks.filter(task => task.assignedToUserId === child.id)
    const childCompletedTasks = childTasks.filter(task => task.completed)
    return {
      childId: child.id,
      childName: child.name,
      totalPoints: childCompletedTasks.reduce((sum, task) => sum + (task.reward ?? 0), 0),
      completedTasks: childCompletedTasks.length,
      pendingTasks: childTasks.length - childCompletedTasks.length,
      color: palette[index % palette.length],
    }
  })

  const buildDifficultyDistribution = (source: DemoTask[]) => {
    let easy = 0
    let medium = 0
    let hard = 0
    for (const task of source) {
      const difficulty = task.difficulty ?? 2
      if (difficulty <= 2) easy += 1
      else if (difficulty === 3) medium += 1
      else hard += 1
    }
    return [
      { name: 'Легко', value: easy, color: '#84cc16' },
      { name: 'Средне', value: medium, color: '#eab308' },
      { name: 'Сложно', value: hard, color: '#f97316' },
    ]
  }

  const weeklyProgress = buckets.map((bucket, idx) => ({
    week: safeWindowDays <= 14 ? bucket.label : `W${idx + 1}`,
    completed: bucket.createdInBucket.filter(task => task.completed).length,
    total: bucket.createdInBucket.length,
  }))

  let runningPoints = 0
  const pointsTrend = buckets.map(bucket => {
    runningPoints += bucket.completedInBucket.reduce((sum, task) => sum + (task.reward ?? 0), 0)
    return {
      date: bucket.label,
      points: runningPoints,
    }
  })

  const perChildActivity = children.map(child => {
    const childTasks = tasks.filter(task => task.assignedToUserId === child.id)
    const childBuckets = buildBuckets(childTasks)
    return {
      childId: child.id,
      data: childBuckets.map(bucket => ({
        day: bucket.label,
        tasksCompleted: bucket.completedInBucket.length,
        pointsEarned: bucket.completedInBucket.reduce((sum, task) => sum + (task.reward ?? 0), 0),
      })),
    }
  })

  const perChildDifficulty = children.map(child => {
    const childTasks = tasks.filter(task => task.assignedToUserId === child.id)
    return {
      childId: child.id,
      data: buildDifficultyDistribution(childTasks),
    }
  })

  const perChildProgress = children.map(child => {
    const childTasks = tasks.filter(task => task.assignedToUserId === child.id)
    const childBuckets = buildBuckets(childTasks)
    return {
      childId: child.id,
      data: childBuckets.map((bucket, idx) => ({
        week: safeWindowDays <= 14 ? bucket.label : `W${idx + 1}`,
        completed: bucket.createdInBucket.filter(task => task.completed).length,
        total: bucket.createdInBucket.length,
      })),
    }
  })

  const perChildPointsTrend = children.map(child => {
    const childTasks = tasks.filter(task => task.assignedToUserId === child.id)
    const childBuckets = buildBuckets(childTasks)
    let childRunningPoints = 0
    return {
      childId: child.id,
      data: childBuckets.map(bucket => {
        childRunningPoints += bucket.completedInBucket.reduce((sum, task) => sum + (task.reward ?? 0), 0)
        return {
          date: bucket.label,
          points: childRunningPoints,
        }
      }),
    }
  })

  return {
    totalPoints: points,
    completedTasks: completed,
    totalTasks: total,
    activeChildren: children.length,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    weeklyActivity,
    childrenStats,
    difficultyDistribution: buildDifficultyDistribution(tasks),
    weeklyProgress,
    taskStatus: {
      completed,
      inProgress: tasks.filter(task => !task.completed && !task.pendingApproval && deriveStartedByChild(task)).length,
      overdue: tasks.filter(task => !task.completed && !!task.dueDate && new Date(task.dueDate).getTime() < now).length,
    },
    pointsTrend,
    perChildActivity,
    perChildDifficulty,
    perChildProgress,
    perChildPointsTrend,
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

const buildAiReply = (message: string, db: DemoDb, mode?: string) => {
  const normalizedMessage = message.toLowerCase()
  const shouldAnalyze = mode === 'analytics'
    || normalizedMessage.includes('analy')
    || normalizedMessage.includes('аналит')
    || normalizedMessage.includes('прогресс')

  if (shouldAnalyze) {
    const analytics = makeAnalytics(db, 30)
    const bestChild = [...analytics.childrenStats].sort((a, b) => b.totalPoints - a.totalPoints)[0]
    const slowChild = [...analytics.childrenStats].sort((a, b) => a.completedTasks - b.completedTasks)[0]

    return [
      'Короткий AI-разбор по семье:',
      `- Выполнено ${analytics.completedTasks} из ${analytics.totalTasks} задач (${analytics.completionRate}%).`,
      `- Набрано ${analytics.totalPoints} очков за текущий период.`,
      `- В работе: ${analytics.taskStatus.inProgress}, просрочено: ${analytics.taskStatus.overdue}.`,
      bestChild ? `- Лучший прогресс: ${bestChild.childName} (${bestChild.totalPoints} очков).` : '- Данных по детям пока недостаточно.',
      '',
      'Рекомендации:',
      '- Сначала закройте просроченные задачи с низкой сложностью (быстрые победы).',
      '- Для ребёнка с низким темпом добавьте 2 короткие задачи на 10-15 минут.',
      '- Введите бонус +10% очков за серию из 3 дней подряд.',
      slowChild ? `- Отдельно поддержите ${slowChild.childName}: уменьшите сложность и дайте понятный чек-лист.` : '- Разделите большие задачи на 2-3 простых шага.',
    ].join('\n')
  }

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
      startedByChild: false,
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
      startedByChild: typeof body?.completed === 'boolean'
        ? body.completed || deriveStartedByChild(current)
        : deriveStartedByChild(current),
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

  const completeTask = pathMatches(pathname, /^\/api-gateway\/tasks\/([^/]+)\/(start|complete|request-approval|approve|reject)$/)
  if (completeTask && method === 'POST') {
    const taskId = completeTask[1]
    const action = completeTask[2]
    const task = db.tasks.find(item => item.id === taskId)
    if (task) {
      if (action === 'start') {
        task.completed = false
        task.completedAt = null
        task.pendingApproval = false
        task.startedByChild = true
      }
      if (action === 'complete') {
        task.completed = true
        task.completedAt = nowIso()
        task.pendingApproval = false
        task.startedByChild = true
      }
      if (action === 'request-approval') {
        task.pendingApproval = true
        task.startedByChild = true
      }
      if (action === 'approve') {
        task.pendingApproval = false
        task.completed = true
        task.completedAt = nowIso()
        task.startedByChild = true
      }
      if (action === 'reject') {
        task.pendingApproval = false
        task.completed = false
        task.completedAt = null
        task.startedByChild = true
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
    task.startedByChild = true
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
    const windowDaysRaw = Number(query.get('windowDays'))
    const windowDays = Number.isFinite(windowDaysRaw) ? windowDaysRaw : 30
    return { status: 200, data: makeAnalytics(db, windowDays) }
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
    const current = db.subscriptionsByUserId[currentUserId] ?? Object.values(db.subscriptionsByUserId)[0]
    const next = {
      ...current,
      status: current.endDate && new Date(current.endDate) <= new Date() ? 'Expired' : 'Active',
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
    const context = body?.context && typeof body.context === 'object' ? body.context as Record<string, unknown> : undefined
    const mode = typeof context?.mode === 'string' ? context.mode : undefined
    return {
      status: 200,
      data: {
        conversationId: makeId('ai-conv'),
        reply: buildAiReply(userMessage, db, mode),
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
    return false
  }

  const stored = window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)
  if (stored === '1' || stored === 'true') return true
  if (stored === '0' || stored === 'false') return false

  return false
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
