'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: '20px', marginBottom: '8px', color: '#0f172a' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
              An unexpected error interrupted the app. Try refreshing to recover.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
