'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import EvaluationSchemaSetupCard, {
  DEFAULT_EVALUATION_SCHEMA_DRAFT,
  type EvaluationSchemaDraft,
  buildEvaluationSchemaPayload,
  validateEvaluationSchemaDraft,
} from '@/app/recruiter/jobs/_components/EvaluationSchemaSetupCard'
import AssumptionsWarnings from '@/app/recruiter/jobs/new/_components/AssumptionsWarnings'
import JobAIAssistant from '@/app/recruiter/jobs/new/_components/JobAIAssistant'
import JobDraftForm from '@/app/recruiter/jobs/new/_components/JobDraftForm'
import SalaryResearchCard from '@/app/recruiter/jobs/new/_components/SalaryResearchCard'
import { parseApiError } from '@/lib/apiError'
import { useUpsertJobEvaluationSchemaMutation } from '@/store/services/evaluationApi'
import {
  type JobAIDraftPayload,
  type JobAIDraftRecord,
  useCommitJobAIDraftMutation,
  useCreateJobAIDraftMutation,
  useLazyGetJobAIDraftQuery,
  useRespondToJobAIDraftMutation,
} from '@/store/services/jobAiApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { ArrowLeft, CheckCheck, CircleSlash, FolderCheck, Send } from 'lucide-react'

import styles from './page.module.scss'

type DraftField = keyof Pick<
  JobAIDraftPayload,
  | 'title'
  | 'location'
  | 'location_type'
  | 'salary_min'
  | 'salary_max'
  | 'currency'
  | 'auto_shortlist'
  | 'shortlist_threshold'
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
const ALL_DRAFT_FIELDS: DraftField[] = [
  'title',
  'location',
  'location_type',
  'salary_min',
  'salary_max',
  'currency',
  'auto_shortlist',
  'shortlist_threshold',
  'overview',
  'responsibilities',
  'requirements',
  'preferred_qualifications',
  'benefits',
]

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

  const raw = window.localStorage.getItem(buildLocalCacheKey(draftId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as LocalDraftCache
  } catch {
    window.localStorage.removeItem(buildLocalCacheKey(draftId))
    return null
  }
}

function writeLocalDraftCache(draftId: string, cache: LocalDraftCache) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(buildLocalCacheKey(draftId), JSON.stringify(cache))
}

function clearLocalDraftCache(draftId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(buildLocalCacheKey(draftId))
}

function unique(items: string[]) {
  return Array.from(new Set(items))
}

export default function RecruiterJobAIDraftPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')
  const isManualMode = searchParams.get('mode') === 'manual'

  const [title, setTitle] = useState('')
  const [roughDescription, setRoughDescription] = useState('')
  const [sourceJobId, setSourceJobId] = useState('')
  const [researchSalary, setResearchSalary] = useState(true)
  const [followUpFeedback, setFollowUpFeedback] = useState('')
  const [evaluationEnabled, setEvaluationEnabled] = useState(false)
  const [evaluationDraft, setEvaluationDraft] = useState<EvaluationSchemaDraft>(
    DEFAULT_EVALUATION_SCHEMA_DRAFT,
  )
  const [pageState, setPageState] = useState<PageState>(() => ({
    ...EMPTY_PAGE_STATE,
    loading: Boolean(draftIdFromUrl),
  }))

  const [createDraft, { isLoading: isCreatingDraft }] = useCreateJobAIDraftMutation()
  const [fetchDraft] = useLazyGetJobAIDraftQuery()
  const [respondToDraft, { isLoading: isResponding }] = useRespondToJobAIDraftMutation()
  const [commitDraft, { isLoading: isCommitting }] = useCommitJobAIDraftMutation()
  const [upsertSchema] = useUpsertJobEvaluationSchemaMutation()
  const { data: jobsResp } = useGetCompanyJobsQuery()

  const jobs = jobsResp?.data ?? []

  const isBusy = useMemo(
    () => pageState.loading || pageState.saving || isCreatingDraft || isResponding || isCommitting,
    [isCommitting, isCreatingDraft, isResponding, pageState.loading, pageState.saving],
  )

  function showApiToast(error: unknown, fallback: string) {
    const parsed = parseApiError(error, {}, fallback)
    toast.error(parsed.message)
  }

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

  function getUnlockedFields() {
    return ALL_DRAFT_FIELDS.filter((field) => !pageState.lockedFields.includes(field))
  }

  useEffect(() => {
    if (!draftIdFromUrl) return

    void fetchDraft(draftIdFromUrl)
      .unwrap()
      .then((response) => {
        applyDraftRecord(response.data)
      })
      .catch((error) => {
        setPageState((prev) => ({ ...prev, loading: false }))
        showApiToast(error, 'Unable to load that AI draft right now.')
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
        dirtyFields: unique([...prev.dirtyFields, field]),
      }
    })
  }

  async function handleGenerate() {
    if (!title.trim() && !roughDescription.trim() && !sourceJobId) {
      toast.error('Add a title, description, or choose a previous job before generating.')
      return
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      const response = await createDraft({
        ...(title.trim() && { title: title.trim() }),
        ...(roughDescription.trim() && { rough_description: roughDescription.trim() }),
        ...(sourceJobId && { source_job_id: sourceJobId }),
        research_salary: researchSalary,
        locked_fields: pageState.lockedFields,
      }).unwrap()

      applyDraftRecord(response.data, false)
      syncRouteWithDraftId(response.data.id)
      toast.success('AI draft created.')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'We could not generate a draft right now.')
    }
  }

  async function persistDraft(action: 'save_draft' | 'approve' | 'reject') {
    if (!pageState.draftId || !pageState.draft) return null

    const response = await respondToDraft({
      draftId: pageState.draftId,
      decision: {
        action,
        edited_fields: { ...pageState.draft },
        locked_fields: pageState.lockedFields,
        ...(followUpFeedback.trim() && { feedback: followUpFeedback.trim() }),
      },
    }).unwrap()

    clearLocalDraftCache(pageState.draftId)
    applyDraftRecord(response.data, false)
    return response.data
  }

  async function handleSaveProgress() {
    if (!pageState.draftId || !pageState.draft) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('save_draft')
      toast.success('Draft progress saved.')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to save draft progress right now.')
    }
  }

  async function handleRegenerate(fields: DraftField[], feedback?: string) {
    if (!pageState.draftId || !pageState.draft) return

    const unlockedFields = fields.filter((field) => !pageState.lockedFields.includes(field))
    if (unlockedFields.length === 0) {
      toast.info('Unlock at least one field before asking AI to change it.')
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
          locked_fields: pageState.lockedFields,
          ...((feedback ?? followUpFeedback).trim() && {
            feedback: (feedback ?? followUpFeedback).trim(),
          }),
        },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      applyDraftRecord(response.data, false)
      toast.success('Draft updated.')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to update the draft right now.')
    }
  }

  async function handleGeneralUpdate() {
    if (!pageState.draftId || !pageState.draft) return
    if (!followUpFeedback.trim()) {
      toast.info('Add update instructions first so AI knows what to change.')
      return
    }

    await handleRegenerate(getUnlockedFields(), followUpFeedback)
  }

  async function handleApprove() {
    if (!pageState.draftId || !pageState.draft) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('approve')
      toast.success('Draft approved and saved to your drafts.')
      router.push('/recruiter/jobs?filter=draft')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to approve this draft right now.')
    }
  }

  async function handleDiscard() {
    if (!pageState.draftId || !pageState.draft) return
    if (!window.confirm('Discard this AI draft?')) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('reject')
      toast.success('Draft discarded.')
      router.push('/recruiter/jobs')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to discard this draft right now.')
    }
  }

  async function handlePostJob() {
    if (!pageState.draftId || !pageState.draft) return
    if (evaluationEnabled) {
      const validationMessage = validateEvaluationSchemaDraft(evaluationDraft)
      if (validationMessage) {
        toast.error(validationMessage)
        return
      }
    }

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('save_draft')

      const response = await commitDraft({
        draftId: pageState.draftId,
        payload: { status_override: 'active' },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)

      if (evaluationEnabled) {
        try {
          await upsertSchema({
            jobId: response.data.job.id,
            ...buildEvaluationSchemaPayload(evaluationDraft),
          }).unwrap()
          toast.success(`"${response.data.job.title}" was posted with its evaluation schema.`)
          router.push(`/recruiter/jobs/${response.data.job.id}`)
          return
        } catch {
          toast.warn(
            'Job posted, but the evaluation schema could not be saved. You can add it from the job page.',
          )
          router.push(`/recruiter/jobs/${response.data.job.id}`)
          return
        }
      }

      toast.success(`"${response.data.job.title}" was posted successfully.`)
      router.push('/recruiter/jobs')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to post this job right now.')
    }
  }

  function setMode(nextMode: 'ai' | 'manual') {
    const next = new URLSearchParams(searchParams.toString())
    if (nextMode === 'manual') next.set('mode', 'manual')
    else next.delete('mode')
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false })
  }

  async function handleStartBlank() {
    setPageState((prev) => ({ ...prev, saving: true }))
    try {
      const response = await createDraft({
        title: 'Untitled role',
        rough_description: 'Recruiter will fill in details manually.',
        research_salary: false,
        locked_fields: [],
      }).unwrap()
      applyDraftRecord(response.data, false)
      syncRouteWithDraftId(response.data.id)
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Could not start a blank draft right now.')
    }
  }

  const pageTitle = pageState.draftId
    ? pageState.draft?.title?.trim() || 'Untitled job'
    : 'New job posting'
  const pageSubtitle = pageState.draftId
    ? 'Edit any field, lock what should stay, then publish when it looks right.'
    : isManualMode
      ? 'Start a blank draft and write the job description yourself.'
      : 'Describe the role and AI will draft the job posting for you.'

  return (
    <div className={`dash-content container container--app-shell ${styles.page}`}>
      <Link href="/recruiter/jobs" className={`btn btn--ghost btn--sm ${styles.backLink}`}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Jobs
      </Link>

      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">{pageTitle}</h2>
          <p className="dash-page-header__subtitle">{pageSubtitle}</p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {pageState.draftId ? 'Draft saved' : isBusy ? 'Working…' : 'Not started'}
          </span>
        </div>
      </div>

      {!pageState.draftId ? (
        <div className="team-tabs" role="tablist" aria-label="How to start">
          <button
            type="button"
            role="tab"
            aria-selected={!isManualMode}
            className={`team-tabs__btn ${!isManualMode ? 'team-tabs__btn--active' : ''}`}
            onClick={() => setMode('ai')}
          >
            Use AI assistant
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isManualMode}
            className={`team-tabs__btn ${isManualMode ? 'team-tabs__btn--active' : ''}`}
            onClick={() => setMode('manual')}
          >
            Write it myself
          </button>
        </div>
      ) : null}

      {!isManualMode ? (
        <JobAIAssistant
          title={title}
          roughDescription={roughDescription}
          sourceJobId={sourceJobId}
          researchSalary={researchSalary}
          followUpFeedback={followUpFeedback}
          draftExists={Boolean(pageState.draftId)}
          loading={isBusy}
          jobs={jobs}
          onTitleChange={setTitle}
          onRoughDescriptionChange={setRoughDescription}
          onSourceJobIdChange={setSourceJobId}
          onResearchSalaryChange={setResearchSalary}
          onFollowUpFeedbackChange={setFollowUpFeedback}
          onGenerate={handleGenerate}
          onGeneralUpdate={() => void handleGeneralUpdate()}
        />
      ) : !pageState.draftId ? (
        <section className={styles.startBlank}>
          <h2 className={styles.startBlankTitle}>Start a blank draft</h2>
          <p className={styles.startBlankCopy}>
            We&apos;ll create an empty draft so you can fill in the title, description, and
            requirements field by field. You can switch to AI assistance any time.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleStartBlank()}
            disabled={isBusy}
          >
            <Send size={16} aria-hidden="true" />
            {isBusy ? 'Creating…' : 'Create blank draft'}
          </button>
        </section>
      ) : null}

      {pageState.draftId ? (
        <div className={isManualMode ? styles.singleColumn : 'job-ai-page'}>
          <section className={isManualMode ? styles.singleColumnMain : 'job-ai-page__main'}>
            <JobDraftForm
              draft={pageState.draft}
              dirtyFields={pageState.dirtyFields}
              lockedFields={pageState.lockedFields}
              missingFields={pageState.missingFields}
              disabled={isBusy}
              isLoading={isBusy}
              showAiControls={!isManualMode}
              onFieldChange={handleFieldChange}
              onToggleLock={handleToggleLock}
              onRequestUpdate={(fields, feedback) => void handleRegenerate(fields, feedback)}
            />
            <EvaluationSchemaSetupCard
              enabled={evaluationEnabled}
              onEnabledChange={setEvaluationEnabled}
              onChange={setEvaluationDraft}
              disabled={isBusy}
            />
          </section>

          {!isManualMode ? (
            <aside className="job-ai-page__sidebar">
              <AssumptionsWarnings
                assumptions={pageState.assumptions}
                warnings={pageState.warnings}
                missingFields={pageState.missingFields}
              />
              <SalaryResearchCard research={pageState.salaryResearch} />
            </aside>
          ) : null}
        </div>
      ) : null}

      {pageState.draftId ? (
        <div className={styles.footer}>
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--danger"
            disabled={!pageState.draftId || isBusy}
            onClick={() => void handleDiscard()}
          >
            <CircleSlash size={14} aria-hidden="true" />
            Discard draft
          </button>
          <div className={styles.footerActions}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!pageState.draft || isBusy}
              onClick={() => void handleSaveProgress()}
            >
              <FolderCheck size={14} aria-hidden="true" />
              Save changes
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={!pageState.draftId || isBusy}
              onClick={() => void handleApprove()}
            >
              <CheckCheck size={14} aria-hidden="true" />
              Save &amp; exit
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!pageState.draftId || isBusy}
              onClick={() => void handlePostJob()}
            >
              <Send size={14} aria-hidden="true" />
              {isCommitting ? 'Publishing…' : 'Publish job'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
