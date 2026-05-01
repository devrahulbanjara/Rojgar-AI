'use client'

import { useCallback, useMemo } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { type InterviewItem, useGetInterviewsQuery } from '@/store/services/interviewsApi'

import CandidateDrawer, {
  DRAWER_TABS,
  type DrawerTab,
} from '@/components/recruiter/CandidateDrawer/CandidateDrawer'

import Calendar, { type CalendarView } from './_components/Calendar'

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

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getVisibleRange(view: CalendarView, anchorDate: Date): { start: string; end: string } {
  const start = view === 'week' ? startOfWeek(anchorDate) : startOfDay(anchorDate)
  const span = view === 'day' ? 1 : view === '3day' ? 3 : 7
  const end = addDays(start, span - 1)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export default function RecruiterInterviewsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view: CalendarView = isCalendarView(searchParams.get('view'))
    ? (searchParams.get('view') as CalendarView)
    : '3day'
  const anchorDate = parseDate(searchParams.get('date'))

  const drawerAppId = searchParams.get('app')
  const drawerTabParam = searchParams.get('tab')
  const drawerTab: DrawerTab = (DRAWER_TABS as readonly string[]).includes(drawerTabParam ?? '')
    ? (drawerTabParam as DrawerTab)
    : 'interview'

  const updateParams = useCallback(
    (next: {
      view?: CalendarView
      date?: string | null
      app?: string | null
      tab?: DrawerTab | null
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
  const closeDrawer = useCallback(() => updateParams({ app: null, tab: null }), [updateParams])
  const setDrawerTab = useCallback((tab: DrawerTab) => updateParams({ tab }), [updateParams])
  const switchDrawerApp = useCallback(
    (appId: string) => updateParams({ app: appId }),
    [updateParams],
  )

  const interviewParams = useMemo(() => getVisibleRange(view, anchorDate), [anchorDate, view])
  const { data, isLoading } = useGetInterviewsQuery(interviewParams)
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
            candidate drawer.
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

      <CandidateDrawer
        applicationId={drawerAppId}
        activeTab={drawerTab}
        onClose={closeDrawer}
        onTabChange={setDrawerTab}
        onApplicationChange={switchDrawerApp}
      />
    </div>
  )
}
