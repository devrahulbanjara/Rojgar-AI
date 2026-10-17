'use client'

import { useEffect } from 'react'

import { useT } from '@/lib/i18n/client'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT()
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <SystemState action={<Button onClick={reset}>{t.common.tryAgain}</Button>}>
      {t.system.crashed}
    </SystemState>
  )
}
