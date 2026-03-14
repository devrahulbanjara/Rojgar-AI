'use client'

import { type FormEvent, useState } from 'react'

import type { CreateJobPayload, JobDetail, JobStatus, LocationType } from '@/store/services/jobsApi'
import { X } from 'lucide-react'

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

  return {
    title: form.title,
    ...(form.location && { location: form.location }),
    location_type: form.location_type,
    ...(salary_min !== null && { salary_min }),
    ...(salary_max !== null && { salary_max }),
    currency: form.currency || 'NPR',
    status: form.status,
    ...(form.overview && { overview: form.overview }),
    responsibilities: form.responsibilities,
    requirements: form.requirements,
    preferred_qualifications: form.preferred_qualifications,
    benefits: form.benefits,
  }
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

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...items, trimmed])
    setDraft('')
  }

  return (
    <div className="auth__field">
      <label className="auth__label">{label}</label>
      <div className="job-editor-list__composer">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="auth__input"
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={add}
          disabled={disabled}
        >
          Add
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="job-editor-list">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="job-editor-list__item">
              <span>{item}</span>
              <button
                type="button"
                className="job-editor-list__remove"
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
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max)) {
      nextErrors.salary_min = 'Min salary cannot exceed max.'
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
        <div className="auth__field">
          <label className="auth__label">
            Job Title <span className="auth__required">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className={`auth__input${errors.title ? ' auth__input--error' : ''}`}
            disabled={isLoading}
          />
          {errors.title ? (
            <span className="auth__error-msg" role="alert">
              {errors.title}
            </span>
          ) : null}
        </div>

        <div className="job-editor-form__grid">
          <div className="auth__field">
            <label className="auth__label">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(event) => set('location', event.target.value)}
              placeholder="e.g. Kathmandu, Nepal"
              className="auth__input"
              disabled={isLoading}
            />
          </div>
          <div className="auth__field">
            <label className="auth__label">Work Type</label>
            <select
              value={form.location_type}
              onChange={(event) => set('location_type', event.target.value as LocationType)}
              className="auth__input auth__input--select"
              disabled={isLoading}
            >
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="job-editor-form__grid job-editor-form__grid--salary">
          <div className="auth__field">
            <label className="auth__label">Min Salary</label>
            <input
              type="number"
              value={form.salary_min}
              onChange={(event) => set('salary_min', event.target.value)}
              placeholder="e.g. 60000"
              min={0}
              className={`auth__input${errors.salary_min ? ' auth__input--error' : ''}`}
              disabled={isLoading}
            />
            {errors.salary_min ? (
              <span className="auth__error-msg" role="alert">
                {errors.salary_min}
              </span>
            ) : null}
          </div>
          <div className="auth__field">
            <label className="auth__label">Max Salary</label>
            <input
              type="number"
              value={form.salary_max}
              onChange={(event) => set('salary_max', event.target.value)}
              placeholder="e.g. 90000"
              min={0}
              className="auth__input"
              disabled={isLoading}
            />
          </div>
          <div className="auth__field">
            <label className="auth__label">Currency</label>
            <select
              value={form.currency}
              onChange={(event) => set('currency', event.target.value)}
              className="auth__input auth__input--select"
              disabled={isLoading}
            >
              <option value="NPR">NPR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        <div className="auth__field">
          <label className="auth__label">Status</label>
          <select
            value={form.status}
            onChange={(event) => set('status', event.target.value as JobStatus)}
            className="auth__input auth__input--select"
            disabled={isLoading}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="auth__field">
          <label className="auth__label">
            Job Overview <span className="auth__optional">(optional)</span>
          </label>
          <textarea
            value={form.overview}
            onChange={(event) => set('overview', event.target.value)}
            placeholder="Brief summary of the role and team..."
            rows={4}
            className="auth__textarea"
            disabled={isLoading}
          />
        </div>

        <ListInput
          label="Responsibilities"
          placeholder="Add a responsibility and press Enter..."
          items={form.responsibilities}
          disabled={isLoading}
          onChange={(value) => set('responsibilities', value)}
        />
        <ListInput
          label="Requirements"
          placeholder="Add a requirement and press Enter..."
          items={form.requirements}
          disabled={isLoading}
          onChange={(value) => set('requirements', value)}
        />
        <ListInput
          label="Preferred Qualifications"
          placeholder="Add a preferred qualification and press Enter..."
          items={form.preferred_qualifications}
          disabled={isLoading}
          onChange={(value) => set('preferred_qualifications', value)}
        />
        <ListInput
          label="Benefits"
          placeholder="Add a benefit and press Enter..."
          items={form.benefits}
          disabled={isLoading}
          onChange={(value) => set('benefits', value)}
        />
      </div>

      <div className="job-editor-form__footer">
        {onCancel ? (
          <button
            type="button"
            className="btn btn--ghost btn--danger"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
