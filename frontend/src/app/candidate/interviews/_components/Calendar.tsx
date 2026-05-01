'use client'

import { type CSSProperties, useMemo } from 'react'

import type { CandidateInterviewView } from '@/store/services/interviewsApi'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import SegmentedControl from '@/components/common/SegmentedControl'
import { DateInput } from '@/components/common/Toolbar'

import styles from './Calendar.module.scss'

export type CalendarView = 'day' | '3day' | 'week'

const VIEW_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: '3day' as const, label: '3-Day' },
  { value: 'week' as const, label: 'Week' },
]

const HOUR_START = 7
const HOUR_END = 24
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60
const HOUR_PX = 48
const BLOCK_NAME_PX = 42
const BLOCK_JOB_PX = 58

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date)
  const day = next.getDay()
  next.setDate(next.getDate() - day)
  return next
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInputValue(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function viewSpan(view: CalendarView): number {
  return view === 'day' ? 1 : view === '3day' ? 3 : 7
}

function viewAnchor(view: CalendarView, date: Date): Date {
  if (view === 'week') return startOfWeek(date)
  return startOfDay(date)
}

function fmtRange(start: Date, view: CalendarView): string {
  const span = viewSpan(view)
  const end = addDays(start, span - 1)
  if (span === 1) {
    return start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const sameMonth = start.getMonth() === end.getMonth()
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endStr = sameMonth
    ? end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })
    : end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

function fmtTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function minutesFromAnchor(value: string): number {
  const date = new Date(value)
  return date.getHours() * 60 + date.getMinutes()
}

function placement(start: string, end: string): { topPx: number; heightPx: number } {
  const startMin = Math.max(minutesFromAnchor(start) - HOUR_START * 60, 0)
  const endMin = Math.min(minutesFromAnchor(end) - HOUR_START * 60, TOTAL_MINUTES)
  const topPx = (startMin / 60) * HOUR_PX
  const heightPx = ((endMin - startMin) / 60) * HOUR_PX
  return { topPx, heightPx }
}

export interface CalendarProps {
  view: CalendarView
  anchorDate: Date
  interviews: CandidateInterviewView[]
  isLoading?: boolean
  onChangeView: (next: CalendarView) => void
  onChangeAnchor: (next: Date) => void
  onSelectInterview: (interview: CandidateInterviewView) => void
}

export default function Calendar({
  view,
  anchorDate,
  interviews,
  isLoading = false,
  onChangeView,
  onChangeAnchor,
  onSelectInterview,
}: CalendarProps) {
  const span = viewSpan(view)
  const anchor = useMemo(() => viewAnchor(view, anchorDate), [view, anchorDate])
  const days = useMemo(
    () => Array.from({ length: span }).map((_, idx) => addDays(anchor, idx)),
    [anchor, span],
  )
  const today = useMemo(() => new Date(), [])

  const interviewsByDay = useMemo(() => {
    const map = new Map<string, CandidateInterviewView[]>()
    interviews.forEach((interview) => {
      const day = startOfDay(new Date(interview.start_time))
      const key = day.toISOString()
      const list = map.get(key) ?? []
      list.push(interview)
      map.set(key, list)
    })
    return map
  }, [interviews])

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }).map((_, idx) => HOUR_START + idx),
    [],
  )

  const dayColumnsStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
  }

  const totalGridHeight = (HOUR_END - HOUR_START) * HOUR_PX
  const selectedDateValue = toDateInputValue(anchorDate)

  const skeletonBlocks = useMemo(
    () => [
      { startHour: 9, startMinute: 0, durationMinutes: 60, width: '82%' },
      { startHour: 12, startMinute: 30, durationMinutes: 45, width: '64%' },
      { startHour: 15, startMinute: 0, durationMinutes: 75, width: '74%' },
    ],
    [],
  )

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.range}>{fmtRange(anchor, view)}</div>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Previous"
            onClick={() => onChangeAnchor(addDays(anchor, -span))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.todayBtn}
            onClick={() => onChangeAnchor(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Next"
            onClick={() => onChangeAnchor(addDays(anchor, span))}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <DateInput
          value={selectedDateValue}
          onChange={(value) => {
            const next = parseDateInputValue(value)
            if (next) onChangeAnchor(next)
          }}
          ariaLabel="Select calendar date"
        />
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={view}
          onChange={onChangeView}
          ariaLabel="Calendar view"
        />
      </div>

      <div className={styles.calendarFrame} data-lenis-prevent>
        <div className={styles.calendarHeader}>
          <div className={styles.calendarHeaderSpacer} />
          <div className={styles.calendarHeaderInner} style={dayColumnsStyle}>
            {days.map((day) => {
              const isToday = isSameDay(day, today)
              return (
                <div
                  key={day.toISOString()}
                  className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}
                >
                  <span className={styles.dayHeaderName}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={styles.dayHeaderDate}>
                    {isToday ? <strong>{day.getDate()}</strong> : day.getDate()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.calendarBody}>
          <div className={styles.hours}>
            {hours.map((hour) => (
              <div key={hour} className={styles.hourLabel}>
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          <div className={styles.gridArea} style={dayColumnsStyle}>
            {days.map((day, dayIndex) => {
              const key = day.toISOString()
              const dayInterviews = interviewsByDay.get(key) ?? []
              return (
                <div
                  key={key}
                  className={styles.dayColumn}
                  style={{ height: `${totalGridHeight}px` }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className={styles.hourLine}
                      style={{ top: `${(hour - HOUR_START) * HOUR_PX}px` }}
                    />
                  ))}
                  {isLoading
                    ? skeletonBlocks
                        .slice(0, Math.max(1, Math.min(3, 4 - dayIndex)))
                        .map((block, index) => {
                          const topPx =
                            ((block.startHour * 60 + block.startMinute - HOUR_START * 60) / 60) *
                            HOUR_PX
                          const heightPx = (block.durationMinutes / 60) * HOUR_PX
                          return (
                            <div
                              key={`${key}-skeleton-${index}`}
                              className={styles.blockSkeleton}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                width: block.width,
                              }}
                            >
                              <span className={styles.blockSkeletonTime} />
                              <span className={styles.blockSkeletonName} />
                              {heightPx >= BLOCK_JOB_PX ? (
                                <span className={styles.blockSkeletonJob} />
                              ) : null}
                            </div>
                          )
                        })
                    : dayInterviews.map((interview) => {
                        const { topPx, heightPx } = placement(
                          interview.start_time,
                          interview.end_time,
                        )
                        const isCompleted = interview.application_status === 'interview_completed'
                        const blockClass = isCompleted ? styles.blockCompleted : styles.block
                        const showName = heightPx >= BLOCK_NAME_PX
                        const showJob = heightPx >= BLOCK_JOB_PX
                        return (
                          <button
                            key={interview.id}
                            type="button"
                            className={`${styles.block} ${blockClass}`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            onClick={() => onSelectInterview(interview)}
                          >
                            <span className={styles.blockTime}>
                              {fmtTime(interview.start_time)} – {fmtTime(interview.end_time)}
                            </span>
                            {showName ? (
                              <span className={styles.blockName}>{interview.company_name}</span>
                            ) : null}
                            {showJob ? (
                              <span className={styles.blockJob}>{interview.job_title}</span>
                            ) : null}
                          </button>
                        )
                      })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!isLoading && interviews.length === 0 ? (
        <div className={styles.empty}>No interviews booked in this range.</div>
      ) : null}
    </div>
  )
}
