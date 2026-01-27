import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

/**
 * Хук для оптимизированной навигации без блокировки UI
 */
export function useOptimizedNavigation() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (path: string) => {
    startTransition(() => {
      router.push(path)
    })
  }

  return {
    navigate,
    isPending,
    router
  }
}
