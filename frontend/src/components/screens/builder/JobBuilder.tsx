'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  AssistantError,
  CAPABILITIES,
  type DraftFields,
  EMPLOYMENT_TYPES,
  type EmploymentType,
  JOB_CATEGORIES,
  type Job,
  type JobCategory,
  type JobInput,
  type JobQuestion,
  type JobTemplate,
  WORK_TYPES,
  type WorkType,
  getJobTemplates,
  loadDraft,
  protectedGroundWarning,
  streamJobDraft,
  suggestMustHaves,
  useGetJobQuery,
  useSaveJobMutation,
} from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'
import { addDays, format } from 'date-fns'

import { AiGlow, AiSpark, AiText } from '@/components/app/Ai'
import { PageContainer } from '@/components/app/AppShell'
import { BuilderLayout } from '@/components/app/BuilderLayout'
import { ErrorState } from '@/components/app/Feedback'
import { FormField } from '@/components/app/FormField'
import { PageHeader } from '@/components/app/PageHeader'
import { PlusIcon, XIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import { GetApplicantsSheet } from '../job/GetApplicantsSheet'
import { MustHaveChips, SuggestButton } from './MustHaveChips'

type Form = Omit<JobInput, 'id' | 'status'>

const EMPTY: Form = {
  title: '',
  location: '',
  work_type: 'onsite',
  employment_type: 'full_time',
  category: null,
  salary_min: null,
  salary_max: null,
  currency: 'NPR',
  description: '',
  must_haves: [],
  nice_to_haves: [],
  questions: [],
  closes_at: null,
}

const EXAMPLES = [
  'Staff nurse for our hospital in Pokhara',
  'Hotel receptionist in Thamel, English required',
  'Accountant, CA inter, Kathmandu',
]

const SECTIONS = [
  { id: 'describe', label: 'The job' },
  { id: 'must-haves', label: 'Must-haves' },
  { id: 'questions', label: 'Questions' },
  { id: 'publish', label: 'Publish' },
] as const

const DESCRIPTION_MAX = 5000

function fromJob(job: Job): Form {
  return {
    title: job.title,
    location: job.location ?? '',
    work_type: job.work_type,
    employment_type: job.employment_type ?? 'full_time',
    category: job.category,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    currency: job.currency,
    description: job.description,
    must_haves: job.must_haves,
    nice_to_haves: job.nice_to_haves,
    questions: job.questions,
    closes_at: job.closes_at,
  }
}

function applyDraft(form: Form, draft: DraftFields): Form {
  const next = { ...form }
  for (const [key, value] of Object.entries(draft) as [keyof DraftFields, unknown][]) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && !value.length) continue
    ;(next as Record<string, unknown>)[key] = value
  }
  return next
}

function useRotatingExample() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % EXAMPLES.length), 3500)
    return () => window.clearInterval(timer)
  }, [])
  return EXAMPLES[index]
}

