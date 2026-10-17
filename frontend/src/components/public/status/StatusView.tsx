'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { shortDate } from '@/lib/dates'
import { type ApplicationStatusView, publicApi } from '@/lib/publicApi'

import { APPLICATION_STATUS, StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { AuthCard } from '../auth/AuthCard'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; view: ApplicationStatusView }
  | { kind: 'withdrawn' }

/** What a candidate sees from the emailed status link. */
export function StatusView({ token }: { token: string | null }) {
  const [state, setState] = useState<State>(
    token ? { kind: 'loading' } : { kind: 'error', message: 'This link is incomplete.' },
  )
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    publicApi
      .status(token)
      .then((view) => !cancelled && setState({ kind: 'ready', view }))
      .catch(
        (err) =>
          !cancelled &&
          setState({ kind: 'error', message: err instanceof Error ? err.message : 'Link not valid.' }),
      )
    return () => {
      cancelled = true
    }
  }, [token])

  async function withdraw() {
    if (!token) return
    setWithdrawing(true)
    try {
      await publicApi.withdraw(token)
      setState({ kind: 'withdrawn' })
    } finally {
      setWithdrawing(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <AuthCard title="Your application">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </AuthCard>
    )
  }

  if (state.kind === 'error') {
    return (
      <AuthCard title="Link not valid">
        <p className="text-sm text-foreground">{state.message}</p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/signin">Get a sign-in link</Link>
        </Button>
      </AuthCard>
    )
  }

  if (state.kind === 'withdrawn') {
    return (
      <AuthCard title="Application withdrawn">
        <p className="text-sm text-foreground">Your CV and details for this job were deleted.</p>
      </AuthCard>
    )
  }

  const { view } = state
  const tone = APPLICATION_STATUS[view.status]?.tone ?? 'neutral'

  return (
    <AuthCard
      title={view.job_title}
      footer={
        <Link href="/signin" className="font-medium text-primary hover:underline">
          See all my applications
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        <Link href={`/c/${view.company_slug}`} className="text-sm font-medium hover:underline">
          {view.company_name}
        </Link>
        <StatusPill tone={tone} className="w-fit">
          {view.status_label}
        </StatusPill>
        {view.next_step ? <p className="text-sm text-foreground">{view.next_step}</p> : null}
        <p className="text-xs text-muted-foreground">Applied {shortDate(view.applied_at)}</p>
      </div>

      {view.can_withdraw ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              Withdraw application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Withdraw and delete your data?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" loading={withdrawing} onClick={withdraw}>
                Withdraw
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </AuthCard>
  )
}
