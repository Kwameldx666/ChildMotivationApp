import { useQuery } from '@tanstack/react-query'
import { familyService, type FamilyMember } from './family-service'

interface UseFamilyMembersOptions {
  userId?: string
  enabled?: boolean
}

export function useFamilyMembers(options: UseFamilyMembersOptions = {}) {
  const { userId, enabled = true } = options

  return useQuery<FamilyMember[]>({
    queryKey: ['family-members', userId ?? 'me'],
    queryFn: () => familyService.getMembers(userId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
