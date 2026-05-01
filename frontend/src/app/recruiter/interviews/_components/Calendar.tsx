'use client'

import { type CSSProperties, useMemo } from 'react'

import type { InterviewItem } from '@/store/services/interviewsApi'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './Calendar.module.scss'

export type CalendarView = 'day' | '3day' | 'week'

const HOUR_START = 7
const HOUR_END = 21
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60
const HOUR_PX = 48 // matches `.hourLabel` flex-basis (3rem)
const BLOCK_NAME_PX = 42 // ~time + name + padding
const BLOCK_JOB_PX = 58 // ~time + name + job + padding

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date)
  const day = next.getDay() // 0=Sun
  next.setDate(next.getDate() - day)
  return next
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
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
  interviews: InterviewItem[]
  onChangeView: (next: CalendarView) => void
  onChangeAnchor: (next: Date) => void
  onSelectInterview: (interview: InterviewItem) => void
}

export default function Calendar({
  view,
  anchorDate,
  interviews,
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
    const map = new Map<string, InterviewItem[]>()
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
        <div className={styles.viewToggle} role="tablist" aria-label="Calendar view">
          {(['day', '3day', 'week'] as CalendarView[]).map((option) => {
            const label = option === 'day' ? 'Day' : option === '3day' ? '3-Day' : 'Week'
            const isActive = view === option
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.viewBtn} ${isActive ? styles.viewBtnActive : ''}`}
                onClick={() => onChangeView(option)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.calendarFrame}>
        <div className={styles.calendarHeader}>
          <div />
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
            {days.map((day) => {
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
                  {dayInterviews.map((interview) => {
                    const { topPx, heightPx } = placement(interview.start_time, interview.end_time)
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
                          <span className={styles.blockName}>{interview.candidate_name}</span>
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

      {interviews.length === 0 ? (
        <div className={styles.empty}>No interviews booked in this range.</div>
      ) : null}
    </div>
  )
}
