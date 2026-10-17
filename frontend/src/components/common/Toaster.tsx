'use client'

import { Toaster as SonnerToaster } from '@/components/ui/sonner'

/** Bottom-right keeps toasts away from page actions, which sit top-right. */
export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={4000}
      visibleToasts={3}
      offset={24}
      mobileOffset={16}
      gap={8}
    />
  )
}
