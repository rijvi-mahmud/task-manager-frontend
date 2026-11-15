/** Shared application policy; feature-specific settings stay in their feature. */
export const appConfig = {
  api: {
    version: 'v1',
    requestTimeoutMs: 30_000,
  },
  queries: {
    staleTimeMs: 10_000,
    refetchIntervalMs: 15_000,
  },
} as const
