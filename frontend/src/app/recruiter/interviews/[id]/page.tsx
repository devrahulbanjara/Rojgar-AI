'use client'

import { useEffect, useMemo } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { useGetInterviewsQuery } from '@/store/services/interviewsApi'
import { ArrowLeft, CalendarDays } from 'lucide-react'

export default function RecruiterInterviewRoutePage() {
  const params = useParams()
  const router = useRouter()
  const interviewId = params.id as string

  const { data: interviewsResp, isLoading, isError, refetch } = useGetInterviewsQuery()

  const interview = useMemo(
    () => interviewsResp?.data?.find((item) => item.id === interviewId),
    [interviewId, interviewsResp?.data],
  )

  useEffect(() => {
    if (interview) {
      router.replace(`/recruiter/candidates/${interview.application_id}`)
    }
  }, [interview, router])

  if (isLoading || interview) {
    return (
      <div className="dash-content container container--app-shell">
        <Link href="/recruiter/interviews" className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Interviews
        </Link>

        <div className="dash-card">
          <div className="dash-card__body dash-empty-state">
            <CalendarDays className="dash-empty-state__icon" />
            <p>
              <strong>Opening candidate application...</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !interview) {
    return (
      <div className="dash-content container container--app-shell">
        <Link href="/recruiter/interviews" className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Interviews
        </Link>

        <div className="dash-card">
          <div className="dash-card__body dash-empty-state">
            <CalendarDays className="dash-empty-state__icon" />
            <p>
              <strong>Interview not found.</strong>
            </p>
            <p className="cell-muted">
              This booking could not be matched to a candidate application.
            </p>
            <button className="btn btn--secondary btn--sm" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
