'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import EvaluationSchemaSetupCard, {
  DEFAULT_EVALUATION_SCHEMA_DRAFT,
  type EvaluationSchemaDraft,
  buildEvaluationSchemaPayload,
  validateEvaluationSchemaDraft,
} from '@/app/recruiter/jobs/_components/EvaluationSchemaSetupCard'
import AssumptionsWarnings from '@/app/recruiter/jobs/new/_components/AssumptionsWarnings'
import JobAIAssistant, {
  type RefineTarget,
} from '@/app/recruiter/jobs/new/_components/JobAIAssistant'
import JobDraftForm from '@/app/recruiter/jobs/new/_components/JobDraftForm'
import SalaryResearchCard from '@/app/recruiter/jobs/new/_components/SalaryResearchCard'
import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
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
import { AlertTriangle, ArrowLeft, CircleSlash, FolderCheck, Send } from 'lucide-react'

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
  | 'required_years_of_experience'
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
  'required_years_of_experience',
  'overview',
  'responsibilities',
  'requirements',
  'preferred_qualifications',
  'benefits',
]

const EMPTY_MANUAL_DRAFT: JobAIDraftPayload = {
  title: '',
  location: null,
  location_type: 'onsite',
  salary_min: null,
  salary_max: null,
  currency: 'USD',
  status: 'draft',
  auto_shortlist: false,
  shortlist_threshold: 70,
  required_years_of_experience: null,
  overview: '',
  responsibilities: [],
  requirements: [],
  preferred_qualifications: [],
  benefits: [],
  assumptions: [],
  missing_fields: [],
  warnings: [],
}

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
  const [refineTarget, setRefineTarget] = useState<RefineTarget>('all')
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

  const isThinking = pageState.status === 'drafting'

  const thinkingSteps = useMemo(
    () => [
      'Reading your brief',
      'Studying your company context',
      researchSalary ? 'Researching salary benchmarks' : 'Calibrating role expectations',
      'Drafting the overview',
      'Outlining responsibilities',
      'Shaping requirements & qualifications',
      'Polishing tone and structure',
      'Almost there',
    ],
    [researchSalary],
  )

  const [thinkingStepIndex, setThinkingStepIndex] = useState(0)

  useEffect(() => {
    if (!isThinking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThinkingStepIndex(0)
      return
    }
    const id = setInterval(() => {
      setThinkingStepIndex((idx) => Math.min(idx + 1, thinkingSteps.length - 1))
    }, 4000)
    return () => clearInterval(id)
  }, [isThinking, thinkingSteps.length])

  const isBusy = useMemo(
    () => pageState.loading || pageState.saving || isCreatingDraft || isResponding || isCommitting,
    [isCommitting, isCreatingDraft, isResponding, pageState.loading, pageState.saving],
  )

  function showApiToast(error: unknown, fallback: string) {
    const parsed = parseApiError(error, {}, fallback)
    notify.error(parsed.message)
  }

  const syncRouteWithDraftId = useCallback(
    (draftId: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('draftId', draftId)
      router.replace(`${pathname}?${next.toString()}`)
    },
    [pathname, router, searchParams],
  )

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

  useEffect(() => {
    if (pageState.status !== 'drafting' || !pageState.draftId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetchDraft(pageState.draftId!).unwrap()
        if (response.data.status === 'failed') {
          setPageState((prev) => ({ ...prev, loading: false, saving: false }))
          notify.error('AI draft generation failed. Please try again.')
          clearInterval(interval)
        } else if (response.data.status !== 'drafting') {
          applyDraftRecord(response.data, false)
          syncRouteWithDraftId(response.data.id)
          clearInterval(interval)
        }
      } catch {
        // ignore polling errors
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [pageState.draftId, pageState.status, fetchDraft, syncRouteWithDraftId])

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
      notify.error('Add a title, description, or choose a previous job before generating.')
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

      const draftId = response.data.id

      if (response.data.status === 'drafting') {
        setPageState((prev) => ({
          ...prev,
          draftId,
          threadId: response.data.thread_id,
          status: 'drafting',
          loading: true,
          saving: false,
        }))
        syncRouteWithDraftId(draftId)
        notify.success('AI draft generation started...')
      } else {
        applyDraftRecord(response.data, false)
        syncRouteWithDraftId(draftId)
        notify.success('AI draft created.')
      }
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

  async function handleSaveDraft() {
    if (!pageState.draftId || !pageState.draft) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('save_draft')
      notify.success('Draft saved.')
      router.push('/recruiter/jobs?filter=draft')
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to save draft right now.')
    }
  }

  async function handleGeneralUpdate() {
    if (!pageState.draftId || !pageState.draft) return
    if (!followUpFeedback.trim()) {
      notify.info('Add update instructions first so AI knows what to change.')
      return
    }

    const targetFields: DraftField[] =
      refineTarget === 'all' ? ALL_DRAFT_FIELDS : [refineTarget as DraftField]

    const unlockedFields = targetFields.filter((field) => !pageState.lockedFields.includes(field))
    if (unlockedFields.length === 0) {
      notify.info(
        refineTarget === 'all'
          ? 'Every field is locked — unlock at least one before asking AI to change it.'
          : 'That section is locked. Unlock it first or pick a different target.',
      )
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
          feedback: followUpFeedback.trim(),
        },
      }).unwrap()

      clearLocalDraftCache(pageState.draftId)
      applyDraftRecord(response.data, false)
      setFollowUpFeedback('')
      notify.success(
        refineTarget === 'all' ? 'Draft updated.' : `${refineTarget.replace('_', ' ')} updated.`,
      )
    } catch (error) {
      setPageState((prev) => ({ ...prev, saving: false }))
      showApiToast(error, 'Unable to update the draft right now.')
    }
  }

  async function handleDiscard() {
    if (!pageState.draftId || !pageState.draft) return
    if (!window.confirm('Discard this AI draft?')) return

    setPageState((prev) => ({ ...prev, saving: true }))

    try {
      await persistDraft('reject')
      notify.success('Draft discarded.')
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
        notify.error(validationMessage)
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
          notify.success(`"${response.data.job.title}" was posted with its evaluation schema.`)
          router.push(`/recruiter/jobs/${response.data.job.id}`)
          return
        } catch {
          notify.warning(
            'Job posted, but the evaluation schema could not be saved. You can add it from the job page.',
          )
          router.push(`/recruiter/jobs/${response.data.job.id}`)
          return
        }
      }

      notify.success(`"${response.data.job.title}" was posted successfully.`)
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
        manual: true,
        research_salary: false,
        locked_fields: [],
      }).unwrap()
      const seeded: JobAIDraftRecord = {
        ...response.data,
        latest_draft: response.data.latest_draft ?? { ...EMPTY_MANUAL_DRAFT },
      }
      applyDraftRecord(seeded, false)
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

      {isThinking ? (
        <section className={styles.thinking} aria-live="polite" aria-busy="true">
          <div className={styles.thinkingOrb}>
            <div className={styles.thinkingOrbCore} />
          </div>
          <h3 className={styles.thinkingTitle}>AI is drafting your job</h3>
          <p className={styles.thinkingStep}>
            <span>{thinkingSteps[thinkingStepIndex]}</span>
            <span className={styles.thinkingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
          <p className={styles.thinkingHint}>
            This usually takes 20–60 seconds. You can leave this page and return — your draft will
            be waiting under <Link href="/recruiter/jobs?filter=draft">Drafts</Link>.
          </p>
        </section>
      ) : null}

      {!isThinking && !pageState.draftId ? (
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

      {!isThinking && !isManualMode ? (
        <JobAIAssistant
          title={title}
          roughDescription={roughDescription}
          sourceJobId={sourceJobId}
          researchSalary={researchSalary}
          followUpFeedback={followUpFeedback}
          refineTarget={refineTarget}
          draftExists={Boolean(pageState.draftId)}
          loading={isBusy}
          jobs={jobs}
          onTitleChange={setTitle}
          onRoughDescriptionChange={setRoughDescription}
          onSourceJobIdChange={setSourceJobId}
          onResearchSalaryChange={setResearchSalary}
          onFollowUpFeedbackChange={setFollowUpFeedback}
          onRefineTargetChange={setRefineTarget}
          onGenerate={handleGenerate}
          onGeneralUpdate={() => void handleGeneralUpdate()}
        />
      ) : !isThinking && !pageState.draftId ? (
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

      {!isThinking && pageState.draftId ? (
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
              salaryWarning={
                pageState.salaryResearch?.insufficient_evidence ? (
                  <>
                    <AlertTriangle size={12} />
                    Limited evidence — treat as directional
                  </>
                ) : undefined
              }
              onFieldChange={handleFieldChange}
              onToggleLock={handleToggleLock}
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
                warnings={pageState.warnings.filter(
                  (w) =>
                    !w.toLowerCase().includes('salary') && !w.toLowerCase().includes('evidence'),
                )}
                missingFields={pageState.missingFields}
              />
              <SalaryResearchCard research={pageState.salaryResearch} />
            </aside>
          ) : null}
        </div>
      ) : null}

      {!isThinking && pageState.draftId ? (
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
              className="btn btn--secondary btn--sm"
              disabled={!pageState.draft || isBusy}
              onClick={() => void handleSaveDraft()}
            >
              <FolderCheck size={14} aria-hidden="true" />
              Save as draft
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
