'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import AssumptionsWarnings from '@/app/recruiter/jobs/new/_components/AssumptionsWarnings'
import JobAIAssistant from '@/app/recruiter/jobs/new/_components/JobAIAssistant'
import JobDraftForm from '@/app/recruiter/jobs/new/_components/JobDraftForm'
import SalaryResearchCard from '@/app/recruiter/jobs/new/_components/SalaryResearchCard'
import {
  type JobAIDraftPayload,
  type JobAIDraftRecord,
  useCommitJobAIDraftMutation,
  useCreateJobAIDraftMutation,
  useLazyGetJobAIDraftQuery,
  useRespondToJobAIDraftMutation,
} from '@/store/services/jobAiApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'

type DraftField = keyof Pick<
  JobAIDraftPayload,
  | 'title'
  | 'location'
  | 'location_type'
  | 'salary_min'
  | 'salary_max'
  | 'currency'
  | 'overview'
  | 'responsibilities'
  | 'requirements'
  | 'preferred_qualifications'
  | 'benefits'
>

type PageState = {
  draftId: string | null
  threadId: string | null
  draft: JobAIDraftPayload | null
  salaryResearch: JobAIDraftRecord['salary_research']
  lockedFields: string[]
  assumptions: string[]
  warnings: string[]
  missingFields: string[]
  status: string | null
  loading: boolean
  saving: boolean
  dirtyFields: string[]
}

const LOCAL_CACHE_PREFIX = 'job-ai-local'

const EMPTY_PAGE_STATE: PageState = {
  draftId: null,
  threadId: null,
  draft: null,
  salaryResearch: null,
  lockedFields: [],
  assumptions: [],
  warnings: [],
  missingFields: [],
  status: null,
  loading: false,
  saving: false,
  dirtyFields: [],
}

type LocalDraftCache = {
  draft: JobAIDraftPayload
  dirtyFields: string[]
  lockedFields: string[]
}

function buildLocalCacheKey(draftId: string) {
  return `${LOCAL_CACHE_PREFIX}:${draftId}`
}

function readLocalDraftCache(draftId: string): LocalDraftCache | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(buildLocalCacheKey(draftId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as LocalDraftCache
  } catch {
    window.sessionStorage.removeItem(buildLocalCacheKey(draftId))
    return null
  }
}

function writeLocalDraftCache(draftId: string, cache: LocalDraftCache) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(buildLocalCacheKey(draftId), JSON.stringify(cache))
}

function clearLocalDraftCache(draftId: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(buildLocalCacheKey(draftId))
}

function unique(items: string[]) {
  return Array.from(new Set(items))
}

export default function RecruiterJobAIDraftPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')

  const [prompt, setPrompt] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [sourceJobId, setSourceJobId] = useState('')
  const [researchSalary, setResearchSalary] = useState(true)
  const [followUpFeedback, setFollowUpFeedback] = useState('')
  const [commitStatus, setCommitStatus] = useState<'draft' | 'active'>('draft')
  const [pageState, setPageState] = useState<PageState>(EMPTY_PAGE_STATE)

  const [createDraft, { isLoading: isCreatingDraft }] = useCreateJobAIDraftMutation()
  const [fetchDraft] = useLazyGetJobAIDraftQuery()
  const [respondToDraft, { isLoading: isResponding }] = useRespondToJobAIDraftMutation()
  const [commitDraft, { isLoading: isCommitting }] = useCommitJobAIDraftMutation()
  const { data: jobsResp } = useGetCompanyJobsQuery()

  const jobs = jobsResp?.data ?? []

  const isBusy = useMemo(
    () => pageState.loading || pageState.saving || isCreatingDraft || isResponding || isCommitting,
    [isCommitting, isCreatingDraft, isResponding, pageState.loading, pageState.saving],
  )

  function syncRouteWithDraftId(draftId: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('draftId', draftId)
    router.replace(`${pathname}?${next.toString()}`)
  }

  function applyDraftRecord(record: JobAIDraftRecord, useLocalCache = true) {
    const cached = useLocalCache ? readLocalDraftCache(record.id) : null

    setPageState({
      draftId: record.id,
      threadId: record.thread_id,
      draft: cached?.draft ?? record.latest_draft,
      salaryResearch: record.salary_research,
      lockedFields: cached?.lockedFields ?? record.locked_fields ?? [],
      assumptions: record.assumptions,
      warnings: record.warnings,
      missingFields: record.missing_fields,
      status: record.status,
      loading: false,
      saving: false,
      dirtyFields: cached?.dirtyFields ?? [],
    })
  }

  useEffect(() => {
    if (!draftIdFromUrl) return

    setPageState((prev) => ({ ...prev, loading: true }))

    void fetchDraft(draftIdFromUrl)
      .unwrap()
      .then((response) => {
        applyDraftRecord(response.data)
      })
      .catch(() => {
        setPageState((prev) => ({ ...prev, loading: false }))
        toast.error('Unable to load that AI draft right now.')
      })
  }, [draftIdFromUrl, fetchDraft])

  useEffect(() => {
    if (!pageState.draftId || !pageState.draft) return

    writeLocalDraftCache(pageState.draftId, {
      draft: pageState.draft,
      dirtyFields: pageState.dirtyFields,
      lockedFields: pageState.lockedFields,
    })
  }, [pageState.draft, pageState.draftId, pageState.dirtyFields, pageState.lockedFields])

  function handleFieldChange<K extends DraftField>(field: K, value: JobAIDraftPayload[K]) {
    setPageState((prev) => {
      if (!prev.draft) return prev

      return {
        ...prev,
        draft: {
          ...prev.draft,
          [field]: value,
        },
        dirtyFields: unique([...prev.dirtyFields, field]),
      }
    })
  }

  function handleToggleLock(field: DraftField) {
    setPageState((prev) => {
      const isLocked = prev.lockedFields.includes(field)
      return {
        ...prev,
        lockedFields: isLocked
          ? prev.lockedFields.filter((item) => item !== field)
          : [...prev.lockedFields, field],
      }
    })
  }

  async function handleGenerate() {
    if (!prompt.trim() && !sourceText.trim() && !sourceJobId) {
      toast.error('Add a prompt, notes, or choose a previous job before generating.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await createDraft({
        ...(prompt.trim() && { prompt: prompt.trim() }),
        ...(sourceText.trim() && { source_text: sourceText.trim() }),
        ...(sourceJobId && { source_job_id: sourceJobId }),
        research_salary: researchSalary,
        locked_fields: pageState.lockedFields,
      }).unwrap()

      applyDraftRecord(response.data, false)
      syncRouteWithDraftId(response.data.id)
      toast.success('AI draft created.')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('We could not generate a draft right now.')
    }
  }

  async function handleSaveEdits() {
    if (!pageState.draftId || !pageState.draft) return
    if (pageState.dirtyFields.length === 0) {
      toast.info('There are no unsaved edits to send back to AI.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await respondToDraft({
        draftId: pageState.draftId,
        decision: {
          action: 'edit',
          edited_fields: { ...pageState.draft },
          ...(followUpFeedback.trim() && { feedback: followUpFeedback.trim() }),
        },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      applyDraftRecord(response.data, false)
      toast.success('Your edits were saved back into the AI review flow.')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('Unable to save recruiter edits right now.')
    }
  }

  async function handleRegenerate(fields: DraftField[]) {
    if (!pageState.draftId || !pageState.draft) return

    const unlockedFields = fields.filter((field) => !pageState.lockedFields.includes(field))
    if (unlockedFields.length === 0) {
      toast.info('Unlock at least one field before regenerating it.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await respondToDraft({
        draftId: pageState.draftId,
        decision: {
          action: 'regenerate',
          edited_fields: { ...pageState.draft },
          regenerate_fields: unlockedFields,
          ...(followUpFeedback.trim() && { feedback: followUpFeedback.trim() }),
        },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      applyDraftRecord(response.data, false)
      toast.success('Requested fields were regenerated.')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('Unable to regenerate those fields right now.')
    }
  }

  async function handleApprove() {
    if (!pageState.draftId) return

    if (pageState.dirtyFields.length > 0) {
      toast.info('Save your manual edits before approving the draft.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await respondToDraft({
        draftId: pageState.draftId,
        decision: { action: 'approve' },
      }).unwrap()

      applyDraftRecord(response.data, false)
      toast.success('Draft approved.')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('Unable to approve this draft right now.')
    }
  }

  async function handleReject() {
    if (!pageState.draftId) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await respondToDraft({
        draftId: pageState.draftId,
        decision: {
          action: 'reject',
          ...(followUpFeedback.trim() && { feedback: followUpFeedback.trim() }),
        },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      applyDraftRecord(response.data, false)
      toast.success('Draft rejected.')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('Unable to reject this draft right now.')
    }
  }

  async function handleCommit() {
    if (!pageState.draftId) return

    if (pageState.dirtyFields.length > 0) {
      toast.info('Save your local edits before creating the real job.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await commitDraft({
        draftId: pageState.draftId,
        payload: { status_override: commitStatus },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      toast.success(`"${response.data.job.title}" was created successfully.`)
      router.push('/recruiter/jobs')
    } catch {
      setPageState((prev) => ({ ...prev, saving: false }))
      toast.error('Unable to create a real job from this draft.')
    }
  }

  return (
    <div className="dash-content container container--dashboard">
      <div className="job-ai-page">
        <aside className="job-ai-page__sidebar">
          <JobAIAssistant
            prompt={prompt}
            sourceText={sourceText}
            sourceJobId={sourceJobId}
            researchSalary={researchSalary}
            followUpFeedback={followUpFeedback}
            loading={isBusy}
            jobs={jobs}
            onPromptChange={setPrompt}
            onSourceTextChange={setSourceText}
            onSourceJobIdChange={setSourceJobId}
            onResearchSalaryChange={setResearchSalary}
            onFollowUpFeedbackChange={setFollowUpFeedback}
            onGenerate={handleGenerate}
          />

          <SalaryResearchCard research={pageState.salaryResearch} />
          <AssumptionsWarnings
            assumptions={pageState.assumptions}
            warnings={pageState.warnings}
            missingFields={pageState.missingFields}
          />
        </aside>

        <section className="job-ai-page__main">
          <div className="job-ai-toolbar">
            <div>
              <div className="job-ai-toolbar__eyebrow">Recruiter workflow</div>
              <h2 className="job-ai-toolbar__title">Review, refine, and then create the real job</h2>
              <p className="job-ai-toolbar__subtitle">
                Draft status:{' '}
                <strong>{pageState.status ? pageState.status.replaceAll('_', ' ') : 'not started'}</strong>
                {pageState.draftId ? ` · Draft ID ${pageState.draftId}` : ''}
              </p>
            </div>

            <div className="job-ai-toolbar__actions">
              <Link href="/recruiter/jobs" className="btn btn--ghost">
                Back to Jobs
              </Link>
              <button
                type="button"
                className="btn btn--outline"
                disabled={!pageState.draft || isBusy}
                onClick={() => void handleSaveEdits()}
              >
                Save Edits
              </button>
              <button
                type="button"
                className="btn btn--outline"
                disabled={!pageState.draftId || isBusy}
                onClick={() => void handleApprove()}
              >
                Approve Draft
              </button>
              <button
                type="button"
                className="btn btn--outline"
                disabled={!pageState.draftId || isBusy}
                onClick={() => void handleReject()}
              >
                Reject
              </button>
            </div>
          </div>

          {pageState.dirtyFields.length > 0 ? (
            <div className="job-ai-callout">
              You have unsaved local edits. Save them back into the AI review cycle before approving
              or creating the job.
            </div>
          ) : null}

          <JobDraftForm
            draft={pageState.draft}
            dirtyFields={pageState.dirtyFields}
            lockedFields={pageState.lockedFields}
            missingFields={pageState.missingFields}
            disabled={isBusy}
            onFieldChange={handleFieldChange}
            onToggleLock={handleToggleLock}
            onRegenerate={handleRegenerate}
          />

          <section className="job-ai-card job-ai-commit">
            <div className="job-ai-card__header">
              <div>
                <h2 className="job-ai-card__title">Create Real Job</h2>
                <p className="job-ai-card__subtitle">
                  Approval and creation stay separate so recruiters can review without publishing.
                </p>
              </div>
            </div>

            <div className="job-ai-commit__actions">
              <label className="job-ai-label" htmlFor="job-ai-commit-status">
                Create with status
              </label>
              <select
                id="job-ai-commit-status"
                className="job-ai-input"
                value={commitStatus}
                onChange={(event) => setCommitStatus(event.target.value as 'draft' | 'active')}
                disabled={isBusy}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!pageState.draftId || isBusy}
                onClick={() => void handleCommit()}
              >
                {isCommitting ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}
