'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'

import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'cookie-consent'

/**
 * One-line notice for essential cookies. It sits in the page flow above the
 * site header, so it never covers a button or form field (log in, the apply
 * form's consent box on phones). Auth pages don't render it at all.
 */
export function CookieBanner() {
  const t = useT()
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
    <div role="region" aria-label="Cookie notice" className="app-surface min-h-0 border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
        <p className="min-w-0 flex-1">
          {t.cookie.line}{' '}
          <Link href="/cookies" className="text-foreground underline underline-offset-2">
            {t.cookie.details}
          </Link>
        </p>
        <Button size="sm" onClick={dismiss}>
          {t.cookie.ok}
        </Button>
      </div>
    </div>
  )
}
