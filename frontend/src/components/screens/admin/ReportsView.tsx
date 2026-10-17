'use client'

import { useState } from 'react'

import Link from 'next/link'

import { ago } from '@/lib/dates'
import { notify } from '@/lib/notify'
import {
  type FlaggedJob,
  type ReportReason,
  useDismissReportsMutation,
  useGetReportsQuery,
  useRestoreJobMutation,
  useUnpublishJobMutation,
} from '@/store/services/adminApi'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusPill } from '@/components/app/StatusPill'
import { ExternalLinkIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { BUSINESS_STATUS } from './BusinessesView'
import { adminError } from './adminError'

const REASON: Record<ReportReason, string> = {
  fee_requested: 'Asks for money',
  fake: 'Looks fake',
  discriminatory: 'Unfair to some people',
  other: 'Something else',
}

function FlaggedJobCard({ job, markHidden }: { job: FlaggedJob; markHidden: boolean }) {
  const [unpublish, unpublishing] = useUnpublishJobMutation()
  const [restore, restoring] = useRestoreJobMutation()
  const [dismiss, dismissing] = useDismissReportsMutation()
  const business = BUSINESS_STATUS[job.business_status]

  async function act(action: Promise<unknown>, done: string) {
    try {
      await action
      notify.success(done)
    } catch (error) {
      notify.error(adminError(error))
    }
  }

  async function hide() {
    try {
      await unpublish({ jobId: job.job_id }).unwrap()
      notify.undoable(`${job.job_title} is hidden from the public`, {
        onUndo: () => void act(restore(job.job_id).unwrap(), `${job.job_title} is public again`),
      })
    } catch (error) {
      notify.error(adminError(error))
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            <Link
              href={`/jobs/${job.job_slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              {job.job_title}
              <ExternalLinkIcon className="size-4 text-muted-foreground" />
            </Link>
          </h2>
          <p className="text-sm text-muted-foreground">
            {job.business_name}
            {job.business_status !== 'active' ? ` · ${business.label}` : ''}
          </p>
        </div>
        {job.unpublished && markHidden ? (
          <StatusPill tone="neutral">Hidden from public</StatusPill>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2">
        {job.reports.map((report) => (
          <li key={report.id} className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {REASON[report.reason]}
              <span className="font-normal text-muted-foreground">
                {' · '}
                {report.source === 'auto' ? 'Found automatically' : 'From an applicant'}
                {' · '}
                {ago(report.created_at)}
              </span>
            </p>
            {report.details ? <p className="text-sm text-foreground">{report.details}</p> : null}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {job.unpublished ? (
          <Button
            variant="outline"
            loading={restoring.isLoading}
            onClick={() =>
              void act(restore(job.job_id).unwrap(), `${job.job_title} is public again`)
            }
          >
            Show again
          </Button>
        ) : (
          <Button loading={unpublishing.isLoading} onClick={() => void hide()}>
            Hide job
          </Button>
        )}
        {job.unpublished ? null : (
          <Button
            variant="ghost"
            loading={dismissing.isLoading}
            onClick={() => void act(dismiss(job.job_id).unwrap(), 'Reports closed')}
          >
            Nothing wrong
          </Button>
        )}
      </div>
    </li>
  )
}

/** Jobs applicants reported or that were flagged automatically. */
export function ReportsView() {
  const [view, setView] = useState<'open' | 'hidden'>('open')
  const { data, isLoading, isError, isFetching, refetch } = useGetReportsQuery({
    includeResolved: view === 'hidden',
  })
  const all = data?.data ?? []
  const jobs = view === 'hidden' ? all.filter((job) => job.unpublished) : all

  return (
    <PageContainer>
      <PageHeader title="Reports" />
      <FilterChips
        label="Show"
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'To check' },
          { value: 'hidden', label: 'Hidden jobs' },
        ]}
      />
      {isLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load reports.
        </ErrorState>
      ) : jobs.length === 0 ? (
        <EmptyState>{view === 'open' ? 'No reported jobs.' : 'No hidden jobs.'}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <FlaggedJobCard key={job.job_id} job={job} markHidden={view === 'open'} />
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
