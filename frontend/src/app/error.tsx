'use client'

import { useEffect } from 'react'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <SystemState action={<Button onClick={reset}>Try again</Button>}>
      Something went wrong.
    </SystemState>
  )
}
