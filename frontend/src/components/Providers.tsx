'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import {
  queryClient,
  persistQueryCache,
  restoreQueryCache,
  clearQueryCache,
} from '../lib/queryClient'
import { apiClient } from '../lib/api'
import { ROUTES } from '../config/constants'
import { ReactNode, useEffect } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    restoreQueryCache()

    apiClient.setUnauthorizedHandler(() => {
      clearQueryCache()
      queryClient.setQueryData(['auth', 'user'], null)

      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.LOGIN
      }
    })

    const persistInterval = setInterval(persistQueryCache, 60 * 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistQueryCache()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const handleBeforeUnload = () => {
      persistQueryCache()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(persistInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      persistQueryCache()
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="convexhire-theme"
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}
