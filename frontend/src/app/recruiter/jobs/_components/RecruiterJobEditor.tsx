'use client'

import { type FormEvent, useState } from 'react'

import {
  LIMITS,
  hasDuplicate,
  isFutureDate,
  isSalaryRangeValid,
  nowDatetimeLocalInput,
} from '@/lib/validation'
import type { CreateJobPayload, JobDetail, JobStatus, LocationType } from '@/store/services/jobsApi'
import { Plus, X } from 'lucide-react'

type RecruiterJobEditorProps = {
  initial?: RecruiterJobFormState
  onSubmit: (payload: CreateJobPayload) => Promise<void>
  onCancel?: () => void
  isLoading: boolean
  submitLabel: string
}

export interface RecruiterJobFormState {
  title: string
  location: string
  location_type: LocationType
  salary_min: string
  salary_max: string
  currency: string
  status: JobStatus
  expires_at: string
  auto_shortlist: boolean
  shortlist_threshold: string
  required_years_of_experience: string
  overview: string
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
}

export const EMPTY_JOB_FORM: RecruiterJobFormState = {
  title: '',
  location: '',
  location_type: 'onsite',
  salary_min: '',
  salary_max: '',
  currency: 'NPR',
  status: 'draft',
  expires_at: '',
  auto_shortlist: false,
  shortlist_threshold: '70',
  required_years_of_experience: '',
  overview: '',
  responsibilities: [],
  requirements: [],
  preferred_qualifications: [],
  benefits: [],
}

export function getCreateJobInitialForm(
  companyLocation: string | null | undefined,
): RecruiterJobFormState {
  return {
    ...EMPTY_JOB_FORM,
    location: companyLocation ?? '',
  }
}

export function formFromDetail(detail: JobDetail): RecruiterJobFormState {
  return {
    title: detail.title,
    location: detail.location ?? '',
    location_type: detail.location_type,
    salary_min: detail.salary_min != null ? String(detail.salary_min) : '',
    salary_max: detail.salary_max != null ? String(detail.salary_max) : '',
    currency: detail.currency,
    status: detail.status,
    expires_at: detail.expires_at ? toDateTimeLocalValue(detail.expires_at) : '',
    auto_shortlist: detail.auto_shortlist ?? false,
    shortlist_threshold: String(detail.shortlist_threshold ?? 70),
    required_years_of_experience:
      detail.required_years_of_experience != null
        ? String(detail.required_years_of_experience)
        : '',
    overview: detail.overview ?? '',
    responsibilities: detail.responsibilities ?? [],
    requirements: detail.requirements ?? [],
    preferred_qualifications: detail.preferred_qualifications ?? [],
    benefits: detail.benefits ?? [],
  }
}

export function formToPayload(form: RecruiterJobFormState): CreateJobPayload {
  const salary_min = form.salary_min ? Number(form.salary_min) : null
  const salary_max = form.salary_max ? Number(form.salary_max) : null
  const shortlist_threshold = form.shortlist_threshold ? Number(form.shortlist_threshold) : 70
  const required_yoe = form.required_years_of_experience
    ? Number(form.required_years_of_experience)
    : null
  const expires_at = form.expires_at ? new Date(form.expires_at).toISOString() : undefined

  return {
    title: form.title,
    ...(form.location && { location: form.location }),
    location_type: form.location_type,
    ...(salary_min !== null && { salary_min }),
    ...(salary_max !== null && { salary_max }),
    currency: form.currency || 'NPR',
    status: form.status,
    shortlist_threshold,
    required_years_of_experience: required_yoe,
    ...(expires_at && { expires_at }),
    auto_shortlist: form.auto_shortlist,
    ...(form.overview && { overview: form.overview }),
    responsibilities: form.responsibilities,
    requirements: form.requirements,
    preferred_qualifications: form.preferred_qualifications,
    benefits: form.benefits,
  }
}

