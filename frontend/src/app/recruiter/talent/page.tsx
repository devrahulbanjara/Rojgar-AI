'use client'

import { useCallback, useMemo, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
} from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { ChevronRight, UserRound } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import { FilterSelect, SearchInput, Toolbar, ToolbarCount } from '@/components/common/Toolbar'
import CandidateDrawer, {
  type DrawerTab,
  resolveDrawerTab,
} from '@/components/recruiter/CandidateDrawer/CandidateDrawer'

import styles from './page.module.scss'

const STATUS_OPTIONS: Array<{ value: 'all' | ApplicationStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_booked', label: 'Interview booked' },
  { value: 'interview_completed', label: 'Interview completed' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

export default function RecruiterTalentPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialJobId = searchParams.get('job_id') ?? 'all'
  const drawerAppId = searchParams.get('app')
  const drawerTabParam = searchParams.get('tab')
  const drawerTab = resolveDrawerTab(drawerTabParam, 'profile')

  const [selectedJobId, setSelectedJobId] = useState(initialJobId)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ApplicationStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const updateDrawerParams = useCallback(
    (next: { app: string | null; tab?: DrawerTab | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.app) {
        params.set('app', next.app)
      } else {
        params.delete('app')
      }
      if (next.tab) {
        params.set('tab', next.tab)
      } else if (next.tab === null) {
        params.delete('tab')
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const openDrawer = useCallback(
    (applicationId: string) => updateDrawerParams({ app: applicationId }),
    [updateDrawerParams],
  )
  const closeDrawer = useCallback(
    () => updateDrawerParams({ app: null, tab: null }),
    [updateDrawerParams],
  )
  const setDrawerTab = useCallback(
    (tab: DrawerTab) => updateDrawerParams({ app: drawerAppId, tab }),
    [drawerAppId, updateDrawerParams],
  )

  const { data: jobsResp } = useGetCompanyJobsQuery()
  const {
    data: resp,
    isLoading,
    isError,
    refetch,
  } = useGetMyCompanyCandidatesQuery({ page: 1, size: 200 })

  const jobs = jobsResp?.data ?? []
  const candidates = useMemo(() => resp?.data ?? [], [resp?.data])

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return candidates.filter((candidate) => {
      if (
        selectedJobId !== 'all' &&
        !candidate.applications.some((application) => application.job_id === selectedJobId)
      ) {
        return false
      }
      if (
        selectedStatus !== 'all' &&
        !candidate.applications.some((application) => application.status === selectedStatus)
      ) {
        return false
      }
      if (!normalizedSearch) return true
      return [
        candidate.applicant_name,
        candidate.applicant_email,
        candidate.primary_job_title,
        ...candidate.applications.map((application) => application.job_title),
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [candidates, searchTerm, selectedJobId, selectedStatus])

  return (
    <div className={`dash-content container container--app-shell ${styles.page}`}>
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Talent</h2>
          <p className="dash-page-header__subtitle">
            Cross-job library of everyone who applied to your company. Click any card to open the
            full drawer.
          </p>
        </div>
      </div>

      <Toolbar>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, email, or role"
        />
        <FilterSelect
          value={selectedJobId}
          onChange={setSelectedJobId}
          ariaLabel="Filter by job"
          options={[
            { value: 'all', label: 'All jobs' },
            ...jobs.map((job) => ({ value: job.id, label: job.title })),
          ]}
        />
        <FilterSelect<'all' | ApplicationStatus>
          value={selectedStatus}
          onChange={setSelectedStatus}
          ariaLabel="Filter by status"
          options={STATUS_OPTIONS}
        />
        <ToolbarCount>
          {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'} found
        </ToolbarCount>
      </Toolbar>

      {isLoading ? (
        <div className={styles.skeleton}>
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      ) : isError ? (
        <div className={styles.empty}>
          <UserRound size={28} aria-hidden="true" />
          <p>Failed to load candidates.</p>
          <button className="btn btn--secondary btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className={styles.empty}>
          <UserRound size={28} aria-hidden="true" />
          <p>No candidates match these filters yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCandidates.map((candidate) => {
            const latestApp = [...candidate.applications].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            return (
              <button
                type="button"
                key={candidate.candidate_id}
                className={styles.card}
                onClick={() => openDrawer(latestApp?.application_id || candidate.latest_application_id)}
                aria-label={`Open drawer for ${candidate.applicant_name}`}
              >
                <Avatar
                  name={candidate.applicant_name}
                  src={candidate.applicant_avatar_url}
                  seed={candidate.candidate_id}
                  className={styles.avatar}
                  sizes="44px"
                />
                <div className={styles.identity}>
                  <p className={styles.name}>{candidate.applicant_name}</p>
                  <p className={styles.email}>{candidate.applicant_email}</p>
                  <p className={styles.role}>
                    Applied for: <span>{latestApp?.job_title || candidate.primary_job_title}</span>
                  </p>
                </div>
                <span className={styles.chevron} aria-hidden="true">
                  <ChevronRight size={18} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      <CandidateDrawer
        applicationId={drawerAppId}
        activeTab={drawerTab}
        onClose={closeDrawer}
        onTabChange={setDrawerTab}
        onApplicationChange={openDrawer}
      />
    </div>
  )
}
