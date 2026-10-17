'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'cookie-consent'

/**
 * One-line notice for essential cookies. It is sticky at the bottom of the
 * page flow rather than floating, so scrolling to the end always uncovers
 * whatever is underneath it (the apply form's consent box on phones).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!stored) setVisible(true)
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'acknowledged')
    } catch {
      // Storage blocked: the notice shows again next visit.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="app-surface sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
        <p className="min-w-0 flex-1">
          We only use cookies that keep you signed in.{' '}
          <Link href="/cookies" className="text-foreground underline underline-offset-2">
            Details
          </Link>
        </p>
        <Button size="sm" onClick={dismiss}>
          OK
        </Button>
      </div>
    </div>
  )
}
