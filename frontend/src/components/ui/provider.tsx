'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

export function Provider(props: { children: ReactNode }) {
  const { theme } = useTheme()

  useEffect(() => {
    // Sync Chakra's color mode with next-themes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return <ChakraProvider value={defaultSystem}>{props.children}</ChakraProvider>
}
