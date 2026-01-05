import { httpClient } from '@/services/api/http-client'

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

export const familyService = {
  getMembers(userId?: string) {
    return httpClient.get<FamilyMember[]>(resolveFamilyMembersPath(userId))
  },
}
