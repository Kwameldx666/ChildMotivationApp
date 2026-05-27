import { httpClient } from './api/http-client'

export interface FamilyMessageDto {
  id: string
  familyId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  createdAt: string
  isRead: boolean
  mentionedTaskId?: string | null
  mentionedTaskTitle?: string | null
  replyToMessageId?: string | null
}

export interface SendMessageRequest {
  content: string
  mentionedTaskId?: string | null
  replyToMessageId?: string | null
  senderId?: string
  senderName?: string
  senderAvatar?: string
}

const MOCK_CHAT_STORAGE_KEY = 'familyquest:mock-chat:v1'

type MockChatStore = Record<string, FamilyMessageDto[]>

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const loadMockStore = (): MockChatStore => {
  if (!canUseStorage()) return {}

  try {
    const raw = window.localStorage.getItem(MOCK_CHAT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MockChatStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const saveMockStore = (store: MockChatStore) => {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(MOCK_CHAT_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore storage errors in demo mode
  }
}

// ─── Demo data: pre-seeded chat conversations for FamilyQuest demo accounts ───
// Family chat ID  = parent's user GUID (e.g. "a1000000-0000-0000-0000-000000000001")
// Private chat ID = buildPrivateChatId(parentId, childId):
//   normalize both IDs (strip dashes, lowercase), sort, concatenate

const normalizeGuid = (id: string) => id.replace(/-/g, '').toLowerCase()

type DemoFamilyConfig = {
  key: string
  parentId: string
  parentName: string
  parentAvatar: string
  children: Array<{ id: string; name: string; avatar: string }>
}

const DEMO_FAMILIES: DemoFamilyConfig[] = [
  {
    key: 'F1',
    parentId: 'a1000000-0000-0000-0000-000000000001',
    parentName: 'Алексей',
    parentAvatar: '😊',
    children: [
      { id: 'a1000000-0000-0000-0000-000000000002', name: 'Никита', avatar: '🤖' },
      { id: 'a1000000-0000-0000-0000-000000000003', name: 'Маша', avatar: '🦊' },
    ],
  },
  {
    key: 'F2',
    parentId: 'a2000000-0000-0000-0000-000000000001',
    parentName: 'Ольга',
    parentAvatar: '👩',
    children: [
      { id: 'a2000000-0000-0000-0000-000000000002', name: 'Максим', avatar: '🚀' },
      { id: 'a2000000-0000-0000-0000-000000000003', name: 'Соня', avatar: '🦋' },
    ],
  },
  {
    key: 'F3',
    parentId: 'a3000000-0000-0000-0000-000000000001',
    parentName: 'Дмитрий',
    parentAvatar: '👨‍💼',
    children: [
      { id: 'a3000000-0000-0000-0000-000000000002', name: 'Артём', avatar: '⚡' },
      { id: 'a3000000-0000-0000-0000-000000000003', name: 'Лиза', avatar: '🌺' },
    ],
  },
]

/** Build the private chat ID the same way buildPrivateChatId does */
const buildPrivateChatIdLocal = (idA: string, idB: string): string => {
  const a = normalizeGuid(idA)
  const b = normalizeGuid(idB)
  return a <= b ? `${a}${b}` : `${b}${a}`
}

const makeMsg = (
  id: string,
  familyId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  content: string,
  minutesAgo: number,
): FamilyMessageDto => ({
  id,
  familyId,
  senderId,
  senderName,
  senderAvatar,
  content,
  createdAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  isRead: true,
  mentionedTaskId: null,
})

const buildFamilyChatSeed = (family: DemoFamilyConfig, chatId: string): FamilyMessageDto[] => {
  const { parentId, parentName, parentAvatar, children, key } = family
  if (children.length < 2) return []
  const [c1, c2] = children
  const subj1 = key === 'F1' ? 'математику' : key === 'F2' ? 'физику' : 'физкультуру'
  const deadline = key === 'F1' ? 'доклад по истории' : key === 'F2' ? 'проект по биологии' : 'презентацию'

  return [
    makeMsg(`fchat-${key}-1`, chatId, parentId, parentName, parentAvatar,
      'Привет, семья! 👋 Не забудьте про задачи на сегодня!', 180),
    makeMsg(`fchat-${key}-2`, chatId, c1.id, c1.name, c1.avatar,
      `Уже сделал ${subj1}! 💪`, 170),
    makeMsg(`fchat-${key}-3`, chatId, c2.id, c2.name, c2.avatar,
      'А я полила цветы! 🌸', 165),
    makeMsg(`fchat-${key}-4`, chatId, parentId, parentName, parentAvatar,
      'Молодцы! Вечером будет сюрприз 🎁', 160),
    makeMsg(`fchat-${key}-5`, chatId, c1.id, c1.name, c1.avatar,
      'Ура! Что за сюрприз? 🎉', 155),
    makeMsg(`fchat-${key}-6`, chatId, c2.id, c2.name, c2.avatar,
      'Мороженое? 🍦', 150),
    makeMsg(`fchat-${key}-7`, chatId, parentId, parentName, parentAvatar,
      'Сначала все задачи сделайте 😄', 120),
    makeMsg(`fchat-${key}-8`, chatId, c1.id, c1.name, c1.avatar,
      'Понял, иду делать уроки! 📚', 115),
    makeMsg(`fchat-${key}-9`, chatId, c2.id, c2.name, c2.avatar,
      'Я тоже! Сделаем вместе? 🤝', 110),
    makeMsg(`fchat-${key}-10`, chatId, c1.id, c1.name, c1.avatar,
      'Давай! Через 10 минут начинаем', 100),
    makeMsg(`fchat-${key}-11`, chatId, parentId, parentName, parentAvatar,
      'Вот это командная работа! ❤️', 90),
    makeMsg(`fchat-${key}-12`, chatId, c2.id, c2.name, c2.avatar,
      `${c1.name}, ты уже готов?`, 60),
    makeMsg(`fchat-${key}-13`, chatId, c1.id, c1.name, c1.avatar,
      'Да, иду! Почти всё сделал ✅', 55),
    makeMsg(`fchat-${key}-14`, chatId, parentId, parentName, parentAvatar,
      `Не забудьте про «${deadline}» до завтра!`, 30),
    makeMsg(`fchat-${key}-15`, chatId, c1.id, c1.name, c1.avatar,
      'Уже читаю материалы 📖', 20),
    makeMsg(`fchat-${key}-16`, chatId, c2.id, c2.name, c2.avatar,
      'Помочь? 😊', 15),
    makeMsg(`fchat-${key}-17`, chatId, c1.id, c1.name, c1.avatar,
      'Спасибо! Позову если что 🙌', 10),
    makeMsg(`fchat-${key}-18`, chatId, parentId, parentName, parentAvatar,
      'Горжусь вами! Ужин через час 🍽️', 5),
  ]
}

const buildPrivateChatSeed = (
  family: DemoFamilyConfig,
  child: DemoFamilyConfig['children'][0],
  chatId: string,
): FamilyMessageDto[] => {
  const { parentId, parentName, parentAvatar, key } = family
  const isBoy = child.name === 'Никита' || child.name === 'Максим' || child.name === 'Артём'
  const task = isBoy ? 'Подготовить доклад' : 'Нарисовать открытку'

  return [
    makeMsg(`priv-${key}-${child.id}-1`, chatId, parentId, parentName, parentAvatar,
      `${child.name}, как дела? Как прошёл день? 😊`, 240),
    makeMsg(`priv-${key}-${child.id}-2`, chatId, child.id, child.name, child.avatar,
      `Всё хорошо! Математика была сложная, но справился ${isBoy ? '💪' : '🌸'}`, 235),
    makeMsg(`priv-${key}-${child.id}-3`, chatId, parentId, parentName, parentAvatar,
      'Молодец! Ты всегда справляешься ❤️', 230),
    makeMsg(`priv-${key}-${child.id}-4`, chatId, child.id, child.name, child.avatar,
      'У меня вопрос по заданию', 120),
    makeMsg(`priv-${key}-${child.id}-5`, chatId, parentId, parentName, parentAvatar,
      'Конечно, спрашивай!', 118),
    makeMsg(`priv-${key}-${child.id}-6`, chatId, child.id, child.name, child.avatar,
      'Не понимаю формулу скорости в физике 🤔', 115),
    makeMsg(`priv-${key}-${child.id}-7`, chatId, parentId, parentName, parentAvatar,
      'v = s/t, скорость = путь / время. Давай разберём вместе вечером?', 110),
    makeMsg(`priv-${key}-${child.id}-8`, chatId, child.id, child.name, child.avatar,
      'Да, буду ждать! Спасибо 🙏', 100),
    makeMsg(`priv-${key}-${child.id}-9`, chatId, parentId, parentName, parentAvatar,
      `Не забудь про задачу «${task}» 📋`, 45),
    makeMsg(`priv-${key}-${child.id}-10`, chatId, child.id, child.name, child.avatar,
      'Помню, уже начал! ✅', 40),
    makeMsg(`priv-${key}-${child.id}-11`, chatId, parentId, parentName, parentAvatar,
      'Отлично! После выполнения получишь бонусные звёзды ⭐', 30),
    makeMsg(`priv-${key}-${child.id}-12`, chatId, child.id, child.name, child.avatar,
      'Класс! Постараюсь сделать лучше всех 🎯', 25),
    makeMsg(`priv-${key}-${child.id}-13`, chatId, parentId, parentName, parentAvatar,
      'Я в тебя верю! 💪❤️', 20),
    makeMsg(`priv-${key}-${child.id}-14`, chatId, child.id, child.name, child.avatar,
      'Готово! Сдаю на проверку 🚀', 10),
    makeMsg(`priv-${key}-${child.id}-15`, chatId, parentId, parentName, parentAvatar,
      'Вижу, проверю сейчас! Ты молодец 🏆', 5),
  ]
}

const getInitialMockMessages = (chatId: string): FamilyMessageDto[] => {
  for (const family of DEMO_FAMILIES) {
    // Check if this is a family group chat (chatId = parentId)
    if (
      chatId.toLowerCase() === family.parentId.toLowerCase() ||
      normalizeGuid(chatId) === normalizeGuid(family.parentId)
    ) {
      return buildFamilyChatSeed(family, chatId)
    }

    // Check if this is a private chat between parent and a child
    for (const child of family.children) {
      const expectedPrivateId = buildPrivateChatIdLocal(family.parentId, child.id)
      if (chatId.toLowerCase() === expectedPrivateId.toLowerCase()) {
        return buildPrivateChatSeed(family, child, chatId)
      }
    }
  }
  return []
}

const getMockMessages = (chatId: string): FamilyMessageDto[] => {
  const store = loadMockStore()
  if (store[chatId] && store[chatId].length > 0) return store[chatId]

  // Seed initial messages for known demo chat IDs on first access
  const seedMessages = getInitialMockMessages(chatId)
  if (seedMessages.length > 0) {
    store[chatId] = seedMessages
    saveMockStore(store)
    return seedMessages
  }

  return store[chatId] ?? []
}

const addMockMessage = (chatId: string, request: SendMessageRequest): FamilyMessageDto => {
  const store = loadMockStore()
  const existing = store[chatId] ?? []
  const nowIso = new Date().toISOString()

  const message: FamilyMessageDto = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    familyId: chatId,
    senderId: request.senderId ?? 'current-user',
    senderName: request.senderName ?? 'You',
    senderAvatar: request.senderAvatar ?? '',
    content: request.content,
    createdAt: nowIso,
    isRead: true,
    mentionedTaskId: request.mentionedTaskId ?? null,
    replyToMessageId: request.replyToMessageId ?? null,
  }

  store[chatId] = [...existing, message]
  saveMockStore(store)

  return message
}

export const familyChatService = {
  async getMessages(familyId: string, limit: number = 50, before?: Date) {
    let url = `/api-gateway/family-chat/${familyId}?limit=${limit}`
    if (before) {
      url += `&before=${before.toISOString()}`
    }

    try {
      const result = await httpClient.get<FamilyMessageDto[]>(url)

      // When the API returns an empty conversation for a known demo family,
      // fall back to seed messages so the UI never looks empty on a first demo.
      if (Array.isArray(result) && result.length === 0) {
        const seed = getInitialMockMessages(familyId)
        if (seed.length > 0) {
          let messages = seed
          if (before) {
            messages = messages.filter(m => new Date(m.createdAt) < before)
          }
          return messages.slice(-limit)
        }
      }

      return result
    } catch {
      let messages = getMockMessages(familyId)
      if (before) {
        messages = messages.filter(message => new Date(message.createdAt) < before)
      }
      return messages.slice(-limit)
    }
  },

  async sendMessage(familyId: string, request: SendMessageRequest) {
    const apiRequest = {
      content: request.content,
      mentionedTaskId: request.mentionedTaskId,
      replyToMessageId: request.replyToMessageId,
    }

    try {
      return await httpClient.post<FamilyMessageDto>(`/api-gateway/family-chat/${familyId}/messages`, apiRequest)
    } catch {
      return addMockMessage(familyId, request)
    }
  },
}
