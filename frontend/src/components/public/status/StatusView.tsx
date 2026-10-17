'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { formatDate } from '@/lib/i18n'
import { useLocale, useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'
import { type ApplicationStatusView, PublicApiError, publicApi } from '@/lib/publicApi'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { AuthCard } from '../auth/AuthCard'
import { InterviewBlock, StagePill, isUpcoming, nextStepLine } from './StageBits'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; view: ApplicationStatusView }
  | { kind: 'withdrawn' }

/** What an applicant sees from their private status link (saved after applying, or emailed). */
export function StatusView({ token }: { token: string | null }) {
  const t = useT()
  const locale = useLocale()
  const [state, setState] = useState<State>(
    token ? { kind: 'loading' } : { kind: 'error', message: t.status.incomplete },
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
          setState({
            kind: 'error',
            // 404: expired, withdrawn or never valid. The server's words are English-only.
            message:
              err instanceof PublicApiError && err.status === 404
                ? t.status.expired
                : t.common.error,
          }),
      )
    return () => {
      cancelled = true
    }
  }, [token, t])

  async function withdraw() {
    if (!token) return
    setWithdrawing(true)
    try {
      await publicApi.withdraw(token)
      setState({ kind: 'withdrawn' })
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t.common.error)
    } finally {
      setWithdrawing(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <AuthCard title={t.status.title}>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </AuthCard>
    )
  }

  if (state.kind === 'error') {
    return (
      <AuthCard title={t.status.invalidTitle}>
        <p className="text-sm text-foreground">{state.message}</p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/signin">{t.status.getLink}</Link>
        </Button>
      </AuthCard>
    )
  }

  if (state.kind === 'withdrawn') {
    return (
      <AuthCard title={t.status.withdrawnTitle}>
        <p className="text-sm text-foreground">{t.status.withdrawnLine}</p>
      </AuthCard>
    )
  }

  const { view } = state
  const showInterview = view.stage === 'interview' && view.interview && isUpcoming(view.interview)

  return (
    <AuthCard
      title={view.job_title}
      footer={
        <Link href="/me/applications" className="font-medium text-primary hover:underline">
          {t.status.seeAll}
        </Link>
      }
     
    >
      <div className="flex flex-col gap-3">
        <Link href={`/c/${view.company_slug}`} className="w-fit text-sm font-medium hover:underline">
          {view.company_name}
        </Link>
        <StagePill stage={view.stage} className="w-fit" />
        <p className="text-sm text-foreground">{nextStepLine(t, view.stage, view.interview)}</p>
        <p className="text-xs text-muted-foreground">
          {t.status.applied(formatDate(view.applied_at, locale))}
        </p>
      </div>

      {showInterview ? (
        <InterviewBlock
          title={`${view.job_title} · ${view.company_name}`}
          interview={view.interview!}
        />
      ) : null}

      {view.can_withdraw ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">
              {t.status.withdraw}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t.status.withdrawConfirm}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.status.cancel}</Button>
              </DialogClose>
              <Button variant="destructive" loading={withdrawing} onClick={withdraw}>
                {t.status.withdrawYes}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </AuthCard>
  )
}
