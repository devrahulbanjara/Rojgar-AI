'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ago } from '@/lib/dates'
import { type MyApplication, publicApi } from '@/lib/publicApi'

import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { APPLICATION_STATUS, StatusPill } from '@/components/app/StatusPill'
import { Skeleton } from '@/components/ui/skeleton'

import { useCandidateSession } from './useCandidateSession'

/** A signed-in applicant's applications: newest change first, one line each. */
export function MyApplications() {
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
      .catch(
        (err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load.'),
      )
    return () => {
      cancelled = true
    }
  }, [session, router])

  return (
    <div className="min-h-[70dvh] bg-background">
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My applications
        </h1>

        <div className="mt-6">
          {error ? (
            <EmptyState>{error}</EmptyState>
          ) : items === null ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState>No applications yet.</EmptyState>
          ) : (
            <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
              {items.map((app) => {
                const tone = APPLICATION_STATUS[app.status]?.tone ?? 'neutral'
                return (
                  <li key={app.application_id}>
                    <Link
                      href={`/jobs/${app.job_slug}`}
                      className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent sm:px-5"
                    >
                      <EntityAvatar
                        name={app.company_name}
                        src={app.company_logo_url}
                        kind="company"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate font-semibold text-foreground">{app.job_title}</p>
                          <StatusPill tone={tone}>{app.status_label}</StatusPill>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {app.company_name} · {ago(app.updated_at)}
                        </p>
                        {app.next_step ? (
                          <p className="mt-1 text-sm text-foreground">{app.next_step}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
