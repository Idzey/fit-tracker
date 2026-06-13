import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from './query-keys'
import { workoutKeys } from '@/features/workouts/hooks/query-keys'

export function useSse() {
  const qc = useQueryClient()

  useEffect(() => {
    // Trainer dashboard live updates via polling invalidation
    // True SSE requires native EventSource (not available in RN without a module)
    // We use aggressive refetch as the realtime strategy
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() })
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
    }, 15_000)

    return () => clearInterval(interval)
  }, [qc])
}
