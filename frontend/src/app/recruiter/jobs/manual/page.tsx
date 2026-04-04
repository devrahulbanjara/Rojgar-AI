'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import EvaluationSchemaSetupCard, {
  DEFAULT_EVALUATION_SCHEMA_DRAFT,
  type EvaluationSchemaDraft,
  buildEvaluationSchemaPayload,
  validateEvaluationSchemaDraft,
} from '@/app/recruiter/jobs/_components/EvaluationSchemaSetupCard'
import RecruiterJobEditor, {
  getCreateJobInitialForm,
} from '@/app/recruiter/jobs/_components/RecruiterJobEditor'
import { parseApiError } from '@/lib/apiError'
import { useGetMyCompanyQuery } from '@/store/services/companyApi'
import { useUpsertJobEvaluationSchemaMutation } from '@/store/services/evaluationApi'
import { type CreateJobPayload, useCreateJobMutation } from '@/store/services/jobsApi'
import { ArrowLeft } from 'lucide-react'

export default function RecruiterManualJobPage() {
  const router = useRouter()
  const { data: companyResp } = useGetMyCompanyQuery()
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation()
  const [upsertSchema] = useUpsertJobEvaluationSchemaMutation()
  const [evaluationEnabled, setEvaluationEnabled] = useState(false)
  const [evaluationDraft, setEvaluationDraft] = useState<EvaluationSchemaDraft>(
    DEFAULT_EVALUATION_SCHEMA_DRAFT,
  )

  async function handleCreate(payload: CreateJobPayload) {
    if (evaluationEnabled) {
      const validationMessage = validateEvaluationSchemaDraft(evaluationDraft)
      if (validationMessage) {
        toast.error(validationMessage)
        return
      }
    }

    try {
      const response = await createJob(payload).unwrap()
      const jobId = response.data.id

      if (evaluationEnabled) {
        try {
          await upsertSchema({
            jobId,
            ...buildEvaluationSchemaPayload(evaluationDraft),
          }).unwrap()
          toast.success('Job posted and evaluation schema saved.')
          router.push(`/recruiter/jobs/${jobId}`)
          return
        } catch {
          toast.warn(
            'Job posted, but the evaluation schema could not be saved. You can add it from the job page.',
          )
          router.push(`/recruiter/jobs/${jobId}`)
          return
        }
      }

      toast.success('Job posted successfully.')
      router.push('/recruiter/jobs')
    } catch (error) {
      const parsed = parseApiError(error, {}, 'Failed to create job. Please try again.')
      toast.error(parsed.message)
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="job-ai-page__header">
        <Link href="/recruiter/jobs" className="job-ai-page__back">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Post New Job</h2>
          <p className="dash-page-header__subtitle">
            Create a new job posting manually by filling out the details below.
          </p>
        </div>
      </div>

      <section className="job-ai-card job-ai-form dash-card">
        <div className="job-ai-card__header dash-card__header">
          <div>
            <h3 className="dash-card__title">Job Details</h3>
            <p className="dash-card__subtitle">
              Fill in the job information. Fields marked with an asterisk (*) are required.
            </p>
          </div>
        </div>
        <div className="job-ai-card__body dash-card__body">
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

      <EvaluationSchemaSetupCard
        enabled={evaluationEnabled}
        onEnabledChange={setEvaluationEnabled}
        onChange={setEvaluationDraft}
        disabled={isCreating}
      />
    </div>
  )
}
