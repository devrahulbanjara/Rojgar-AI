'use client'

import { toast } from 'react-toastify'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import RecruiterJobEditor, {
  getCreateJobInitialForm,
} from '@/app/recruiter/jobs/_components/RecruiterJobEditor'
import { parseApiError } from '@/lib/apiError'
import { useGetMyCompanyQuery } from '@/store/services/companyApi'
import { type CreateJobPayload, useCreateJobMutation } from '@/store/services/jobsApi'
import { ArrowLeft } from 'lucide-react'

export default function RecruiterManualJobPage() {
  const router = useRouter()
  const { data: companyResp } = useGetMyCompanyQuery()
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation()

  async function handleCreate(payload: CreateJobPayload) {
    try {
      await createJob(payload).unwrap()
      toast.success('Job posted successfully.')
      router.push('/recruiter/jobs')
    } catch (error) {
      const parsed = parseApiError(error, {}, 'Failed to create job. Please try again.')
      toast.error(parsed.message)
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="job-editor-page">
        <div className="job-editor-page__header">
          <Link href="/recruiter/jobs" className="job-editor-page__back">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Jobs</span>
          </Link>
        </div>

        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Post Job Manually</h2>
            <p className="dash-page-header__subtitle">
              Create a structured job post with the same recruiter workflow and layout as the rest
              of your dashboard.
            </p>
          </div>
        </div>

        <section className="dash-card">
          <div className="dash-card__header">
            <div>
              <h3 className="dash-card__title">Job Details</h3>
              <p className="dash-card__subtitle">
                Company location is prefilled when available. Review the status carefully before
                saving.
              </p>
            </div>
          </div>
          <div className="dash-card__body">
            <RecruiterJobEditor
              key={`manual-create:${companyResp?.data?.location ?? ''}`}
              initial={getCreateJobInitialForm(companyResp?.data?.location)}
              onSubmit={handleCreate}
              onCancel={() => router.push('/recruiter/jobs')}
              isLoading={isCreating}
              submitLabel="Post Job"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
