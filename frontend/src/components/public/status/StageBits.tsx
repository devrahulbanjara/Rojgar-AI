'use client'

import { type Dict, formatDateTime } from '@/lib/i18n'
import { useLocale, useT } from '@/lib/i18n/client'
import type { InterviewInfo, Stage } from '@/lib/publicApi'

import { StatusPill, type Tone } from '@/components/app/StatusPill'
import { CalendarIcon, VideoIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

const TONE: Record<Stage, Tone> = {
  new: 'neutral',
  shortlisted: 'success',
  interview: 'success',
  offer: 'success',
  hired: 'success',
  not_selected: 'danger',
  withdrawn: 'neutral',
}

export const isUpcoming = (interview?: InterviewInfo | null) =>
  !!interview && new Date(interview.ends_at).getTime() > Date.now()

/** Interview booked or an offer to answer: the applicant has something to do. */
export const needsApplicant = (stage: Stage, interview?: InterviewInfo | null) =>
  stage === 'offer' || (stage === 'interview' && isUpcoming(interview))

export const isClosedStage = (stage: Stage) =>
  stage === 'hired' || stage === 'not_selected' || stage === 'withdrawn'

export function StagePill({ stage, className }: { stage: Stage; className?: string }) {
  const t = useT()
  return (
    <StatusPill tone={TONE[stage]} className={className}>
      {t.stage[stage]}
    </StatusPill>
  )
}

/** One plain line: what happens next for this application. */
export function nextStepLine(t: Dict, stage: Stage, interview?: InterviewInfo | null): string {
  if (stage === 'interview') return isUpcoming(interview) ? t.nextStep.interview : t.nextStep.interviewDone
  return t.nextStep[stage]
}

function calendarStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** iPhone and Mac open .ics files in Calendar; everyone else gets Google Calendar. */
function calendarHref(title: string, interview: InterviewInfo): { href: string; download?: string } {
  const where = interview.join_url ?? interview.location ?? ''
  const dates = `${calendarStamp(interview.starts_at)}/${calendarStamp(interview.ends_at)}`
  const apple = typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/.test(navigator.userAgent)
  if (apple) {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rojgar AI//EN',
      'BEGIN:VEVENT',
      `UID:${calendarStamp(interview.starts_at)}-${encodeURIComponent(title)}`,
      `DTSTAMP:${calendarStamp(new Date().toISOString())}`,
      `DTSTART:${calendarStamp(interview.starts_at)}`,
      `DTEND:${calendarStamp(interview.ends_at)}`,
      `SUMMARY:${title.replace(/[,;\n]/g, ' ')}`,
      `LOCATION:${where.replace(/[,;\n]/g, ' ')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    return { href: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`, download: 'interview.ics' }
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates, location: where })
  return { href: `https://calendar.google.com/calendar/render?${params}` }
}

/** Interview time, Join (video link) and Add to calendar. */
export function InterviewBlock({ title, interview }: { title: string; interview: InterviewInfo }) {
  const t = useT()
  const locale = useLocale()
  const calendar = calendarHref(title, interview)
  const place = interview.join_url ? null : interview.location
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div>
        <p className="text-xs text-muted-foreground">{t.status.interview}</p>
        <p className="font-heading text-base font-semibold text-foreground">
          {formatDateTime(interview.starts_at, locale)}
        </p>
        {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {interview.join_url ? (
          <Button asChild size="lg" className="sm:flex-1">
            <a href={interview.join_url} target="_blank" rel="noopener noreferrer">
              <VideoIcon />
              {t.status.join}
            </a>
          </Button>
        ) : null}
        <Button asChild size="lg" variant="outline" className="sm:flex-1">
          <a
            href={calendar.href}
            download={calendar.download}
            target={calendar.download ? undefined : '_blank'}
            rel="noopener noreferrer"
          >
            <CalendarIcon />
            {t.status.addToCalendar}
          </a>
        </Button>
      </div>
    </div>
  )
}
