'use client'

import { use, useMemo } from 'react'

import ResumeTemplate from '@/app/candidate/resume/_components/ResumeTemplate'
import { useGetCompanyCandidateByIdQuery } from '@/store/services/applicationsApi'
import { ArrowLeft } from 'lucide-react'

import { CandidateDetailSkeleton } from '../../_components/CandidatesSkeletons'
import { mapRecruiterCandidateResume } from '../../_lib/mapRecruiterCandidateResume'

export default function RecruiterCandidateResumePage({
  params,
}: {
  params: Promise<{ application_id: string }>
}) {
  const { application_id: applicationId } = use(params)
  const { data: resp, isLoading, isError, refetch } = useGetCompanyCandidateByIdQuery(applicationId)
  const candidate = resp?.data
  const renderedResume = useMemo(() => mapRecruiterCandidateResume(candidate), [candidate])

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        <CandidateDetailSkeleton />
      </div>
    )
  }

  if (isError || !candidate || !renderedResume) {
    return (
      <div className="dash-content container container--app-shell">
        <button type="button" className="jd-back" onClick={() => window.history.back()}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <div className="dash-card">
          <div className="dash-card__body">
            Could not load this resume.{' '}
            <button className="auth__inline-link" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rv-overlay">
      <div className="rv-overlay__bar">
        <div className="rv-overlay__bar-left">
          <button type="button" className="jd-back" onClick={() => window.history.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
        </div>
        <span className="rv-overlay__bar-title">{candidate.applicant_name}</span>
        <div className="rv-overlay__bar-right" />
      </div>
      <div className="rv-overlay__scroll" data-lenis-prevent>
        <div className="rv-page-shadow">
          <ResumeTemplate resume={renderedResume} />
        </div>
      </div>
    </div>
  )
}
