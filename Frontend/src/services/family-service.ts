import { httpClient } from '@/services/api/http-client'
import { appStore } from '@/store/appStore'

export interface FamilyMember {
  id: string
  role: string
  name: string
  lastName?: string | null
  avatar?: string | null
  age?: number | null
}

const resolveFamilyMembersPath = (userId?: string) =>
  userId ? `/api-gateway/profile/${userId}/family-members` : '/api-gateway/profile/me/family-members'

// ─── Demo family member fallbacks ─────────────────────────────────────────
// Keyed by parent GUID (lowercase). Used when the UserService is unreachable
// so analytics and chat still show correct names/avatars for demo accounts.
const DEMO_FAMILY_MEMBERS: Record<string, FamilyMember[]> = {
  // Семья 1 — Ивановы (demo@familyquest.app)
  'a1000000-0000-0000-0000-000000000001': [
    { id: 'a1000000-0000-0000-0000-000000000001', role: 'parent', name: 'Алексей', lastName: 'Иванов', avatar: '😊' },
    { id: 'a1000000-0000-0000-0000-000000000002', role: 'child',  name: 'Никита',  lastName: 'Иванов', avatar: '🤖', age: 10 },
    { id: 'a1000000-0000-0000-0000-000000000003', role: 'child',  name: 'Маша',    lastName: 'Иванова', avatar: '🦊', age: 8 },
  ],
  // Семья 2 — Петровы (demo2@familyquest.app)
  'a2000000-0000-0000-0000-000000000001': [
    { id: 'a2000000-0000-0000-0000-000000000001', role: 'parent', name: 'Ольга',   lastName: 'Петрова', avatar: '👩' },
    { id: 'a2000000-0000-0000-0000-000000000002', role: 'child',  name: 'Максим',  lastName: 'Петров', avatar: '🚀', age: 11 },
    { id: 'a2000000-0000-0000-0000-000000000003', role: 'child',  name: 'Соня',    lastName: 'Петрова', avatar: '🦋', age: 9 },
  ],
  // Семья 3 — Сидоровы (demo3@familyquest.app)
  'a3000000-0000-0000-0000-000000000001': [
    { id: 'a3000000-0000-0000-0000-000000000001', role: 'parent', name: 'Дмитрий', lastName: 'Сидоров', avatar: '👨‍💼' },
    { id: 'a3000000-0000-0000-0000-000000000002', role: 'child',  name: 'Артём',   lastName: 'Сидоров', avatar: '⚡', age: 12 },
    { id: 'a3000000-0000-0000-0000-000000000003', role: 'child',  name: 'Лиза',    lastName: 'Сидорова', avatar: '🌺', age: 7 },
  ],
}

// Child-to-parent lookup for child accounts calling /me/family-members
const CHILD_TO_FAMILY: Record<string, string> = {
  'a1000000-0000-0000-0000-000000000002': 'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000003': 'a1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000002': 'a2000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000003': 'a2000000-0000-0000-0000-000000000001',
  'a3000000-0000-0000-0000-000000000002': 'a3000000-0000-0000-0000-000000000001',
  'a3000000-0000-0000-0000-000000000003': 'a3000000-0000-0000-0000-000000000001',
}

function getMockFamilyMembers(userId?: string): FamilyMember[] {
  // If no userId provided, try to get it from the current session
  const effectiveId = userId ?? appStore.getState().auth.session?.user?.id
  if (!effectiveId) return []
  const normalized = effectiveId.trim().toLowerCase()

  // Direct parent lookup
  if (DEMO_FAMILY_MEMBERS[normalized]) return DEMO_FAMILY_MEMBERS[normalized]

  // Child lookup: find their parent's family
  const parentId = CHILD_TO_FAMILY[normalized]
  if (parentId) return DEMO_FAMILY_MEMBERS[parentId] ?? []

  return []
}

export const familyService = {
  async getMembers(userId?: string): Promise<FamilyMember[]> {
    try {
      const result = await httpClient.get<FamilyMember[]>(resolveFamilyMembersPath(userId))
      if (Array.isArray(result) && result.length > 0) return result
      // API returned empty — fall back to hardcoded demo data
      return getMockFamilyMembers(userId)
    } catch {
      return getMockFamilyMembers(userId)
    }
  },
}