function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function ListInput({
  label,
  placeholder,
  items,
  disabled,
  onChange,
}: {
  label: string
  placeholder: string
  items: string[]
  disabled: boolean
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (trimmed.length > LIMITS.listItem) {
      setError(`Too long (max ${LIMITS.listItem} chars)`)
      return
    }
    if (hasDuplicate(items, trimmed)) {
      setError('Already added')
      return
    }
    setError(null)
    onChange([...items, trimmed])
    setDraft('')
  }

  return (
    <div className="job-ai-field job-ai-field--manual">
      <div className="job-ai-field__header">
        <div className="job-ai-field__title-row">
          <label className="job-ai-label">{label}</label>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="job-editor-list">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="job-editor-list__item">
              <input
                type="text"
                value={item}
                onChange={(event) =>
                  onChange(
                    items.map((existingItem, itemIndex) =>
                      itemIndex === index ? event.target.value : existingItem,
                    ),
                  )
                }
                className="job-ai-input job-editor-list__input"
                disabled={disabled}
              />
              <button
                type="button"
                className="btn btn--icon btn--sm job-editor-list__remove"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled}
                aria-label={`Remove "${item}"`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="job-editor-list__composer">
        <input
          type="text"
          value={draft}
          maxLength={LIMITS.listItem}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="job-ai-input job-editor-list__composer-input"
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={add}
          disabled={disabled}
        >
          <Plus size={14} aria-hidden="true" />
          Add
        </button>
      </div>
      {error ? (
        <span className="auth__error-msg" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export default function RecruiterJobEditor({
  initial = EMPTY_JOB_FORM,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: RecruiterJobEditorProps) {
  const [form, setForm] = useState<RecruiterJobFormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof RecruiterJobFormState, string>>>({})

  function set<K extends keyof RecruiterJobFormState>(key: K, value: RecruiterJobFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: Partial<Record<keyof RecruiterJobFormState, string>> = {}
    const title = form.title.trim()
    if (!title) nextErrors.title = 'Title is required.'
    else if (title.length > LIMITS.title) nextErrors.title = `Title too long (max ${LIMITS.title}).`
    if (form.overview && form.overview.length > LIMITS.overview)
      nextErrors.overview = `Overview too long (max ${LIMITS.overview}).`
    if (form.location && form.location.length > LIMITS.location)
      nextErrors.location = `Location too long (max ${LIMITS.location}).`

    if (form.salary_min && Number(form.salary_min) < 0)
      nextErrors.salary_min = 'Min salary cannot be negative.'
    if (form.salary_max && Number(form.salary_max) < 0)
      nextErrors.salary_max = 'Max salary cannot be negative.'
    if (!isSalaryRangeValid(form.salary_min, form.salary_max))
      nextErrors.salary_max = 'Max salary must be greater than or equal to min.'

    if (form.expires_at && !isFutureDate(form.expires_at))
      nextErrors.expires_at = 'Expiry must be in the future.'

    if (form.shortlist_threshold) {
      const n = Number(form.shortlist_threshold)
      if (Number.isNaN(n) || n < 0 || n > 100)
        nextErrors.shortlist_threshold = 'Threshold must be between 0 and 100.'
    }

    if (form.required_years_of_experience) {
      const n = Number(form.required_years_of_experience)
      if (Number.isNaN(n) || n < 0 || n > LIMITS.yearsExperience)
        nextErrors.required_years_of_experience = `Years must be 0–${LIMITS.yearsExperience}.`
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    await onSubmit(formToPayload(form))
  }

  return (
    <form className="job-editor-form" onSubmit={handleSubmit} noValidate>
      <div className="job-editor-form__sections">
        <div className="job-ai-field job-ai-field--manual job-editor-form__field job-editor-form__field--full">
          <label className="job-ai-label">
            Job Title <span className="auth__required">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            maxLength={LIMITS.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className={`job-ai-input${errors.title ? ' auth__input--error' : ''}`}
            disabled={isLoading}
          />
          {errors.title ? (
            <span className="auth__error-msg" role="alert">
              {errors.title}
            </span>
          ) : null}
        </div>

        <div className="job-ai-field job-ai-field--manual">
          <label className="job-ai-label">
            Job Overview <span className="auth__optional">(optional)</span>
          </label>
          <textarea
            value={form.overview}
            maxLength={LIMITS.overview}
            onChange={(event) => set('overview', event.target.value)}
            placeholder="Brief summary of the role and team..."
            rows={6}
            className={`job-ai-textarea${errors.overview ? ' auth__input--error' : ''}`}
            disabled={isLoading}
          />
          {errors.overview ? (
            <span className="auth__error-msg" role="alert">
              {errors.overview}
            </span>
          ) : null}
        </div>

        <div className="job-ai-form__stack">
          <ListInput
            label="Responsibilities"
            placeholder="Add a new responsibility item"
            items={form.responsibilities}
            disabled={isLoading}
            onChange={(value) => set('responsibilities', value)}
          />
          <ListInput
            label="Requirements"
            placeholder="Add a new requirement item"
            items={form.requirements}
            disabled={isLoading}
            onChange={(value) => set('requirements', value)}
          />
          <ListInput
            label="Preferred Qualifications"
            placeholder="Add a new preferred qualification item"
            items={form.preferred_qualifications}
            disabled={isLoading}
            onChange={(value) => set('preferred_qualifications', value)}
          />
          <ListInput
            label="Benefits"
            placeholder="Add a new benefit item"
            items={form.benefits}
            disabled={isLoading}
            onChange={(value) => set('benefits', value)}
          />
        </div>

        <div className="job-ai-form__grid">
          <div className="job-ai-field job-ai-field--manual job-editor-form__field">
            <label className="job-ai-label">Location</label>
            <input
              type="text"
              value={form.location}
              maxLength={LIMITS.location}
              onChange={(event) => set('location', event.target.value)}
              placeholder="e.g. Kathmandu, Nepal"
              className={`job-ai-input${errors.location ? ' auth__input--error' : ''}`}
              disabled={isLoading}
            />
            {errors.location ? (
              <span className="auth__error-msg" role="alert">
                {errors.location}
              </span>
            ) : null}
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__field">
            <label className="job-ai-label">Work Type</label>
            <select
              value={form.location_type}
              onChange={(event) => set('location_type', event.target.value as LocationType)}
              className="job-ai-input"
              disabled={isLoading}
            >
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__field">
            <label className="job-ai-label">
              Expiry Date & Time <span className="auth__optional">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.expires_at}
              min={nowDatetimeLocalInput()}
              onChange={(event) => set('expires_at', event.target.value)}
              className={`job-ai-input${errors.expires_at ? ' auth__input--error' : ''}`}
              disabled={isLoading}
            />
            {errors.expires_at ? (
              <span className="auth__error-msg" role="alert">
                {errors.expires_at}
              </span>
            ) : null}
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__toggle-field">
            <label className="job-editor-toggle" htmlFor="job-auto-shortlist">
              <div className="job-editor-toggle__copy">
                <span className="job-editor-toggle__title">Automatic AI Evaluation</span>
                <span className="job-editor-toggle__description">
                  Generate evaluation scores and feedback for new applications with the reflection
                  workflow.
                </span>
              </div>

              <span className="job-editor-toggle__control">
                <span className="job-editor-toggle__state" aria-hidden="true">
                  {form.auto_shortlist ? 'On' : 'Off'}
                </span>
                <span className="job-editor-toggle__switch">
                  <input
                    id="job-auto-shortlist"
                    type="checkbox"
                    className="job-editor-toggle__input"
                    checked={form.auto_shortlist}
                    onChange={(event) => set('auto_shortlist', event.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="job-editor-toggle__track" aria-hidden="true">
                    <span className="job-editor-toggle__thumb" />
                  </span>
                </span>
              </span>
            </label>
          </div>

          <div className="job-ai-field job-ai-field--manual">
            <label className="job-ai-label" htmlFor="job-shortlist-threshold">
              Shortlist Threshold
            </label>
            <input
              id="job-shortlist-threshold"
              type="number"
              min={0}
              max={100}
              className="job-ai-input"
              value={form.shortlist_threshold}
              onChange={(event) => set('shortlist_threshold', event.target.value)}
              disabled={isLoading}
            />
            <p className="job-ai-help">
              Used when applying agent shortlisting after the job expires.
            </p>
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__field">
            <label className="job-ai-label" htmlFor="job-required-yoe">
              Required Years of Experience <span className="auth__optional">(optional)</span>
            </label>
            <input
              id="job-required-yoe"
              type="number"
              min={0}
              max={50}
              className="job-ai-input"
              value={form.required_years_of_experience}
              onChange={(event) => set('required_years_of_experience', event.target.value)}
              placeholder="e.g. 3"
              disabled={isLoading}
            />
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__salary-field">
            <label className="job-ai-label">Salary Range</label>
            <div className="job-ai-form__salary-grid">
              <input
                type="number"
                value={form.salary_min}
                onChange={(event) => set('salary_min', event.target.value)}
                placeholder="Min salary"
                min={0}
                max={LIMITS.salaryMax}
                className={`job-ai-input${errors.salary_min ? ' auth__input--error' : ''}`}
                disabled={isLoading}
              />
              <input
                type="number"
                value={form.salary_max}
                onChange={(event) => set('salary_max', event.target.value)}
                placeholder="Max salary"
                min={0}
                max={LIMITS.salaryMax}
                className={`job-ai-input${errors.salary_max ? ' auth__input--error' : ''}`}
                disabled={isLoading}
              />
              <select
                value={form.currency}
                onChange={(event) => set('currency', event.target.value)}
                className="job-ai-input"
                disabled={isLoading}
              >
                <option value="NPR">NPR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            {errors.salary_min || errors.salary_max ? (
              <span className="auth__error-msg" role="alert">
                {errors.salary_min || errors.salary_max}
              </span>
            ) : null}
          </div>

          <div className="job-ai-field job-ai-field--manual job-editor-form__field">
            <label className="job-ai-label">Status</label>
            <select
              value={form.status}
              onChange={(event) => set('status', event.target.value as JobStatus)}
              className="job-ai-input"
              disabled={isLoading}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="job-ai-toolbar__actions job-ai-footer-actions job-editor-form__footer">
        {onCancel ? (
          <button
            type="button"
            className="btn btn--ghost btn--danger"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className={`btn btn--primary${isLoading ? ' btn--loading' : ''}`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
