import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach } from 'vitest'

const clients: QueryClient[] = []
afterEach(() => { clients.splice(0).forEach(client => client.clear()) })
export function queryWrapper(client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity, staleTime: 10_000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  } }), searchParams = '') {
  clients.push(client)
  function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  }
  return { client, wrapper: Wrapper }
}
