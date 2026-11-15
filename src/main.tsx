import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './app/queryClient'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { AppErrorBoundary } from './app/AppErrorBoundary'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
