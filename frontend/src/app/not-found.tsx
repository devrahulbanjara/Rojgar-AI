import Link from 'next/link'

import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="app-error-state">
      <div className="container container--sm">
        <div className="app-error-state__panel">
          <div className="app-error-state__eyebrow">
            <Compass size={14} aria-hidden="true" />
            Page not found
          </div>
          <h1 className="app-error-state__title">We couldn&apos;t find that page</h1>
          <p className="app-error-state__description">
            The link may be broken or the page may have moved. Head back to a known place.
          </p>

          <Link href="/" className="btn btn--primary">
            <Home size={16} aria-hidden="true" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
