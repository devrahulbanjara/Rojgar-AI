import Link from 'next/link'

import { getT } from '@/lib/i18n/server'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

/** An old link to a closed, filled or removed job. */
export default async function JobNotFound() {
  const t = await getT()
  return (
    <SystemState
      action={
        <Button asChild variant="outline">
          <Link href="/me/applications">{t.system.myApplications}</Link>
        </Button>
      }
    >
      {t.system.jobClosed}
    </SystemState>
  )
}
