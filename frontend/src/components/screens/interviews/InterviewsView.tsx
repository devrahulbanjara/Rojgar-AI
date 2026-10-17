'use client'

import { useState } from 'react'

import Link from 'next/link'

import {
  type Interview,
  useListInterviewsQuery,
  useRescheduleInterviewMutation,
} from '@/lib/api/interviews'
import { applicantHref } from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'
import { format, isSameWeek, isToday, isTomorrow, startOfToday } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { Section } from '@/components/app/Section'
import { StatusPill } from '@/components/app/StatusPill'
import { VideoIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { ScorecardDialog } from './ScorecardDialog'

type GroupKey = 'earlier' | 'today' | 'tomorrow' | 'week' | 'later'

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'earlier', label: 'Tell us how it went' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Later' },
]

function groupOf(interview: Interview): GroupKey {
  const start = new Date(interview.starts_at)
  if (start < startOfToday()) return 'earlier'
  if (isToday(start)) return 'today'
  if (isTomorrow(start)) return 'tomorrow'
  // Nepal's week runs Sunday to Saturday.
  if (isSameWeek(start, new Date(), { weekStartsOn: 0 })) return 'week'
  return 'later'
}

/** "10:30 AM" today/tomorrow · "Wed 10:30 AM" this week · "Tue 21 Oct, 10:30 AM" otherwise */
function timeLabel(interview: Interview, group: GroupKey): string {
  const start = new Date(interview.starts_at)
  if (group === 'today' || group === 'tomorrow') return format(start, 'h:mm a')
  if (group === 'week') return format(start, 'EEE h:mm a')
  return format(start, 'EEE d MMM, h:mm a')
}

function Row({
  interview,
  group,
  onScorecard,
}: {
  interview: Interview
  group: GroupKey
  onScorecard: (interview: Interview) => void
}) {
  const [reschedule, rescheduleState] = useRescheduleInterviewMutation()

  async function onReschedule() {
    try {
      await reschedule(interview.application_id).unwrap()
      notify.success(`Sent ${interview.candidate.name} a link to pick a new time`)
    } catch {
      notify.error("Couldn't reschedule. Try again.")
    }
  }

  const candidateHref = applicantHref(interview.job.id, interview.application_id, 'interview')

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <span className="w-full shrink-0 text-sm font-medium text-foreground tabular-nums sm:w-36">
        {timeLabel(interview, group)}
      </span>
      <Link href={candidateHref} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
        <EntityAvatar
          name={interview.candidate.name}
          src={interview.candidate.avatar_url}
          className="size-8"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {interview.candidate.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {interview.job.title}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {interview.scorecard_state === 'due' ? (
          <Button size="sm" onClick={() => onScorecard(interview)}>
            How did it go?
          </Button>
        ) : interview.scorecard_state === 'done' ? (
          <StatusPill tone="success">Notes added</StatusPill>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              loading={rescheduleState.isLoading}
              onClick={() => void onReschedule()}
            >
              Reschedule
            </Button>
            {interview.meeting_url ? (
              <Button asChild size="sm">
                <a href={interview.meeting_url} target="_blank" rel="noreferrer">
                  <VideoIcon />
                  Join
                </a>
              </Button>
            ) : null}
          </>
        )}
      </div>
    </li>
  )
}

function InterviewsSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {[3, 2].map((rows, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <div className="divide-y rounded-xl border bg-card">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Agenda: interviews grouped by day, with Join / Reschedule, then "How did it go?" once over. */
export function InterviewsView() {
  const { data, isLoading, isError, isFetching, refetch } = useListInterviewsQuery(
    { range: 'upcoming' },
    { pollingInterval: 5 * 60_000, refetchOnMountOrArgChange: true },
  )
  const [scoring, setScoring] = useState<Interview | null>(null)
  const interviews = data ?? []

  const grouped = new Map<GroupKey, Interview[]>()
  for (const interview of interviews) {
    const key = groupOf(interview)
    grouped.set(key, [...(grouped.get(key) ?? []), interview])
  }
  const todayCount = grouped.get('today')?.length ?? 0
  const dueCount = interviews.filter((i) => i.scorecard_state === 'due').length

  const availability = (
    <Button asChild variant="outline">
      <Link href="/recruiter/settings/availability">Availability</Link>
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Interviews"
        facts={
          interviews.length
            ? [
                todayCount ? `${todayCount} today` : 'None today',
                dueCount ? `${dueCount} waiting for your notes` : null,
              ]
            : undefined
        }
        secondaryAction={availability}
      />
      {isLoading ? (
        <InterviewsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load interviews.
        </ErrorState>
      ) : interviews.length === 0 ? (
        <EmptyState>No interviews booked.</EmptyState>
      ) : (
        GROUPS.filter((group) => grouped.has(group.key)).map((group) => (
          <Section key={group.key} title={group.label}>
            <ul className="divide-y rounded-xl border bg-card">
              {grouped.get(group.key)!.map((interview) => (
                <Row
                  key={interview.id}
                  interview={interview}
                  group={group.key}
                  onScorecard={setScoring}
                />
              ))}
            </ul>
          </Section>
        ))
      )}
      <ScorecardDialog interview={scoring} onOpenChange={(open) => !open && setScoring(null)} />
    </PageContainer>
  )
}
