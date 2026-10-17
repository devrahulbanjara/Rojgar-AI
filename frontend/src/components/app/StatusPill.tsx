import type { ReactNode } from 'react'

import { FIT_LABEL, type Fit, STAGE_LABEL, type Stage } from '@/lib/api/recruiter'
import { jobStatusLabel } from '@/lib/jobHelpers'
import { cn } from '@/lib/utils'
import type { JobListItem, JobStatus } from '@/store/services/jobsApi'

/** Semantic tones only: green good/active, amber pending/draft, red overdue/not selected, neutral closed. */
export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

const TONE: Record<Tone, { pill: string; dot: string }> = {
  success: { pill: 'bg-success-bg text-success', dot: 'bg-success' },
  warning: { pill: 'bg-warning-bg text-warning', dot: 'bg-warning' },
  danger: { pill: 'bg-danger-bg text-danger', dot: 'bg-danger' },
  neutral: { pill: 'bg-neutral-bg text-neutral', dot: 'bg-neutral' },
}

/** The one pill: dot + tinted background + matching text. */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE[tone].pill,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', TONE[tone].dot)} />
      {children}
    </span>
  )
}

const STAGE_TONE: Record<Stage, Tone> = {
  new: 'neutral',
  shortlisted: 'success',
  interview: 'success',
  offer: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
}

/** New · Shortlisted · Interview · Offer · Hired · Not selected · Withdrawn. */
export function StagePill({ stage }: { stage: Stage }) {
  return <StatusPill tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</StatusPill>
}

const JOB_TONE: Record<JobStatus, Tone> = { open: 'success', draft: 'warning', closed: 'neutral' }

/** Open · Draft · Closed · Filled. */
export function JobStatusPill({ job }: { job: Pick<JobListItem, 'status' | 'closed_reason'> }) {
  return <StatusPill tone={JOB_TONE[job.status]}>{jobStatusLabel(job)}</StatusPill>
}

const FIT_TONE: Record<Fit, Tone> = { strong: 'success', possible: 'warning', weak: 'neutral' }

/** "Fits" · "Might fit" · "Doesn't fit yet": never a bare number. */
export function FitPill({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <StatusPill tone={FIT_TONE[fit]} className={className}>
      {FIT_LABEL[fit]}
    </StatusPill>
  )
}

/** A neutral tag: "Remote", "Kathmandu", "NPR 120k–180k". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}
