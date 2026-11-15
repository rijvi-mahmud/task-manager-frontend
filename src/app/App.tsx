import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useSession } from '../features/auth/hooks/useSession'
import { AppLoadError } from './AppLoadError'
import { AppLoadingSkeleton } from './AppLoadingSkeleton'
import { createAppRouter } from './router'

export default function App() {
  const queryClient = useQueryClient()
  const [router] = useState(() => createAppRouter(queryClient))
  // Finish the initial identity read before protected loaders start using private data.
  const session = useSession()
  const userId = session.data === undefined ? undefined : session.data?.id ?? null
  const previousUserId = useRef(userId)

  useEffect(() => {
    const previous = previousUserId.current
    previousUserId.current = userId
    // Initial resolution belongs to the first route load. Invalidating it would cancel that load.
    if (previous === undefined || userId === undefined || previous === userId) return
    router.clearCache()
    void router.invalidate()
  }, [router, userId])

  if (session.data === undefined) {
    if (session.isError) return <AppLoadError error={session.error} onRetry={() => { void session.refetch() }} />
    return <AppLoadingSkeleton />
  }
  return <RouterProvider router={router} />
}
