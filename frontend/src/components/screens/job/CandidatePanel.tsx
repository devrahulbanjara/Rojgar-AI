'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import {
  CAPABILITIES,
  type Candidate,
  type Check,
  type DecisionAction,
  SOURCE_LABEL,
  STAGE_LABEL,
  contactLinks,
  useGetCandidateQuery,
} from '@/lib/api/recruiter'
import { ago, shortDate } from '@/lib/dates'

import { AiGlow, AiSpark, AiText } from '@/components/app/Ai'
import { ErrorState } from '@/components/app/Feedback'
import { Section } from '@/components/app/Section'
import { ArrowLeftIcon, CheckIcon, DownloadIcon, MinusIcon, XIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import { AskBox } from './AskBox'
import { DecisionButtons } from './DecisionButtons'
import { ContactButtons, FitPill, FlagLine } from './parts'

function Dot() {
  return <span aria-hidden="true">·</span>
}

function ContactLine({ person }: { person: Candidate['person'] }) {
  const parts: ReactNode[] = []
  if (person.phone) {
    parts.push(
      <a
        key="tel"
        href={contactLinks.call(person.phone)}
        className="text-foreground hover:underline"
      >
        {person.phone}
      </a>,
      <a key="viber" href={contactLinks.viber(person.phone)} className="hover:underline">
        Viber
      </a>,
      <a
        key="wa"
        href={contactLinks.whatsapp(person.phone)}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        WhatsApp
      </a>,
    )
  }
  if (person.email)
    parts.push(
      <a key="mail" href={`mailto:${person.email}`} className="hover:underline">
        {person.email}
      </a>,
    )
  if (person.location) parts.push(<span key="loc">{person.location}</span>)
  if (person.linkedin_url)
    parts.push(
      <a
        key="li"
        href={person.linkedin_url}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        LinkedIn
      </a>,
    )
  if (!parts.length) return null
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
      {parts.flatMap((part, index) => (index ? [<Dot key={`d${index}`} />, part] : [part]))}
    </p>
  )
}

const CHECK_ICON = {
  met: { icon: CheckIcon, tone: 'text-success', label: 'Met' },
  partly: { icon: MinusIcon, tone: 'text-warning', label: 'Partly' },
  missing: { icon: XIcon, tone: 'text-muted-foreground', label: 'Not evidenced' },
} as const

function CheckRow({ check }: { check: Check }) {
  const { icon: Icon, tone, label } = CHECK_ICON[check.result]
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Icon weight="bold" className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-label={label} />
      <div className="min-w-0">
        <p>
          {check.criterion}
          {check.result === 'missing' ? (
            <span className="text-muted-foreground"> · not evidenced</span>
          ) : null}
        </p>
        {check.evidence ? (
          <p className="mt-0.5 text-xs text-muted-foreground">“{check.evidence}”</p>
        ) : null}
      </div>
    </li>
  )
}

function Why({
  candidate,
  onDecide,
}: {
  candidate: Candidate
  onDecide: (action: DecisionAction) => void
}) {
  const { review } = candidate
  const pending = review.state === 'pending'
  return (
    <AiGlow active={pending}>
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5">
        {pending ? (
          <p className="flex items-center gap-2 text-sm">
            <AiSpark active />
            <AiText>Reading CV…</AiText>
          </p>
        ) : review.flag_reason ? (
          <p className="text-sm text-muted-foreground">No fit shown until someone checks the CV.</p>
        ) : review.fit ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <FitPill fit={review.fit} />
              {review.checks.some((c) => c.evidence) ? (
                <span className="text-xs text-muted-foreground">
                  Checked against your must-haves
                </span>
              ) : null}
            </div>
            {review.summary ? <p className="text-sm">{review.summary}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not checked yet.</p>
        )}
        {review.checks.length ? (
          <ul className="flex flex-col gap-2.5">
            {review.checks.map((check) => (
              <CheckRow key={check.criterion} check={check} />
            ))}
          </ul>
        ) : null}
        <AskBox
          applicationId={candidate.application_id}
          firstName={candidate.person.name.split(' ')[0]}
          onDecide={onDecide}
        />
      </section>
    </AiGlow>
  )
}

