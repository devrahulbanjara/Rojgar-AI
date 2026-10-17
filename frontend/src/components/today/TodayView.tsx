'use client'

import { useState } from 'react'

import Link from 'next/link'

import { formatTime, formatWhen } from '@/lib/dates'
import { notify } from '@/lib/notify'
import {
  type RecruiterHomeData,
  type RecruiterHomeInterview,
  useGetRecruiterHomeQuery,
} from '@/store/services/dashboardApi'
import { format } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { PageHeader } from '@/components/app/PageHeader'
import { RoleCard } from '@/components/app/RoleCard'
import { Section } from '@/components/app/Section'
import { PlusIcon, VideoIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const isUrl = (value: string | null) => !!value && /^https?:\/\//i.test(value)

function InterviewRow({ interview, now }: { interview: RecruiterHomeInterview; now: number }) {
  const over = new Date(interview.end_time).getTime() <= now
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <span className="w-16 shrink-0 text-sm font-medium text-foreground tabular-nums sm:w-20">
        {formatTime(interview.start_time)}
      </span>
      <Link
        href={`/recruiter/jobs/${interview.job_id}?candidate=${interview.application_id}`}
        className="flex min-w-0 flex-1 basis-40 items-center gap-3 hover:underline"
      >
        <EntityAvatar name={interview.candidate_name} className="size-8" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {interview.candidate_name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {interview.job_title}
          </span>
        </span>
      </Link>
      {over ? (
        <Button asChild size="sm" variant="outline" className="ml-auto">
          <Link href="/recruiter/interviews">How did it go?</Link>
        </Button>
      ) : isUrl(interview.location) ? (
        <Button asChild size="sm" className="ml-auto">
          <a href={interview.location!} target="_blank" rel="noreferrer">
            <VideoIcon />
            Join
          </a>
        </Button>
      ) : null}
    </li>
  )
}

function TodaySkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </PageContainer>
  )
}

export function TodayView() {
  const [now] = useState(Date.now)
  const { data, isLoading, isError, refetch } = useGetRecruiterHomeQuery()
  const home = data?.data

  if (isLoading) return <TodaySkeleton />
  if (isError || !home) {
    return (
      <PageContainer>
        <EmptyState
          action={
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          Couldn&apos;t load Today.
        </EmptyState>
      </PageContainer>
    )
  }

  const totals = home.roles.reduce((sum, role) => ({ review: sum.review + role.to_review }), {
    review: 0,
  })

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: home.company_name || 'Today' }]}
        title={`${greeting()}, ${home.first_name}`}
        facts={[
          format(new Date(), 'EEEE, d MMMM'),
          totals.review ? `${totals.review} to review` : null,
          home.interviews_today.length
            ? `${home.interviews_today.length} interview${home.interviews_today.length === 1 ? '' : 's'} today`
            : null,
        ]}
        primaryAction={
          <Button asChild>
            <Link href="/recruiter/jobs/new">
              <PlusIcon />
              Post a job
            </Link>
          </Button>
        }
      />

      <Section
        title="Interviews today"
        action={
          <Link href="/recruiter/interviews" className="text-sm text-primary hover:underline">
            All interviews
          </Link>
        }
      >
        {home.interviews_today.length ? (
          <ul className="divide-y rounded-xl border bg-card">
            {home.interviews_today.map((interview) => (
              <InterviewRow key={interview.interview_id} interview={interview} now={now} />
            ))}
          </ul>
        ) : (
          <EmptyState>
            {home.next_interview
              ? `None today. Next: ${formatWhen(home.next_interview.start_time)} with ${home.next_interview.candidate_name}.`
              : 'No interviews booked.'}
          </EmptyState>
        )}
      </Section>

      <Section title="Open roles">
        {home.roles.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {home.roles.map((role) => (
              <RoleCard key={role.job_id} role={role} companyName={home.company_name} />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button asChild size="sm">
                <Link href="/recruiter/jobs/new">Post a job</Link>
              </Button>
            }
          >
            No open roles.
          </EmptyState>
        )}
      </Section>

      {home.drafts.length ? (
        <Section title="Unfinished posts">
          <ul className="divide-y rounded-xl border bg-card">
            {home.drafts.map((draft) => (
              <li key={draft.job_id} className="flex items-center gap-3 px-4 py-3">
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{draft.title}</p>
                <Link
                  href={`/recruiter/jobs/${draft.job_id}/edit`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Finish →
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </PageContainer>
  )
}
