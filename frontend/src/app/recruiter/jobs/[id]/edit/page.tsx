'use client'

import { notify } from '@/lib/notify'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import EvaluationSchemaBuilder from '@/app/recruiter/jobs/_components/EvaluationSchemaBuilder'
import RecruiterJobEditor, {
  formFromDetail,
} from '@/app/recruiter/jobs/_components/RecruiterJobEditor'
import { parseApiError } from '@/lib/apiError'
import {
  type CreateJobPayload,
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import { ArrowLeft } from 'lucide-react'

import { CompanyJobEditorSkeleton } from '../../_components/CompanyJobsSkeletons'

export default function RecruiterEditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const { data: response, isLoading: isLoadingDetail } = useGetJobByIdQuery(jobId)
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation()

  const detail = response?.data

  async function handleUpdate(payload: CreateJobPayload) {
    try {
      await updateJob({ id: jobId, ...payload }).unwrap()
      notify.success('Job updated successfully.')
      router.push('/recruiter/jobs')
    } catch (error) {
      const parsed = parseApiError(error, {}, 'Failed to update job. Please try again.')
      notify.error(parsed.message)
    }
  }

  if (isLoadingDetail) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="job-editor-page">
          <Link href="/recruiter/jobs" className="btn btn--ghost btn--sm">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>

          <div className="dash-page-header">
            <div className="dash-page-header__left">
              <h2 className="dash-page-header__title">Edit Job</h2>
              <p className="dash-page-header__subtitle">
                Update job details and save changes to your posting.
              </p>
            </div>
          </div>

          <section className="dash-card">
            <div className="dash-card__header">
              <div>
                <h3 className="dash-card__title">Job Details</h3>
                <p className="dash-card__subtitle">
                  Review and update the job information. Changes will be reflected immediately.
                </p>
              </div>
            </div>
            <div className="dash-card__body">
              <CompanyJobEditorSkeleton />
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="job-editor-page">
          <div className="dash-card">
            <div className="dash-card__body" style={{ alignItems: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--color-muted,#6b7280)' }}>Job not found.</p>
              <Link href="/recruiter/jobs" className="btn btn--primary btn--sm">
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="job-editor-page">
        <Link href="/recruiter/jobs" className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>

        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Edit Job</h2>
            <p className="dash-page-header__subtitle">
              Update job details and save changes to your posting.
            </p>
          </div>
        </div>

        <section className="dash-card">
          <div className="dash-card__header">
            <div>
              <h3 className="dash-card__title">Job Details</h3>
              <p className="dash-card__subtitle">
                Review and update the job information. Changes will be reflected immediately.
              </p>
            </div>
          </div>
          <div className="dash-card__body">
            <RecruiterJobEditor
              key={`edit:${jobId}:${detail.updated_at}`}
              initial={formFromDetail(detail)}
              onSubmit={handleUpdate}
              onCancel={() => router.push('/recruiter/jobs')}
              isLoading={isUpdating}
              submitLabel="Update Job"
            />
          </div>
        </section>

        <EvaluationSchemaBuilder jobId={jobId} />
      </div>
    </div>
  )
}
