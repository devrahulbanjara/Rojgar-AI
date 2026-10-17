import Link from 'next/link'

import { SystemState } from '@/components/app/SystemState'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <SystemState
      action={
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      }
    >
      This page doesn&apos;t exist.
    </SystemState>
  )
}
