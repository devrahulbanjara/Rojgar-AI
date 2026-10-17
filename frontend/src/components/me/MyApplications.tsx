'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { formatDate, formatDateTime } from '@/lib/i18n'
import { useLocale, useT } from '@/lib/i18n/client'
import { type MyApplication, publicApi } from '@/lib/publicApi'

import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { CalendarIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'

import {
  AddToCalendar,
  StagePill,
  isClosedStage,
  isUpcoming,
  needsApplicant,
  nextStepLine,
} from '../public/status/StageBits'
import { useCandidateSession } from './useCandidateSession'

/** A signed-in applicant's applications, grouped by what needs them. */
export function MyApplications() {
  const t = useT()
  const session = useCandidateSession()
  const router = useRouter()
  const [items, setItems] = useState<MyApplication[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session.status === 'signed-out') router.replace('/signin')
    if (session.status !== 'signed-in') return
    let cancelled = false
    publicApi
      .myApplications(session.accessToken)
      .then(
        (list) =>
          !cancelled &&
          setItems([...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at))),
      )
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : t.common.error))
    return () => {
      cancelled = true
    }
  }, [session, router, t])

  const groups = items
    ? [
        { title: t.me.needsYou, rows: items.filter((a) => needsApplicant(a.stage, a.interview)) },
        {
          title: t.me.inProgress,
          rows: items.filter(
            (a) => !needsApplicant(a.stage, a.interview) && !isClosedStage(a.stage),
          ),
        },
        { title: t.me.closed, rows: items.filter((a) => isClosedStage(a.stage)) },
      ].filter((group) => group.rows.length)
    : []

  return (
    <div className="min-h-[70dvh] bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.me.title}
        </h1>

        <div className="mt-6 flex flex-col gap-8">
          {error ? (
            <EmptyState>{error}</EmptyState>
          ) : items === null ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState>{t.me.empty}</EmptyState>
          ) : (
            groups.map((group) => (
              <section key={group.title} className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {group.title}
                </h2>
                <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
                  {group.rows.map((app) => (
                    <ApplicationRow key={app.application_id} app={app} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ApplicationRow({ app }: { app: MyApplication }) {
  const t = useT()
  const locale = useLocale()
  const interview = app.stage === 'interview' && isUpcoming(app.interview) ? app.interview! : null

  return (
    <li className="relative flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent sm:px-5">
      <EntityAvatar name={app.company_name} src={app.company_logo_url} kind="company" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link
          href={`/applications/status?token=${encodeURIComponent(app.status_token)}`}
          className="line-clamp-2 font-semibold text-foreground after:absolute after:inset-0"
        >
          {app.job_title}
        </Link>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <StagePill stage={app.stage} />
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {app.company_name} · {t.status.applied(formatDate(app.applied_at, locale))}
          </span>
        </div>
        {interview ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t.status.interview} · {formatDateTime(interview.starts_at, locale)}
            </p>
            <AddToCalendar
              size="md"
              title={`${app.job_title} · ${app.company_name}`}
              interview={interview}
              className="relative z-10"
            />
          </div>
        ) : (
          <p className="text-sm text-foreground">{nextStepLine(t, app.stage, app.interview)}</p>
        )}
      </div>
    </li>
  )
}
