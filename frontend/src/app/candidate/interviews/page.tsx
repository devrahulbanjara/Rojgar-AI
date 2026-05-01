'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { getCompanyAccent } from '@/lib/companyAccent'
import {
  type CandidateInterviewView,
  useGetMyInterviewsQuery,
} from '@/store/services/interviewsApi'
import { X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

import Calendar, { type CalendarView } from './_components/Calendar'
import detailStyles from './_components/InterviewDetailPanel.module.scss'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const VIEW_VALUES: CalendarView[] = ['day', '3day', 'week']

function isCalendarView(value: string | null): value is CalendarView {
  return value !== null && (VIEW_VALUES as string[]).includes(value)
}

function parseDate(value: string | null): Date {
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  const parsed = year && month && day ? new Date(year, month - 1, day) : new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toDateParam(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CandidateInterviewsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const view: CalendarView = isCalendarView(searchParams.get('view'))
    ? (searchParams.get('view') as CalendarView)
    : '3day'
  const anchorDate = parseDate(searchParams.get('date'))

  const updateParams = useCallback(
    (next: { view?: CalendarView; date?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.view) params.set('view', next.view)
      if (next.date !== undefined) {
        if (next.date) params.set('date', next.date)
        else params.delete('date')
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setView = useCallback((next: CalendarView) => updateParams({ view: next }), [updateParams])
  const setAnchor = useCallback(
    (next: Date) => updateParams({ date: toDateParam(next) }),
    [updateParams],
  )

  const { data, isLoading } = useGetMyInterviewsQuery()
  const interviews: CandidateInterviewView[] = useMemo(() => data?.data ?? [], [data?.data])

  const handleSelect = useCallback((interview: CandidateInterviewView) => {
    setSelectedApplicationId(interview.application_id)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedApplicationId(null)
  }, [])

  const selectedInterview = useMemo(
    () =>
      selectedApplicationId
        ? interviews.find((i) => i.application_id === selectedApplicationId)
        : null,
    [interviews, selectedApplicationId],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Interviews</h2>
          <p className="dash-page-header__subtitle">
            Calendar view of your scheduled interviews. Click any block to view details.
          </p>
        </div>
      </div>

      <Calendar
        view={view}
        anchorDate={anchorDate}
        interviews={interviews}
        isLoading={isLoading}
        onChangeView={setView}
        onChangeAnchor={setAnchor}
        onSelectInterview={handleSelect}
      />

      {selectedInterview && (
        <InterviewDetailPanel interview={selectedInterview} onClose={handleCloseDetail} />
      )}
    </div>
  )
}

function InterviewDetailPanel({
  interview,
  onClose,
}: {
  interview: CandidateInterviewView
  onClose: () => void
}) {
  const accent = getCompanyAccent(interview.company_name)

  const interviewDate = formatDate(interview.start_time)
  const interviewStartTime = formatTime(interview.start_time)
  const interviewEndTime = formatTime(interview.end_time)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop modal-backdrop--animated"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-detail-title"
      >
        <div className="modal__header">
          <div className="modal__title" id="interview-detail-title">
            Interview Details
          </div>
          <button
            type="button"
            className="btn btn--icon btn--sm"
            aria-label="Close interview details"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <div className={detailStyles.body}>
            <div className={detailStyles.companyRow}>
              <Avatar
                name={interview.company_name}
                src={null}
                seed={interview.company_name}
                kind="company"
                className={detailStyles.avatar}
                sizes="48px"
                style={
                  {
                    '--logo-bg': accent.background,
                    '--logo-color': accent.color,
                  } as CSSProperties
                }
              />
              <div className={detailStyles.companyMeta}>
                <p className={detailStyles.role}>{interview.job_title}</p>
                <p className={detailStyles.company}>{interview.company_name}</p>
              </div>
            </div>

            <div className={detailStyles.schedule}>
              <div className={detailStyles.scheduleItem}>
                <span className={detailStyles.scheduleLabel}>Date</span>
                <span className={detailStyles.scheduleValue}>{interviewDate}</span>
              </div>
              <div className={detailStyles.scheduleItem}>
                <span className={detailStyles.scheduleLabel}>Time</span>
                <span className={detailStyles.scheduleValue}>
                  {interviewStartTime} – {interviewEndTime}
                </span>
              </div>
              {interview.location && (
                <div className={detailStyles.scheduleItem}>
                  <span className={detailStyles.scheduleLabel}>Location</span>
                  <span className={detailStyles.scheduleValue}>{interview.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
          <Link
            href={`/candidate/applications/${interview.application_id}`}
            className="btn btn--primary"
            onClick={onClose}
          >
            View Application
          </Link>
        </div>
      </div>
    </div>
  )
}
