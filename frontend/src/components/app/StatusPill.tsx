import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/store/services/applicationsApi'
import type { JobStatus } from '@/store/services/jobsApi'

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

/** Candidate-facing wording for an application status. */
export const APPLICATION_STATUS: Record<ApplicationStatus, { tone: Tone; label: string }> = {
  applied: { tone: 'neutral', label: 'Applied' },
  shortlisted: { tone: 'success', label: 'Shortlisted' },
  interview_booked: { tone: 'success', label: 'Interview' },
  interview_completed: { tone: 'warning', label: 'Interviewed' },
  offer: { tone: 'success', label: 'Offer' },
  offer_accepted: { tone: 'success', label: 'Hired' },
  offer_declined: { tone: 'neutral', label: 'Declined' },
  rejected: { tone: 'danger', label: 'Not selected' },
}

export function ApplicationStatusPill({ status }: { status: ApplicationStatus }) {
  const { tone, label } = APPLICATION_STATUS[status]
  return <StatusPill tone={tone}>{label}</StatusPill>
}

/** Recruiter-facing stage words (RECRUITER_FLOW.md §5): New · Shortlisted · Interview · Offer · Hired. */
export const STAGE: Record<ApplicationStatus, { tone: Tone; label: string }> = {
  applied: { tone: 'neutral', label: 'New' },
  shortlisted: { tone: 'success', label: 'Shortlisted' },
  interview_booked: { tone: 'success', label: 'Interview' },
  interview_completed: { tone: 'warning', label: 'Interview' },
  offer: { tone: 'success', label: 'Offer' },
  offer_accepted: { tone: 'success', label: 'Hired' },
  offer_declined: { tone: 'neutral', label: 'Withdrawn' },
  rejected: { tone: 'danger', label: 'Rejected' },
}

export function StagePill({ status }: { status: ApplicationStatus }) {
  const { tone, label } = STAGE[status]
  return <StatusPill tone={tone}>{label}</StatusPill>
}

export const JOB_STATUS: Record<JobStatus, { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Open' },
  draft: { tone: 'warning', label: 'Draft' },
  expired: { tone: 'neutral', label: 'Closed' },
}

export function JobStatusPill({ status }: { status: JobStatus }) {
  const { tone, label } = JOB_STATUS[status]
  return <StatusPill tone={tone}>{label}</StatusPill>
}

/** A neutral tag: "Remote", "Kathmandu", "NPR 120k–180k". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

export type Fit = 'strong' | 'possible' | 'weak'

/** Fit from the old 0–100 score (RECRUITER_FLOW.md: ≥75 strong, 50–74 possible, <50 weak). */
export function fitFromScore(score: number | null | undefined): Fit | null {
  if (score === null || score === undefined) return null
  if (score >= 75) return 'strong'
  if (score >= 50) return 'possible'
  return 'weak'
}

const FIT_TEXT: Record<Fit, { label: string; className: string }> = {
  strong: { label: 'Fits well', className: 'text-success' },
  possible: { label: 'Might fit', className: 'text-warning' },
  weak: { label: 'Weak fit', className: 'text-muted-foreground' },
}

/** "Fits well" · "Might fit" · "Weak fit" as plain coloured text (no numbers in the UI). */
export function FitText({ fit }: { fit: Fit }) {
  const { label, className } = FIT_TEXT[fit]
  return <span className={cn('text-sm font-medium whitespace-nowrap', className)}>{label}</span>
}
