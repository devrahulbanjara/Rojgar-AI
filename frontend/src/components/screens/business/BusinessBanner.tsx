'use client'

import { useEffect } from 'react'

import Link from 'next/link'

import { useActiveBusiness } from '@/lib/session'
import { useLazyGetMeQuery } from '@/store/services/authApi'

import { WaitingIcon, WarningIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

const RECHECK_MS = 60_000

/**
 * One calm line while the business isn't verified yet (or was stopped), shown
 * above every team page. It goes away by itself once staff approve.
 */
export function BusinessBanner() {
  const business = useActiveBusiness()
  const [getMe] = useLazyGetMeQuery()
  const status = business?.business_status

  useEffect(() => {
    if (status !== 'pending') return
    const timer = window.setInterval(() => void getMe(), RECHECK_MS)
    return () => window.clearInterval(timer)
  }, [status, getMe])

  if (!business || status === 'active') return null

  const isOwner = business.role === 'owner'
  const reason = business.status_reason
  let line: string
  let action: string | null = null
  if (status === 'pending' && !reason) {
    line =
      "We're checking your business. You can set up jobs now; they go live after approval (usually the same day)."
  } else if (status === 'pending') {
    line = `We need a little more to approve your business: ${reason}`
    action = 'Add details'
  } else if (status === 'rejected') {
    line = `Your business wasn't approved${reason ? `: ${reason}` : '.'}`
    action = 'Add details'
  } else {
    line = `Your business is suspended and your jobs are hidden.${reason ? ` ${reason}` : ''} Contact Rojgar AI support.`
  }
  const calm = status === 'pending' && !reason
  const Icon = calm ? WaitingIcon : WarningIcon

  return (
    <div
      role="status"
      className={
        calm
          ? 'flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-card px-4 py-3 text-sm text-foreground sm:px-6'
          : 'flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-warning-bg px-4 py-3 text-sm text-foreground sm:px-6'
      }
    >
      <Icon className={calm ? 'size-5 shrink-0 text-primary' : 'size-5 shrink-0 text-warning'} />
      <p className="min-w-0 flex-1">{line}</p>
      {action && isOwner ? (
        <Button asChild size="sm" variant="outline">
          <Link href="/start?step=details">{action}</Link>
        </Button>
      ) : null}
    </div>
  )
}
