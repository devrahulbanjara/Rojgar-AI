'use client'

import { type ReactNode, useState } from 'react'

import type { JobAIDraftPayload } from '@/store/services/jobAiApi'
import { Lock, LockOpen, Plus, X } from 'lucide-react'

import { CompanyJobEditorSkeleton } from '../../_components/CompanyJobsSkeletons'

type DraftField =
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

const CURRENCY_OPTIONS = ['NPR', 'INR', 'USD', 'EUR', 'GBP'] as const

// Only these fields are AI-rewritten in a meaningful way, so only these expose a
// lock toggle. Numeric / dropdown fields the recruiter sets directly don't need locks.
const LOCKABLE_FIELDS: ReadonlySet<DraftField> = new Set<DraftField>([
  'title',
  'salary_min',
  'overview',
  'responsibilities',
  'requirements',
  'preferred_qualifications',
  'benefits',
])

type JobDraftFormProps = {
  draft: JobAIDraftPayload | null
  dirtyFields: string[]
  lockedFields: string[]
  missingFields: string[]
  disabled: boolean
  isLoading?: boolean
  showAiControls?: boolean
  salaryWarning?: ReactNode
  onFieldChange: <K extends DraftField>(field: K, value: JobAIDraftPayload[K]) => void
  onToggleLock: (field: DraftField) => void
}

function hasAny(targets: string[], keys: string[]) {
  return keys.some((key) => targets.includes(key))
}

function FormSection({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="job-ai-section">
      {title ? (
        <div className="job-ai-section__header">
          <h3 className="job-ai-section__title">{title}</h3>
          {description ? <p className="job-ai-section__description">{description}</p> : null}
        </div>
      ) : null}
      <div className="job-ai-section__body">{children}</div>
    </div>
  )
}

function Field({
  label,
  helper,
  fieldKeys,
  lockedFields,
  dirtyFields,
  missingFields,
  disabled,
  showAiControls = true,
  onToggleLock,
  warning,
  children,
}: {
  label: string
  helper?: string
  fieldKeys: DraftField[]
  lockedFields: string[]
  dirtyFields: string[]
  missingFields: string[]
  disabled: boolean
  showAiControls?: boolean
  onToggleLock: (field: DraftField) => void
  warning?: ReactNode
  children: ReactNode
}) {
  const isLocked = hasAny(lockedFields, fieldKeys)
  const isDirty = hasAny(dirtyFields, fieldKeys)
  const isMissing = hasAny(missingFields, fieldKeys)
  const canLock = showAiControls && fieldKeys.some((key) => LOCKABLE_FIELDS.has(key))

  return (
    <div
      className={`job-ai-field${isMissing ? ' job-ai-field--missing' : ''}${
        isLocked ? ' job-ai-field--locked' : ''
      }`}
    >
      <div className="job-ai-field__header">
        <label className="job-ai-label">
          {label}
          {isMissing ? <span className="job-ai-field__missing-dot" aria-label="Missing" /> : null}
          {isDirty && !isLocked ? <span className="job-ai-field__edited-tag">Edited</span> : null}
        </label>
        {warning ? <div className="job-ai-field__warning">{warning}</div> : null}
        {canLock ? (
          <button
            type="button"
            className={`job-ai-field__lock${isLocked ? ' job-ai-field__lock--on' : ''}`}
            aria-pressed={isLocked}
            disabled={disabled}
            onClick={() => onToggleLock(fieldKeys[0])}
            aria-label={isLocked ? `Unlock ${label}` : `Lock ${label} from AI changes`}
            title={isLocked ? `Unlock ${label}` : `Lock ${label} so AI won't change it`}
          >
            {isLocked ? (
              <Lock size={13} aria-hidden="true" />
            ) : (
              <LockOpen size={13} aria-hidden="true" />
            )}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>
        ) : null}
      </div>

      {helper ? <p className="job-ai-field__helper">{helper}</p> : null}

      {children}
    </div>
  )
}

