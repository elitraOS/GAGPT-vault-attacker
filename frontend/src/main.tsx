import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { VaultDashboard } from './pages/VaultDashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <VaultDashboard />
    </QueryClientProvider>
  </StrictMode>,
)
