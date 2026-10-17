'use client'

import { type ReactNode, useState } from 'react'

import Link from 'next/link'

import {
  type DecideAction,
  type EventView,
  type CandidatePanel as Panel,
  type ResumeResponse,
  type ReviewCheck,
  SOURCE_LABEL,
  STAGE_LABEL,
  type Stage,
  contactLinks,
  useAddNoteMutation,
  useClearFlagMutation,
  useGetCandidateQuery,
} from '@/lib/api/recruiter'
import { ago, formatWhen, shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'

import { AiGlow, AiSpark, AiText } from '@/components/app/Ai'
import { ErrorState } from '@/components/app/Feedback'
import { Section } from '@/components/app/Section'
import { FitPill } from '@/components/app/StatusPill'
import { ArrowLeftIcon, CheckIcon, DownloadIcon, MinusIcon, XIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import { AskBox } from './AskBox'
import { DecisionButtons } from './DecisionButtons'
import { ContactButtons, FlagLine } from './parts'

function Dot() {
  return <span aria-hidden="true">·</span>
}

function ContactLine({ person }: { person: Panel['person'] }) {
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
  for (const [key, label, href] of [
    ['li', 'LinkedIn', person.linkedin_url],
    ['gh', 'GitHub', person.github_url],
    ['web', 'Website', person.portfolio_url],
  ] as const) {
    if (href)
      parts.push(
        <a key={key} href={href} target="_blank" rel="noreferrer" className="hover:underline">
          {label}
        </a>,
      )
  }
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

function CheckRow({ check }: { check: ReviewCheck }) {
  const { icon: Icon, tone, label } = CHECK_ICON[check.result]
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <Icon weight="bold" className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-label={label} />
      <div className="min-w-0">
        <p>
          {check.criterion}
          {check.kind === 'nice' ? (
            <span className="text-muted-foreground"> · nice to have</span>
          ) : null}
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
  candidate: Panel
  onDecide: (action: DecideAction) => void
}) {
  const { review } = candidate
  const pending = review.state === 'pending'
  const [clearFlag, { isLoading: clearing }] = useClearFlagMutation()
  return (
    <AiGlow active={pending}>
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5">
        {pending ? (
          <p className="flex items-center gap-2 text-sm">
            <AiSpark active />
            <AiText>Reading CV…</AiText>
          </p>
        ) : review.flagged ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              No fit shown until someone checks the CV.
            </p>
            <Button
              size="sm"
              variant="outline"
              loading={clearing}
              onClick={() =>
                void clearFlag(candidate.application_id)
                  .unwrap()
                  .catch(() => notify.error("Couldn't clear the flag. Try again."))
              }
            >
              I checked the CV
            </Button>
          </div>
        ) : review.fit ? (
          <div className="flex flex-col gap-2">
            <FitPill fit={review.fit} className="self-start" />
            {review.summary ? <p className="text-sm">{review.summary}</p> : null}
          </div>
        ) : review.state === 'failed' ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t read this CV. Open it below.
          </p>
        ) : review.summary ? (
          <p className="text-sm">{review.summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Not checked yet.</p>
        )}
        {review.checks.length ? (
          <ul className="flex flex-col gap-2.5">
            {review.checks.map((check) => (
              <CheckRow key={`${check.kind}-${check.criterion}`} check={check} />
            ))}
          </ul>
        ) : null}
        <AskBox
          applicationId={candidate.application_id}
          firstName={candidate.person.name.split(' ')[0]}
          actions={candidate.actions}
          onDecide={onDecide}
        />
      </section>
    </AiGlow>
  )
}

function Answers({ answers }: { answers: Panel['answers'] }) {
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

function period(start: string | null, end: string | null): string | null {
  const from = start ? new Date(start).getFullYear() : null
  if (!from) return null
  const to = end ? new Date(end).getFullYear() : 'now'
  return from === to ? String(from) : `${from}–${to}`
}

function hasOutline(resume: ResumeResponse | null): resume is ResumeResponse {
  return (
    !!resume && !!(resume.experiences.length || resume.educations.length || resume.skills.length)
  )
}

function Cv({ candidate }: { candidate: Panel }) {
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
  const resume = candidate.resume
  if (!hasOutline(resume)) {
    return <p className="text-sm text-muted-foreground">No CV. Applied with answers only.</p>
  }
  return (
    <Section title="CV">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 text-sm sm:p-5">
        {resume.headline ? <p className="font-medium">{resume.headline}</p> : null}
        {resume.summary ? <p className="text-muted-foreground">{resume.summary}</p> : null}
        {resume.experiences.length ? (
          <ul className="flex flex-col gap-1.5">
            {resume.experiences.map((item) => {
              const when = period(item.start_date, item.end_date)
              return (
                <li key={item.id}>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {item.company_name}
                    {when ? ` · ${when}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {resume.educations.length ? (
          <ul className="flex flex-col gap-1.5">
            {resume.educations.map((item) => {
              const when = period(item.start_date, item.end_date)
              return (
                <li key={item.id}>
                  {[item.degree, item.field_of_study, item.institution].filter(Boolean).join(', ')}
                  {when ? <span className="text-muted-foreground"> · {when}</span> : null}
                </li>
              )
            })}
          </ul>
        ) : null}
        {resume.skills.length ? (
          <p className="text-muted-foreground">
            {resume.skills.map((s) => s.skill_name).join(' · ')}
          </p>
        ) : null}
      </div>
    </Section>
  )
}

const STAGE_EVENT: Record<Stage, string> = {
  new: 'Moved to New',
  shortlisted: 'Shortlisted',
  interview: 'Invited to interview',
  offer: 'Offer made',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Marked withdrawn',
}

function eventText(event: EventView, source: Panel['source']): string | null {
  const p = event.payload
  switch (event.type) {
    case 'applied':
      return `Applied · ${SOURCE_LABEL[source]}`
    case 'stage_changed': {
      const to = p.to as Stage | undefined
      if (!to) return 'Stage changed'
      if (p.action === 'move_back') return `Moved back to ${STAGE_LABEL[to]}`
      if (p.action === 'job_closed') return 'Job closed · Not selected'
      return STAGE_EVENT[to]
    }
    case 'email_scheduled':
      return p.status === 'failed' ? "Email couldn't be sent" : 'Email sending soon'
    case 'email_sent':
      return typeof p.subject === 'string' ? `Email sent: ${p.subject}` : 'Email sent'
    case 'interview_booked':
      return typeof p.starts_at === 'string'
        ? `Interview booked for ${formatWhen(p.starts_at)}`
        : 'Interview booked'
    case 'interview_done':
      return 'Interview done'
    case 'review_done':
      return 'CV read'
    case 'flag_cleared':
      return 'Flag cleared after a person checked the CV'
    default:
      return null
  }
}

function Activity({ candidate }: { candidate: Panel }) {
  if (!candidate.events.length) return null
  return (
    <Section title="Activity">
      <ol className="flex flex-col gap-2 text-sm">
        {candidate.events.map((event) => {
          const meta = (
            <span className="text-muted-foreground">
              {event.actor ? `· ${event.actor.name} ` : ''}· {shortDate(event.created_at)}
            </span>
          )
          if (event.type === 'note')
            return (
              <li key={event.id} className="flex flex-col gap-0.5 rounded-xl bg-muted/50 px-3 py-2">
                <p className="whitespace-pre-line">{String(event.payload.text ?? '')}</p>
                <p className="text-xs">Note {meta}</p>
              </li>
            )
          const text = eventText(event, candidate.source)
          if (!text) return null
          return (
            <li key={event.id} className="flex flex-wrap gap-x-1.5">
              <span>{text}</span>
              {meta}
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

function Note({ applicationId }: { applicationId: string }) {
  const [text, setText] = useState('')
  const [addNote, { isLoading }] = useAddNoteMutation()
  async function save() {
    const clean = text.trim()
    if (!clean) return
    try {
      await addNote({ applicationId, text: clean }).unwrap()
      setText('')
    } catch {
      notify.error("Couldn't save the note. Try again.")
    }
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void save()
        }}
        placeholder="Add a note…"
        aria-label="Add a note"
        rows={2}
        maxLength={2000}
        className="bg-card"
      />
      {text.trim() ? (
        <Button type="submit" size="sm" variant="outline" loading={isLoading} className="self-end">
          Save note
        </Button>
      ) : null}
    </form>
  )
}

export function CandidatePanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading applicant">
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
  onDecide: (candidate: Panel, action: DecideAction) => void
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
        Couldn&apos;t load this applicant.
      </ErrorState>
    )
  }

  const decide = (action: DecideAction) => onDecide(candidate, action)
  const noCv = !candidate.cv_url && !hasOutline(candidate.resume)
  const phoneFirst = !!candidate.person.phone && (noCv || !!candidate.referred_by)
  const others = candidate.other_applications

  return (
    <article className="flex flex-col gap-6" aria-label={candidate.person.name}>
      <header className="flex flex-col gap-3">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 self-start lg:hidden">
            <ArrowLeftIcon />
            All applicants
          </Button>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-heading text-2xl font-normal tracking-tight">
              {candidate.person.name}
            </h2>
            {candidate.person.headline ? (
              <p className="text-sm">{candidate.person.headline}</p>
            ) : null}
            {candidate.referred_by ? (
              <p className="text-sm font-medium text-primary">
                Recommended by {candidate.referred_by.name}
              </p>
            ) : null}
            <ContactLine person={candidate.person} />
          </div>
          <DecisionButtons
            stage={candidate.stage}
            actions={candidate.actions}
            name={candidate.person.name}
            onDecide={decide}
          />
        </div>
        {phoneFirst && candidate.person.phone ? (
          <ContactButtons
            phone={candidate.person.phone}
            email={candidate.person.email}
            className="sm:hidden"
          />
        ) : null}
        {candidate.review.flagged ? <FlagLine reason={candidate.review.flag_reason} /> : null}
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>
            Applied {ago(candidate.applied_at)} · {SOURCE_LABEL[candidate.source]}
          </span>
          {others ? (
            <>
              <Dot />
              <Link
                href={`/recruiter/candidates?q=${encodeURIComponent(candidate.person.name)}`}
                className="hover:underline"
              >
                Also applied to {others} other job{others === 1 ? '' : 's'}
              </Link>
            </>
          ) : null}
        </p>
      </header>

      {noCv && candidate.answers.length ? <Answers answers={candidate.answers} /> : null}
      <Why candidate={candidate} onDecide={decide} />
      {!noCv && candidate.answers.length ? <Answers answers={candidate.answers} /> : null}
      <Cv candidate={candidate} />
      <Activity candidate={candidate} />
      <Note applicationId={candidate.application_id} />
    </article>
  )
}
