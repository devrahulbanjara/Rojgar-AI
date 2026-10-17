'use client'

import { useEffect } from 'react'

import '@/app/globals.css'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <SystemState fullScreen action={<Button onClick={reset}>Try again</Button>}>
          Something went wrong.
        </SystemState>
      </body>
    </html>
  )
}
