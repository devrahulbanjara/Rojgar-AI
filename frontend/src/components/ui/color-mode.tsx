'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export function useColorMode() {
  const { theme, setTheme } = useTheme()
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setColorMode(theme === 'dark' ? 'dark' : 'light')
  }, [theme])

  const toggleColorMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return {
    colorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(lightValue: T, darkValue: T): T {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? darkValue : lightValue
}

// For forced light/dark mode components
export function LightMode({ children }: { children: ReactNode }) {
  return <div className="light">{children}</div>
}

export function DarkMode({ children }: { children: ReactNode }) {
  return <div className="dark">{children}</div>
}
