'use client'

import { useCallback, useMemo } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
} from '@/store/services/applicationsApi'
import { ClipboardCheck, Mail } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import CandidateDossier, {
  DOSSIER_TABS,
  type DossierTab,
} from '@/components/recruiter/CandidateDossier/CandidateDossier'

import styles from './JobPipelineWorkspace.module.scss'

const STAGES: Array<{ id: PipelineStage; label: string; statuses: ApplicationStatus[] }> = [
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'screening', label: 'Screening', statuses: ['screening'] },
  { id: 'shortlist', label: 'Shortlist', statuses: ['shortlisted'] },
  {
    id: 'interview',
    label: 'Interview',
    statuses: ['interview_booked', 'interview_completed'],
  },
  { id: 'offer', label: 'Offer', statuses: ['offer', 'offer_accepted', 'offer_declined'] },
  { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

type PipelineStage = 'applied' | 'screening' | 'shortlist' | 'interview' | 'offer' | 'rejected'

const STAGE_IDS = STAGES.map((stage) => stage.id) as readonly string[]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function scoreClass(score: number | null) {
  if (score === null) return styles.scoreNone
  if (score >= 75) return styles.scoreGood
  if (score >= 50) return styles.scoreOkay
  return styles.scoreLow
}

export default function JobPipelineWorkspace({ jobId }: { jobId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const stageParam = searchParams.get('stage')
  const activeStage: PipelineStage = STAGE_IDS.includes(stageParam ?? '')
    ? (stageParam as PipelineStage)
    : 'applied'

  const dossierAppId = searchParams.get('app')
  const dossierTabParam = searchParams.get('tab')
  const dossierTab: DossierTab = (DOSSIER_TABS as readonly string[]).includes(dossierTabParam ?? '')
    ? (dossierTabParam as DossierTab)
    : 'profile'

  const updateParams = useCallback(
    (next: { stage?: PipelineStage; app?: string | null; tab?: DossierTab | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.stage !== undefined) params.set('stage', next.stage)
      if (next.app !== undefined) {
        if (next.app) {
          params.set('app', next.app)
        } else {
          params.delete('app')
        }
      }
      if (next.tab !== undefined) {
        if (next.tab) {
          params.set('tab', next.tab)
        } else {
          params.delete('tab')
        }
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setStage = useCallback((stage: PipelineStage) => updateParams({ stage }), [updateParams])
  const openDossier = useCallback(
    (applicationId: string, tab?: DossierTab) =>
      updateParams({ app: applicationId, tab: tab ?? null }),
    [updateParams],
  )
  const closeDossier = useCallback(() => updateParams({ app: null, tab: null }), [updateParams])
  const setDossierTab = useCallback((tab: DossierTab) => updateParams({ tab }), [updateParams])

  const { data, isLoading, isError, refetch } = useGetMyCompanyCandidatesQuery({
    page: 1,
    size: 200,
  })

  const candidates = useMemo(() => data?.data ?? [], [data?.data])

  // Flatten applications for this job, with candidate metadata attached.
  const jobApplications = useMemo(() => {
    const rows: Array<{
      application_id: string
      candidate_id: string
      applicant_name: string
      applicant_email: string | null
      applicant_avatar_url: string | null
      job_id: string
      job_title: string
      status: ApplicationStatus
      score: number | null
      feedback: string | null
      created_at: string
    }> = []
    candidates.forEach((candidate) => {
      candidate.applications
        .filter((application) => application.job_id === jobId)
        .forEach((application) => {
          rows.push({
            application_id: application.application_id,
            candidate_id: candidate.candidate_id,
            applicant_name: candidate.applicant_name,
            applicant_email: candidate.applicant_email,
            applicant_avatar_url: candidate.applicant_avatar_url,
            job_id: application.job_id,
            job_title: application.job_title,
            status: application.status,
            score: application.score,
            feedback: application.feedback,
            created_at: application.created_at,
          })
        })
    })
    return rows
  }, [candidates, jobId])

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      applied: 0,
      screening: 0,
      shortlist: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }
    jobApplications.forEach((row) => {
      const matchedStage = STAGES.find((stage) => stage.statuses.includes(row.status))
      if (matchedStage) counts[matchedStage.id] += 1
    })
    return counts
  }, [jobApplications])

  const visibleStage = STAGES.find((stage) => stage.id === activeStage) ?? STAGES[0]
  const visibleApplications = useMemo(
    () =>
      jobApplications
        .filter((row) => visibleStage.statuses.includes(row.status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [jobApplications, visibleStage],
  )

  return (
    <div>
      <div className={styles.tabBar} role="tablist" aria-label="Pipeline stages">
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStage
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => setStage(stage.id)}
            >
              {stage.label}
              <span className={styles.tabCount}>{stageCounts[stage.id]}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className={styles.loadingSkeleton}>
          <div />
          <div />
          <div />
        </div>
      ) : isError ? (
        <div className={styles.empty}>
          Failed to load applicants.{' '}
          <button className="btn btn--ghost btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className={styles.empty}>No candidates in this stage yet.</div>
      ) : (
        <div className={styles.list}>
          {visibleApplications.map((row) => {
            const defaultTab: DossierTab =
              activeStage === 'screening'
                ? 'evaluation'
                : activeStage === 'interview'
                  ? 'interview'
                  : activeStage === 'shortlist' || activeStage === 'rejected'
                    ? 'outreach'
                    : 'profile'
            return (
              <button
                type="button"
                key={row.application_id}
                className={styles.row}
                onClick={() => openDossier(row.application_id, defaultTab)}
              >
                <Avatar
                  name={row.applicant_name}
                  src={row.applicant_avatar_url}
                  seed={row.candidate_id}
                  className={styles.avatar}
                  sizes="40px"
                />

                <span className={styles.identity}>
                  <span className={styles.name}>{row.applicant_name}</span>
                  <span className={styles.email}>{row.applicant_email ?? '—'}</span>
                </span>

                <span className={`${styles.score} ${scoreClass(row.score)}`}>
                  {row.score === null ? 'No score' : row.score}
                </span>

                <span className={styles.feedback}>{row.feedback ?? 'No review yet.'}</span>

                <span className={styles.applied}>
                  {activeStage === 'screening' ? (
                    <>
                      <ClipboardCheck size={12} aria-hidden="true" /> Score
                    </>
                  ) : activeStage === 'shortlist' || activeStage === 'rejected' ? (
                    <>
                      <Mail size={12} aria-hidden="true" /> Email
                    </>
                  ) : (
                    `Applied ${formatDate(row.created_at)}`
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <CandidateDossier
        applicationId={dossierAppId}
        activeTab={dossierTab}
        onClose={closeDossier}
        onTabChange={setDossierTab}
        onApplicationChange={(appId) => updateParams({ app: appId })}
      />
    </div>
  )
}