function ListEditor({
  label,
  items,
  disabled,
  onChange,
}: {
  label: string
  items: string[]
  disabled: boolean
  onChange: (items: string[]) => void
}) {
  const [newItem, setNewItem] = useState('')

  function updateItem(index: number, value: string) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  function addItem() {
    const value = newItem.trim()
    if (!value) return
    onChange([...items, value])
    setNewItem('')
  }

  return (
    <div className="job-ai-list-editor">
      {items.length === 0 ? null : (
        <div className="job-ai-list-editor__items">
          {items.map((item, index) => (
            <div className="job-ai-list-editor__row" key={`item-${index}`}>
              <input
                className="job-ai-input job-ai-list-editor__input"
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                disabled={disabled}
              />
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={() => removeItem(index)}
                disabled={disabled}
                aria-label={`Remove item ${index + 1}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="job-ai-list-editor__composer">
        <input
          className="job-ai-input job-ai-list-editor__composer-input"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder={`Add a new ${label.toLowerCase()} item`}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={addItem}
          disabled={disabled}
        >
          <Plus size={14} aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  )
}

export default function JobDraftForm({
  draft,
  dirtyFields,
  lockedFields,
  missingFields,
  disabled,
  isLoading,
  showAiControls = true,
  salaryWarning,
  onFieldChange,
  onToggleLock,
}: JobDraftFormProps) {
  if (isLoading) {
    return (
      <section className="job-ai-card job-ai-form dash-card">
        <div className="job-ai-card__header dash-card__header">
          <div>
            <h2 className="job-ai-card__title dash-card__title">Draft Details</h2>
            <p className="job-ai-card__subtitle dash-card__subtitle">
              AI is currently loading or updating the draft details...
            </p>
          </div>
        </div>
        <div className="job-ai-card__body dash-card__body">
          <CompanyJobEditorSkeleton />
        </div>
      </section>
    )
  }

  if (!draft) {
    return (
      <section className="job-ai-card job-ai-card--placeholder dash-card">
        <div className="job-ai-card__body dash-card__body" style={{ alignItems: 'center' }}>
          <div className="job-ai-empty">
            <h2 className="job-ai-empty__title">No draft yet</h2>
            <p className="job-ai-empty__copy">
              Generate a draft above and the editable job form will appear here.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const fieldProps = {
    lockedFields,
    dirtyFields,
    missingFields,
    disabled,
    showAiControls,
    onToggleLock,
  }

  return (
    <section className="job-ai-card job-ai-form dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h2 className="job-ai-card__title dash-card__title">Draft Details</h2>
          <p className="job-ai-card__subtitle dash-card__subtitle">
            {showAiControls
              ? "Edit any field directly. Lock the ones AI shouldn't change, then use Refine with AI on the right to update sections."
              : 'Fill in the job details below.'}
          </p>
        </div>
      </div>

      <div className="job-ai-card__body dash-card__body">
        <FormSection title="Basics">
          <div className="job-ai-form__grid">
            <Field label="Job title" fieldKeys={['title']} {...fieldProps}>
              <input
                className="job-ai-input"
                value={draft.title}
                onChange={(event) => onFieldChange('title', event.target.value)}
                disabled={disabled}
              />
            </Field>

            <Field label="Location" fieldKeys={['location']} {...fieldProps}>
              <input
                className="job-ai-input"
                value={draft.location ?? ''}
                onChange={(event) => onFieldChange('location', event.target.value || null)}
                disabled={disabled}
              />
            </Field>

            <Field label="Location type" fieldKeys={['location_type']} {...fieldProps}>
              <select
                className="job-ai-input"
                value={draft.location_type}
                onChange={(event) =>
                  onFieldChange(
                    'location_type',
                    event.target.value as JobAIDraftPayload['location_type'],
                  )
                }
                disabled={disabled}
              >
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>

            <Field
              label="Required years of experience"
              fieldKeys={['required_years_of_experience']}
              {...fieldProps}
            >
              <input
                type="number"
                min={0}
                max={50}
                className="job-ai-input"
                value={draft.required_years_of_experience ?? ''}
                onChange={(event) =>
                  onFieldChange(
                    'required_years_of_experience',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="e.g. 3"
                disabled={disabled}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection>
          <Field
            label="Salary range"
            fieldKeys={['salary_min', 'salary_max', 'currency']}
            {...fieldProps}
            warning={salaryWarning}
          >
            <div className="job-ai-form__salary-grid">
              <input
                className="job-ai-input"
                type="number"
                value={draft.salary_min ?? ''}
                onChange={(event) =>
                  onFieldChange(
                    'salary_min',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="Min"
                disabled={disabled}
              />
              <input
                className="job-ai-input"
                type="number"
                value={draft.salary_max ?? ''}
                onChange={(event) =>
                  onFieldChange(
                    'salary_max',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="Max"
                disabled={disabled}
              />
              <select
                className="job-ai-input"
                value={draft.currency ?? 'NPR'}
                onChange={(event) => onFieldChange('currency', event.target.value)}
                disabled={disabled}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </FormSection>

        <FormSection title="AI Evaluation" description="How candidates get scored once they apply.">
          <div className="job-ai-form__grid">
            <Field
              label="Auto-evaluate applications"
              fieldKeys={['auto_shortlist']}
              {...fieldProps}
            >
              <label className="job-ai-checkbox job-ai-checkbox--inline">
                <input
                  type="checkbox"
                  checked={draft.auto_shortlist}
                  onChange={(event) => onFieldChange('auto_shortlist', event.target.checked)}
                  disabled={disabled}
                />
                <span>Score and feedback every new application automatically</span>
              </label>
            </Field>

            <Field label="Shortlist threshold" fieldKeys={['shortlist_threshold']} {...fieldProps}>
              <input
                type="number"
                min={0}
                max={100}
                className="job-ai-input"
                value={draft.shortlist_threshold}
                onChange={(event) =>
                  onFieldChange('shortlist_threshold', Number(event.target.value || 70))
                }
                disabled={disabled}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection>
          <Field label="Overview" fieldKeys={['overview']} {...fieldProps}>
            <textarea
              className="job-ai-textarea"
              rows={8}
              value={draft.overview}
              onChange={(event) => onFieldChange('overview', event.target.value)}
              disabled={disabled}
            />
          </Field>
        </FormSection>

        <FormSection>
          <Field label="Responsibilities" fieldKeys={['responsibilities']} {...fieldProps}>
            <ListEditor
              label="Responsibilities"
              items={draft.responsibilities}
              disabled={disabled}
              onChange={(items) => onFieldChange('responsibilities', items)}
            />
          </Field>

          <Field label="Requirements" fieldKeys={['requirements']} {...fieldProps}>
            <ListEditor
              label="Requirements"
              items={draft.requirements}
              disabled={disabled}
              onChange={(items) => onFieldChange('requirements', items)}
            />
          </Field>

          <Field
            label="Preferred qualifications"
            fieldKeys={['preferred_qualifications']}
            {...fieldProps}
          >
            <ListEditor
              label="Preferred qualifications"
              items={draft.preferred_qualifications}
              disabled={disabled}
              onChange={(items) => onFieldChange('preferred_qualifications', items)}
            />
          </Field>
        </FormSection>

        <FormSection>
          <Field label="Benefits" fieldKeys={['benefits']} {...fieldProps}>
            <ListEditor
              label="Benefits"
              items={draft.benefits}
              disabled={disabled}
              onChange={(items) => onFieldChange('benefits', items)}
            />
          </Field>
        </FormSection>
      </div>
    </section>
  )
}
