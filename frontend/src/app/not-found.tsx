import Link from 'next/link'

import { getT } from '@/lib/i18n/server'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const t = await getT()
  return (
    <SystemState
      action={
        <Button asChild>
          <Link href="/">{t.system.goHome}</Link>
        </Button>
      }
    >
      {t.system.notFound}
    </SystemState>
  )
}
