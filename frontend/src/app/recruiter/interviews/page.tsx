'use client'

import { useCallback, useMemo } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { type InterviewItem, useGetInterviewsQuery } from '@/store/services/interviewsApi'

import CandidateDossier, {
  DOSSIER_TABS,
  type DossierTab,
} from '@/components/recruiter/CandidateDossier/CandidateDossier'

import Calendar, { type CalendarView } from './_components/Calendar'

const VIEW_VALUES: CalendarView[] = ['day', '3day', 'week']

function isCalendarView(value: string | null): value is CalendarView {
  return value !== null && (VIEW_VALUES as string[]).includes(value)
}

function parseDate(value: string | null): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toDateParam(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function RecruiterInterviewsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view: CalendarView = isCalendarView(searchParams.get('view'))
    ? (searchParams.get('view') as CalendarView)
    : '3day'
  const anchorDate = parseDate(searchParams.get('date'))

  const dossierAppId = searchParams.get('app')
  const dossierTabParam = searchParams.get('tab')
  const dossierTab: DossierTab = (DOSSIER_TABS as readonly string[]).includes(dossierTabParam ?? '')
    ? (dossierTabParam as DossierTab)
    : 'interview'

  const updateParams = useCallback(
    (next: {
      view?: CalendarView
      date?: string | null
      app?: string | null
      tab?: DossierTab | null
    }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.view) params.set('view', next.view)
      if (next.date !== undefined) {
        if (next.date) params.set('date', next.date)
        else params.delete('date')
      }
      if (next.app !== undefined) {
        if (next.app) params.set('app', next.app)
        else params.delete('app')
      }
      if (next.tab !== undefined) {
        if (next.tab) params.set('tab', next.tab)
        else params.delete('tab')
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
  const closeDossier = useCallback(() => updateParams({ app: null, tab: null }), [updateParams])
  const setDossierTab = useCallback((tab: DossierTab) => updateParams({ tab }), [updateParams])
  const switchDossierApp = useCallback(
    (appId: string) => updateParams({ app: appId }),
    [updateParams],
  )

  const { data, isLoading } = useGetInterviewsQuery()
  const interviews: InterviewItem[] = useMemo(() => data?.data ?? [], [data?.data])

  const handleSelect = useCallback(
    (interview: InterviewItem) => updateParams({ app: interview.application_id, tab: 'interview' }),
    [updateParams],
  )

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Interviews</h2>
          <p className="dash-page-header__subtitle">
            Calendar view of all interviews booked across your jobs. Click any block to open the
            candidate dossier.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            border: '1px solid #e4e4e7',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-bg)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          Loading interviews…
        </div>
      ) : (
        <Calendar
          view={view}
          anchorDate={anchorDate}
          interviews={interviews}
          onChangeView={setView}
          onChangeAnchor={setAnchor}
          onSelectInterview={handleSelect}
        />
      )}

      <CandidateDossier
        applicationId={dossierAppId}
        activeTab={dossierTab}
        onClose={closeDossier}
        onTabChange={setDossierTab}
        onApplicationChange={switchDossierApp}
      />
    </div>
  )
}
