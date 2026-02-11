'use client'

import React, { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Component that forces light mode for specific pages (landing, signin, signup)
 * This ensures these pages always display in light mode regardless of user's theme preference
 */
export function ForceLightMode({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    // Store the current theme
    const previousTheme = theme

    // Force light mode
    setTheme('light')

    // Cleanup: restore previous theme when component unmounts
    return () => {
      if (previousTheme && previousTheme !== 'light') {
        setTheme(previousTheme)
      }
    }
  }, [setTheme, theme])

  return children
}
