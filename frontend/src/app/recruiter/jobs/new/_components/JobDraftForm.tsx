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
  | 'overview'
  | 'responsibilities'
  | 'requirements'
  | 'preferred_qualifications'
  | 'benefits'

const CURRENCY_OPTIONS = ['NPR', 'INR', 'USD', 'EUR', 'GBP'] as const

type JobDraftFormProps = {
  draft: JobAIDraftPayload | null
  dirtyFields: string[]
  lockedFields: string[]
  missingFields: string[]
  disabled: boolean
  isLoading?: boolean
  onFieldChange: <K extends DraftField>(field: K, value: JobAIDraftPayload[K]) => void
  onToggleLock: (field: DraftField) => void
  onRequestUpdate: (fields: DraftField[], feedback: string) => void
}

function hasAny(targets: string[], keys: string[]) {
  return keys.some((key) => targets.includes(key))
}

function FieldChrome({
  label,
  helper,
  showHelper = true,
  fieldKeys,
  lockedFields,
  dirtyFields,
  missingFields,
  disabled,
  onToggleLock,
  onRequestUpdate,
  children,
}: {
  label: string
  helper: string
  showHelper?: boolean
  fieldKeys: DraftField[]
  lockedFields: string[]
  dirtyFields: string[]
  missingFields: string[]
  disabled: boolean
  onToggleLock: (field: DraftField) => void
  onRequestUpdate: (fields: DraftField[], feedback: string) => void
  children: ReactNode
}) {
  const [instruction, setInstruction] = useState('')
  const [showInstruction, setShowInstruction] = useState(false)
  const isLocked = hasAny(lockedFields, fieldKeys)
  const isDirty = hasAny(dirtyFields, fieldKeys)
  const isMissing = hasAny(missingFields, fieldKeys)

  return (
    <div className={`job-ai-field${isMissing ? ' job-ai-field--missing' : ''}`}>
      <div className="job-ai-field__header">
        <div className="job-ai-field__title-row">
          <label className="job-ai-label">{label}</label>
          <button
            type="button"
            className={`job-ai-field__lock-btn${isLocked ? ' job-ai-field__lock-btn--active' : ''}`}
            disabled={disabled}
            onClick={() => onToggleLock(fieldKeys[0])}
            aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
            title={isLocked ? `Unlock ${label}` : `Lock ${label}`}
          >
            {isLocked ? (
              <Lock size={15} aria-hidden="true" />
            ) : (
              <LockOpen size={15} aria-hidden="true" />
            )}
          </button>
          <div className="job-ai-field__badges">
            {isLocked ? (
              <span className="job-ai-field__label job-ai-field__label--locked">
                <Lock size={10} aria-hidden="true" />
                Locked
              </span>
            ) : null}
            {isDirty ? (
              <span className="job-ai-field__label job-ai-field__label--edited">Edited</span>
            ) : null}
            {isMissing ? (
              <span className="job-ai-field__label job-ai-field__label--missing">Missing</span>
            ) : null}
          </div>
        </div>
      </div>

      {showHelper ? <p className="job-ai-field__helper">{helper}</p> : null}

      {children}

      <div className="job-ai-assistant__toggle job-ai-field__toggle">
        <label className="job-ai-checkbox" htmlFor={`field-feedback-toggle-${fieldKeys[0]}`}>
          <input
            id={`field-feedback-toggle-${fieldKeys[0]}`}
            type="checkbox"
            checked={showInstruction}
            onChange={(event) => setShowInstruction(event.target.checked)}
            disabled={disabled || isLocked}
          />
          <span>Any feedback for AI to modify this field?</span>
        </label>
      </div>

      {showInstruction ? (
        <div
          className="job-ai-instruction"
          style={{ animation: 'content-fade-up 280ms ease both' }}
        >
          <label className="job-ai-label" htmlFor={`field-feedback-${fieldKeys[0]}`}>
            Tell AI what to change in this field
          </label>
          <textarea
            id={`field-feedback-${fieldKeys[0]}`}
            className="job-ai-textarea"
            rows={3}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder={`Example: ${helper}`}
            disabled={disabled || isLocked}
          />
          <div className="job-ai-field__actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={disabled || isLocked || !instruction.trim()}
              onClick={() => {
                onRequestUpdate(fieldKeys, instruction.trim())
                setInstruction('')
                setShowInstruction(false)
              }}
            >
              Send to AI
            </button>
          </div>
        </div>
      ) : null}
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
                className="job-ai-list-editor__remove"
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
          className="job-ai-list-editor__add"
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
  onFieldChange,
  onToggleLock,
  onRequestUpdate,
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

  return (
    <section className="job-ai-card job-ai-form dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h2 className="job-ai-card__title dash-card__title">Draft Details</h2>
          <p className="job-ai-card__subtitle dash-card__subtitle">
            Edit directly, lock what must stay fixed, then send field-specific instructions to AI.
          </p>
        </div>
      </div>

      <div className="job-ai-card__body dash-card__body">
        <div className="job-ai-form__grid">
          <FieldChrome
            label="Title"
            helper="Make the title more specific for the actual seniority and team."
            fieldKeys={['title']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <input
              className="job-ai-input"
              value={draft.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              disabled={disabled}
            />
          </FieldChrome>

          <FieldChrome
            label="Location"
            helper="Clarify the city, country, or whether the role should remain location-flexible."
            fieldKeys={['location']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <input
              className="job-ai-input"
              value={draft.location ?? ''}
              onChange={(event) => onFieldChange('location', event.target.value || null)}
              disabled={disabled}
            />
          </FieldChrome>

          <FieldChrome
            label="Location Type"
            helper="Change between on-site, remote, or hybrid while keeping the rest of the job intact."
            fieldKeys={['location_type']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
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
          </FieldChrome>

          <FieldChrome
            label="Automatic AI Screening"
            helper="Turn this on when each new application should be screened automatically right after submission."
            fieldKeys={['auto_shortlist']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <label className="job-ai-checkbox">
              <input
                type="checkbox"
                checked={draft.auto_shortlist}
                onChange={(event) => onFieldChange('auto_shortlist', event.target.checked)}
                disabled={disabled}
              />
              <span>
                Automatically generate screening scores and feedback for each new application
              </span>
            </label>
          </FieldChrome>

          <FieldChrome
            label="Shortlist Threshold"
            helper="Set the score threshold used later when applying AI shortlisting decisions."
            fieldKeys={['shortlist_threshold']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
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
          </FieldChrome>

          <FieldChrome
            label="Salary Range"
            helper="Adjust the salary range and currency using realistic recruiter-friendly language."
            fieldKeys={['salary_min', 'salary_max', 'currency']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
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
                placeholder="Min salary"
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
                placeholder="Max salary"
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
          </FieldChrome>
        </div>

        <FieldChrome
          label="Overview"
          helper="Shorten this overview, improve clarity, or make it stronger for the intended audience."
          fieldKeys={['overview']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRequestUpdate={onRequestUpdate}
        >
          <textarea
            className="job-ai-textarea"
            rows={6}
            value={draft.overview}
            onChange={(event) => onFieldChange('overview', event.target.value)}
            disabled={disabled}
          />
        </FieldChrome>

        <div className="job-ai-form__stack">
          <FieldChrome
            label="Responsibilities"
            helper="Make these responsibilities clearer, more senior, or more execution-focused."
            showHelper={false}
            fieldKeys={['responsibilities']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <ListEditor
              label="Responsibilities"
              items={draft.responsibilities}
              disabled={disabled}
              onChange={(items) => onFieldChange('responsibilities', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Requirements"
            helper="Tighten these requirements, remove unrealistic asks, or better reflect the role."
            showHelper={false}
            fieldKeys={['requirements']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <ListEditor
              label="Requirements"
              items={draft.requirements}
              disabled={disabled}
              onChange={(items) => onFieldChange('requirements', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Preferred Qualifications"
            helper="Refine the preferred qualifications so they add signal without becoming mandatory."
            showHelper={false}
            fieldKeys={['preferred_qualifications']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <ListEditor
              label="Preferred qualifications"
              items={draft.preferred_qualifications}
              disabled={disabled}
              onChange={(items) => onFieldChange('preferred_qualifications', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Benefits"
            helper="Rewrite the benefits to be clearer, more realistic, or more appealing."
            showHelper={false}
            fieldKeys={['benefits']}
            lockedFields={lockedFields}
            dirtyFields={dirtyFields}
            missingFields={missingFields}
            disabled={disabled}
            onToggleLock={onToggleLock}
            onRequestUpdate={onRequestUpdate}
          >
            <ListEditor
              label="Benefits"
              items={draft.benefits}
              disabled={disabled}
              onChange={(items) => onFieldChange('benefits', items)}
            />
          </FieldChrome>
        </div>
      </div>
    </section>
  )
}