function Answers({ answers }: { answers: Candidate['answers'] }) {
  return (
    <Section title="Answers">
      <dl className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-5">
        {answers.map((item) => (
          <div key={item.question} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{item.question}</dt>
            <dd className="text-sm">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

function Cv({ candidate }: { candidate: Candidate }) {
  if (candidate.cv_url) {
    return (
      <Section
        title="CV"
        action={
          <Button asChild size="sm" variant="outline">
            <a href={candidate.cv_url} target="_blank" rel="noreferrer" download>
              <DownloadIcon />
              Download
            </a>
          </Button>
        }
      >
        <iframe
          title={`CV of ${candidate.person.name}`}
          src={`${candidate.cv_url}#view=FitH`}
          className="h-[70vh] w-full rounded-2xl border bg-card"
        />
      </Section>
    )
  }
  const outline = candidate.cv_outline
  if (!outline) {
    return <p className="text-sm text-muted-foreground">No CV — applied with answers</p>
  }
  return (
    <Section title="Profile">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 text-sm sm:p-5">
        {outline.headline ? <p className="font-medium">{outline.headline}</p> : null}
        {outline.summary ? <p className="text-muted-foreground">{outline.summary}</p> : null}
        {outline.experiences.length ? (
          <ul className="flex flex-col gap-1.5">
            {outline.experiences.map((item) => (
              <li key={`${item.title}-${item.company}-${item.period}`}>
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {item.company}
                  {item.period ? ` · ${item.period}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {outline.educations.length ? (
          <ul className="flex flex-col gap-1.5">
            {outline.educations.map((item) => (
              <li key={`${item.title}-${item.period}`}>
                {item.title}
                {item.period ? (
                  <span className="text-muted-foreground"> · {item.period}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {outline.skills.length ? (
          <p className="text-muted-foreground">{outline.skills.join(' · ')}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">No CV file. Applied with their profile.</p>
      </div>
    </Section>
  )
}

function OtherRoles({ others }: { others: Candidate['other_applications'] }) {
  if (!others.length) return null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-sm font-normal text-muted-foreground"
        >
          Also applied to {others.length} other role{others.length === 1 ? '' : 's'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <ul className="flex flex-col">
          {others.map((other) => (
            <li key={other.application_id}>
              <Link
                href={`/recruiter/jobs/${other.job_id}?stage=${other.stage === 'withdrawn' ? 'rejected' : other.stage}&app=${other.application_id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="truncate">{other.job_title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {STAGE_LABEL[other.stage]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function Activity({ events }: { events: Candidate['events'] }) {
  if (!events.length) return null
  return (
    <Section title="Activity">
      <ol className="flex flex-col gap-2 text-sm">
        {events.map((event, index) => (
          <li key={`${event.created_at}-${index}`} className="flex flex-wrap gap-x-1.5">
            <span>{event.text}</span>
            <span className="text-muted-foreground">
              {event.actor ? `· ${event.actor} ` : ''}· {shortDate(event.created_at)}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Note() {
  return (
    <Textarea
      disabled={!CAPABILITIES.notes}
      placeholder={CAPABILITIES.notes ? 'Add a note…' : 'Add a note · coming soon'}
      aria-label="Add a note"
      rows={2}
      className="bg-card"
    />
  )
}

export function CandidatePanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading candidate">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="hidden gap-2 sm:flex">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

/** One scroll, no tabs: who → decision → why → answers → CV → activity → note. */
export function CandidatePanel({
  applicationId,
  onDecide,
  onBack,
}: {
  applicationId: string
  onDecide: (candidate: Candidate, action: DecisionAction) => void
  onBack?: () => void
}) {
  const {
    data: candidate,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetCandidateQuery(applicationId)

  if (isLoading) return <CandidatePanelSkeleton />
  if (isError || !candidate) {
    return (
      <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
        Couldn&apos;t load this candidate.
      </ErrorState>
    )
  }

  const decide = (action: DecisionAction) => onDecide(candidate, action)
  const noCv = !candidate.cv_url && !candidate.cv_outline
  const phoneFirst = !!candidate.person.phone && (noCv || !!candidate.referred_by)

  return (
    <article className="flex flex-col gap-6" aria-label={candidate.person.name}>
      <header className="flex flex-col gap-3">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 self-start lg:hidden">
            <ArrowLeftIcon />
            All candidates
          </Button>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-2xl font-normal tracking-tight">
              {candidate.person.name}
            </h2>
            {candidate.referred_by ? (
              <p className="text-sm font-medium text-primary">
                Recommended by {candidate.referred_by}
              </p>
            ) : null}
            <ContactLine person={candidate.person} />
          </div>
          <DecisionButtons stage={candidate.stage} name={candidate.person.name} onDecide={decide} />
        </div>
        {phoneFirst && candidate.person.phone ? (
          <ContactButtons
            phone={candidate.person.phone}
            email={candidate.person.email}
            className="sm:hidden"
          />
        ) : null}
        {candidate.review.flag_reason ? <FlagLine reason={candidate.review.flag_reason} /> : null}
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>
            Applied {ago(candidate.applied_at)} · {SOURCE_LABEL[candidate.source]}
          </span>
          {candidate.other_applications.length ? <Dot /> : null}
          <OtherRoles others={candidate.other_applications} />
        </p>
      </header>

      {noCv && candidate.answers.length ? <Answers answers={candidate.answers} /> : null}
      <Why candidate={candidate} onDecide={decide} />
      {!noCv && candidate.answers.length ? <Answers answers={candidate.answers} /> : null}
      <Cv candidate={candidate} />
      <Activity events={candidate.events} />
      <Note />
    </article>
  )
}
