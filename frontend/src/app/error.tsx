'use client'

import { useEffect } from 'react'

import { LIVE_DATA_UNAVAILABLE_MESSAGE } from '@/lib/backendConnection'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="app-error-state">
      <div className="container container--sm">
        <div className="app-error-state__panel">
          <div className="app-error-state__eyebrow">
            <AlertCircle size={14} aria-hidden="true" />
            Something interrupted this page
          </div>
          <h1 className="app-error-state__title">{LIVE_DATA_UNAVAILABLE_MESSAGE}</h1>
          <p className="app-error-state__description">
            We could not load this page fully right now. Please try again in a moment.
          </p>

          <button type="button" className="btn btn--primary" onClick={reset}>
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </main>
  )
}