function toNumber(value: string): number | null {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

function BuilderSkeleton() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-4 w-28" />
          {SECTIONS.map((s) => (
            <Skeleton key={s.id} className="h-9 w-full rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-5 rounded-xl border bg-card p-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </PageContainer>
  )
}

/** Post a job / edit a job: one page, autosaved while it's a draft. */
export function JobBuilder({
  jobId: initialJobId,
  draftId,
}: {
  jobId?: string
  draftId?: string | null
}) {
  const router = useRouter()
  const existing = useGetJobQuery(initialJobId ?? '', { skip: !initialJobId })
  const [saveJob] = useSaveJobMutation()

  const [jobId, setJobId] = useState<string | null>(initialJobId ?? null)
  const [status, setStatus] = useState<Job['status']>('draft')
  const [form, setForm] = useState<Form>(EMPTY)
  const [loaded, setLoaded] = useState(!initialJobId)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [brief, setBrief] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [templates, setTemplates] = useState<JobTemplate[]>([])
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description' | 'salary', string>>>(
    {},
  )
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState<Job | null>(null)
  const [current, setCurrent] = useState(0)
  const [closesOn, setClosesOn] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const example = useRotatingExample()
  const saveChain = useRef<Promise<unknown>>(Promise.resolve())
  const [assistantDraftId, setAssistantDraftId] = useState<string | null>(draftId ?? null)
  const [reply, setReply] = useState<{ text: string; followUp: boolean } | null>(null)
  const [assistantError, setAssistantError] = useState<string | null>(null)

  // Load the job being edited once.
  useEffect(() => {
    if (!existing.data || loaded) return
    setForm(fromJob(existing.data))
    setStatus(existing.data.status)
    if (existing.data.closes_at && existing.data.status !== 'closed')
      setClosesOn(format(new Date(existing.data.closes_at), 'yyyy-MM-dd'))
    setLoaded(true)
  }, [existing.data, loaded])

  // "Continue" on a saved assistant draft from the Jobs list.
  useEffect(() => {
    if (!draftId) return
    void loadDraft(draftId).then((draft) => {
      if (draft) {
        setForm((f) => applyDraft(f, draft))
        setDirty(true)
      }
    })
  }, [draftId])

  useEffect(() => {
    void getJobTemplates(form.category).then(setTemplates)
  }, [form.category])

  const update = useCallback(<K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }, [])

  const save = useCallback(
    async (extra: Partial<JobInput> = {}) => {
      const run = async () => {
        setSaving(true)
        try {
          const saved = await saveJob({
            ...form,
            ...extra,
            ...(jobId ? { id: jobId } : {}),
          }).unwrap()
          if (!jobId) {
            setJobId(saved.id)
            window.history.replaceState(null, '', `/recruiter/jobs/${saved.id}/edit`)
          }
          setSavedAt(new Date())
          setStatus(saved.status)
          return saved
        } finally {
          setSaving(false)
        }
      }
      const next = saveChain.current.then(run, run)
      saveChain.current = next.catch(() => undefined)
      return next
    },
    [form, jobId, saveJob],
  )

  // Autosave drafts a moment after typing stops.
  useEffect(() => {
    if (!dirty || status !== 'draft' || drafting) return
    if (!form.title.trim() && !form.description.trim()) return
    const timer = window.setTimeout(() => {
      setDirty(false)
      save().catch(() => notify.error("Couldn't save the draft. Check your connection."))
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [dirty, drafting, form, save, status])

  // Highlight the section in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setCurrent(SECTIONS.findIndex((s) => s.id === visible.target.id))
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [loaded])

  async function fillFromBrief() {
    if (!brief.trim() || drafting) return
    setDrafting(true)
    setDraftText('')
    setReply(null)
    setAssistantError(null)
    try {
      const turn = await streamJobDraft(
        {
          message: brief,
          draft_id: assistantDraftId,
          draft: dirty || jobId ? { ...form, location: form.location || null } : undefined,
        },
        { onToken: (text) => setDraftText((t) => t + text) },
      )
      setAssistantDraftId(turn.draft_id)
      setForm((f) => {
        const next = applyDraft(f, turn.draft)
        if (!next.must_haves.length) next.must_haves = suggestMustHaves(next.description)
        return next
      })
      setReply(turn.reply ? { text: turn.reply, followUp: turn.follow_up } : null)
      setBrief('')
      setDirty(true)
    } catch (error) {
      setAssistantError(
        error instanceof AssistantError
          ? error.message
          : "Couldn't fill it in. Write the details below instead.",
      )
    } finally {
      setDrafting(false)
    }
  }

  function pickTemplate(id: string) {
    const template = templates.find((t) => t.id === id)
    if (!template) return
    setForm((f) => ({
      ...f,
      title: f.title || template.title,
      category: f.category ?? template.category,
      must_haves: template.must_haves.slice(0, 6),
      questions: template.questions.slice(0, 3),
    }))
    setDirty(true)
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.title.trim()) next.title = 'Add a job title.'
    if (form.description.trim().length < 20) next.description = 'Describe the job in a few lines.'
    if (form.salary_min && form.salary_max && form.salary_min > form.salary_max)
      next.salary = 'The minimum is higher than the maximum.'
    setErrors(next)
    if (Object.keys(next).length) {
      document.getElementById('describe')?.scrollIntoView({ behavior: 'smooth' })
      return false
    }
    return true
  }

  async function publish() {
    if (!validate()) return
    const closes = new Date(`${closesOn}T23:59:00`)
    if (Number.isNaN(closes.getTime()) || closes.getTime() <= Date.now()) {
      notify.error('Pick a closing date in the future.')
      return
    }
    setPublishing(true)
    try {
      const saved = await save({ status: 'open', closes_at: closes.toISOString() })
      setDirty(false)
      if (status === 'draft') setPublished(saved)
      else {
        notify.success('Changes saved')
        router.push(`/recruiter/jobs/${saved.id}`)
      }
    } catch {
      notify.error("Couldn't publish. Try again.")
    } finally {
      setPublishing(false)
    }
  }

  const steps = useMemo(
    () => [
      {
        id: 'describe',
        label: 'The job',
        complete: !!form.title.trim() && form.description.trim().length >= 20,
      },
      { id: 'must-haves', label: 'Must-haves', complete: form.must_haves.length >= 3 },
      { id: 'questions', label: 'Questions', complete: form.questions.length > 0 },
      { id: 'publish', label: 'Publish', complete: status === 'open' },
    ],
    [form, status],
  )

  if (initialJobId && existing.isLoading) return <BuilderSkeleton />
  if (initialJobId && (existing.isError || (!existing.data && !existing.isLoading))) {
    return (
      <PageContainer>
        <ErrorState onRetry={() => void existing.refetch()} retrying={existing.isFetching}>
          Couldn&apos;t load this job.
        </ErrorState>
      </PageContainer>
    )
  }

  const isNew = !initialJobId
  const live = status !== 'draft'
  const protectedCount = form.must_haves.filter((m) => protectedGroundWarning(m)).length

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[
          { label: 'Jobs', href: '/recruiter/jobs' },
          ...(jobId && !isNew
            ? [{ label: form.title || 'Job', href: `/recruiter/jobs/${jobId}` }]
            : []),
          { label: isNew ? 'Post a job' : 'Edit' },
        ]}
        title={isNew ? 'Post a job' : `Edit ${form.title || 'job'}`}
      />
      <BuilderLayout
        title="Job post"
        steps={steps}
        current={current}
        onStepChange={(index) =>
          document.getElementById(SECTIONS[index].id)?.scrollIntoView({ behavior: 'smooth' })
        }
        savedAt={live ? null : savedAt}
        saving={!live && saving}
        showStepCount={false}
        showPrevious={false}
        onNext={() => void publish()}
        nextLabel={live ? 'Save changes' : 'Publish'}
        nextLoading={publishing}
      >
        <section id="describe" className="flex scroll-mt-24 flex-col gap-5">
          <h2 className="font-heading text-base font-semibold">The job</h2>
          {status === 'draft' ? (
            <div className="flex flex-col gap-2">
              {reply?.followUp ? (
                <p className="flex items-start gap-2 text-sm font-medium">
                  <AiSpark className="mt-0.5" />
                  {reply.text}
                </p>
              ) : null}
              <FormField id="brief" label={reply?.followUp ? 'Your answer' : 'Describe the job'}>
                <Textarea
                  id="brief"
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault()
                      void fillFromBrief()
                    }
                  }}
                  placeholder={reply?.followUp ? '' : example}
                  rows={3}
                  className="bg-background"
                />
              </FormField>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => void fillFromBrief()}
                  disabled={!brief.trim() || drafting}
                >
                  <AiSpark active={drafting} />
                  Fill in the form
                </Button>
                {drafting ? (
                  <AiText className="line-clamp-1 text-sm">
                    {draftText ? draftText.slice(-80) : 'Reading your notes…'}
                  </AiText>
                ) : reply && !reply.followUp ? (
                  <p className="text-sm text-muted-foreground">{reply.text}</p>
                ) : null}
              </div>
              {assistantError ? <p className="text-sm text-destructive">{assistantError}</p> : null}
            </div>
          ) : null}

          <AiGlow active={drafting} className="-m-2 p-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="title" label="Job title" error={errors.title}>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(event) => update('title', event.target.value)}
                    aria-invalid={!!errors.title}
                    placeholder="Staff nurse"
                  />
                </FormField>
              </div>
              <FormField id="category" label="Category">
                <Select
                  value={form.category ?? ''}
                  onValueChange={(value) => update('category', value as JobCategory)}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="employment" label="Employment type">
                <Select
                  value={form.employment_type ?? 'full_time'}
                  onValueChange={(value) => update('employment_type', value as EmploymentType)}
                >
                  <SelectTrigger id="employment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="location" label="Location">
                <Input
                  id="location"
                  value={form.location ?? ''}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Pokhara"
                />
              </FormField>
              <FormField id="work-type" label="Where they work">
                <Select
                  value={form.work_type}
                  onValueChange={(value) => update('work_type', value as WorkType)}
                >
                  <SelectTrigger id="work-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField id="salary-min" label="Salary per month (NPR)" error={errors.salary}>
                <div className="flex items-center gap-2">
                  <Input
                    id="salary-min"
                    inputMode="numeric"
                    value={form.salary_min?.toLocaleString() ?? ''}
                    onChange={(event) => update('salary_min', toNumber(event.target.value))}
                    placeholder="From"
                    aria-invalid={!!errors.salary}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    inputMode="numeric"
                    value={form.salary_max?.toLocaleString() ?? ''}
                    onChange={(event) => update('salary_max', toNumber(event.target.value))}
                    placeholder="To"
                    aria-label="Salary to"
                    aria-invalid={!!errors.salary}
                  />
                </div>
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  id="description"
                  label="Description"
                  error={errors.description}
                  aside={
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {form.description.length.toLocaleString()} /{' '}
                      {DESCRIPTION_MAX.toLocaleString()}
                    </span>
                  }
                >
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      update('description', event.target.value.slice(0, DESCRIPTION_MAX))
                    }
                    rows={8}
                    aria-invalid={!!errors.description}
                    placeholder="What they will do, the hours, and what you offer."
                  />
                </FormField>
              </div>
            </div>
          </AiGlow>
        </section>

        <section id="must-haves" className="flex scroll-mt-24 flex-col gap-3 border-t pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-semibold">Must-haves</h2>
            <SuggestButton
              disabled={form.description.trim().length < 20}
              onClick={() => {
                const suggestions = suggestMustHaves(form.description)
                if (!suggestions.length) {
                  notify.info('Nothing to suggest yet. Add them yourself.')
                  return
                }
                update('must_haves', suggestions)
              }}
            />
          </div>
          {templates.length ? (
            <Select value="" onValueChange={pickTemplate}>
              <SelectTrigger className="w-full sm:w-72" aria-label="Start from a template">
                <SelectValue placeholder="Start from a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <MustHaveChips
            label="Must-haves"
            value={form.must_haves}
            onChange={(value) => update('must_haves', value)}
          />
          {protectedCount === 0 && form.must_haves.length > 0 && form.must_haves.length < 3 ? (
            <p className="text-xs text-muted-foreground">Add at least 3.</p>
          ) : null}
        </section>

        <section id="questions" className="flex scroll-mt-24 flex-col gap-3 border-t pt-6">
          <h2 className="font-heading text-base font-semibold">
            Questions{' '}
            <span className="font-sans text-sm font-normal text-muted-foreground">optional</span>
          </h2>
          <QuestionsEditor
            value={form.questions}
            onChange={(value) => update('questions', value)}
          />
        </section>

        <section id="publish" className="flex scroll-mt-24 flex-col gap-3 border-t pt-6">
          <h2 className="font-heading text-base font-semibold">Publish</h2>
          <FormField id="closes" label="Applications close on">
            <Input
              id="closes"
              type="date"
              value={closesOn}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={(event) => setClosesOn(event.target.value)}
              className="w-full sm:w-56"
            />
          </FormField>
        </section>
      </BuilderLayout>

      {published ? (
        <GetApplicantsSheet
          job={published}
          open
          onOpenChange={(open) => {
            if (!open) router.push(`/recruiter/jobs/${published.id}`)
          }}
        />
      ) : null}
    </PageContainer>
  )
}

function QuestionsEditor({
  value,
  onChange,
}: {
  value: JobQuestion[]
  onChange: (value: JobQuestion[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {value.map((question, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={question.label}
            onChange={(event) =>
              onChange(value.map((q, i) => (i === index ? { ...q, label: event.target.value } : q)))
            }
            aria-label={`Question ${index + 1}`}
            placeholder="When can you start?"
          />
          {CAPABILITIES.questionTypes ? (
            <Select
              value={question.type}
              onValueChange={(type) =>
                onChange(
                  value.map((q, i) =>
                    i === index ? { ...q, type: type as JobQuestion['type'] } : q,
                  ),
                )
              }
            >
              <SelectTrigger className="w-36 shrink-0" aria-label="Answer type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short_text">Short answer</SelectItem>
                <SelectItem value="yes_no">Yes or no</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <IconButton
            label={`Remove question ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <XIcon />
          </IconButton>
        </div>
      ))}
      {value.length < 3 ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...value, { label: '', type: 'short_text', required: true }])}
        >
          <PlusIcon />
          Add a question
        </Button>
      ) : null}
    </div>
  )
}
