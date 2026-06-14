import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '@/shared/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { notificationKeys } from './query-keys'
import { workoutKeys } from '@/features/workouts/hooks/query-keys'
import { clientKeys } from '@/features/clients/hooks/query-keys'
import { photoKeys } from '@/features/photos/hooks/query-keys'
import { sseClient } from '../sse-client'

export function useSse() {
  const qc = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const invalidateNotifications = () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() })
    }
    const invalidateWorkouts = () => {
      qc.invalidateQueries({ queryKey: workoutKeys.today() })
      qc.invalidateQueries({ queryKey: workoutKeys.progress() })
      qc.invalidateQueries({ queryKey: clientKeys.all })
    }
    const invalidatePhotos = () => {
      qc.invalidateQueries({ queryKey: photoKeys.all })
    }

    sseClient.on('notification', invalidateNotifications)
    sseClient.on('workout_completed', invalidateWorkouts)
    sseClient.on('photo_uploaded', invalidatePhotos)
    sseClient.connect(API_BASE_URL, accessToken)

    const fallback = setInterval(() => {
      invalidateNotifications()
      invalidateWorkouts()
    }, 30_000)

    return () => {
      clearInterval(fallback)
      sseClient.off('notification', invalidateNotifications)
      sseClient.off('workout_completed', invalidateWorkouts)
      sseClient.off('photo_uploaded', invalidatePhotos)
      sseClient.disconnect()
    }
  }, [accessToken]) // qc is stable — QueryClient never changes reference
}

