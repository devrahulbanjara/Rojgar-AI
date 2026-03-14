'use client'

import { type ReactNode, useState } from 'react'

import type { JobAIDraftPayload } from '@/store/services/jobAiApi'

type DraftField =
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

type JobDraftFormProps = {
  draft: JobAIDraftPayload | null
  dirtyFields: string[]
  lockedFields: string[]
  missingFields: string[]
  disabled: boolean
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
  const isLocked = hasAny(lockedFields, fieldKeys)
  const isDirty = hasAny(dirtyFields, fieldKeys)
  const isMissing = hasAny(missingFields, fieldKeys)

  return (
    <div className={`job-ai-field${isMissing ? ' job-ai-field--missing' : ''}`}>
      <div className="job-ai-field__header">
        <div className="job-ai-field__title-row">
          <label className="job-ai-label">{label}</label>
          <div className="job-ai-field__badges">
            {isLocked ? <span className="job-ai-badge job-ai-badge--locked">Locked</span> : null}
            {isDirty ? (
              <span className="job-ai-badge job-ai-badge--edited">Edited</span>
            ) : (
              <span className="job-ai-badge job-ai-badge--ai">AI Suggested</span>
            )}
            {isMissing ? <span className="job-ai-badge job-ai-badge--missing">Missing</span> : null}
          </div>
        </div>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={disabled}
          onClick={() => onToggleLock(fieldKeys[0])}
        >
          {isLocked ? 'Unlock' : 'Lock'}
        </button>
      </div>

      <p className="job-ai-field__helper">{helper}</p>

      {children}

      <div className="job-ai-instruction">
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
            }}
          >
            Send to AI
          </button>
        </div>
      </div>
    </div>
  )
}

function ListEditor({
  label,
  items,
  emptyLabel,
  disabled,
  onChange,
}: {
  label: string
  items: string[]
  emptyLabel: string
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
      <div className="job-ai-list-editor__header">
        <span className="job-ai-label">{label}</span>
        <span className="job-ai-list-editor__count">{items.length} item(s)</span>
      </div>

      {items.length === 0 ? (
        <div className="job-ai-list-editor__empty">{emptyLabel}</div>
      ) : (
        <div className="job-ai-list-editor__items">
          {items.map((item, index) => (
            <div className="job-ai-list-editor__row" key={`${label}-${index}`}>
              <input
                className="job-ai-input"
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                disabled={disabled}
              />
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => removeItem(index)}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="job-ai-list-editor__composer">
        <input
          className="job-ai-input"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder={`Add a new ${label.toLowerCase()} item`}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={addItem}
          disabled={disabled}
        >
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
  onFieldChange,
  onToggleLock,
  onRequestUpdate,
}: JobDraftFormProps) {
  if (!draft) {
    return (
      <section className="job-ai-card job-ai-card--placeholder dash-card">
        <div className="job-ai-card__body dash-card__body">
          <div className="job-ai-empty">
            <h2 className="job-ai-empty__title">No draft yet</h2>
            <p className="job-ai-empty__copy">
              Generate a draft from the left panel and the editable job form will appear here.
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
        </div>

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
                onFieldChange('salary_min', event.target.value ? Number(event.target.value) : null)
              }
              placeholder="Min salary"
              disabled={disabled}
            />
            <input
              className="job-ai-input"
              type="number"
              value={draft.salary_max ?? ''}
              onChange={(event) =>
                onFieldChange('salary_max', event.target.value ? Number(event.target.value) : null)
              }
              placeholder="Max salary"
              disabled={disabled}
            />
            <input
              className="job-ai-input"
              value={draft.currency ?? ''}
              onChange={(event) => onFieldChange('currency', event.target.value || null)}
              placeholder="Currency"
              disabled={disabled}
            />
          </div>
        </FieldChrome>

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
              emptyLabel="No responsibilities yet."
              disabled={disabled}
              onChange={(items) => onFieldChange('responsibilities', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Requirements"
            helper="Tighten these requirements, remove unrealistic asks, or better reflect the role."
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
              emptyLabel="No requirements yet."
              disabled={disabled}
              onChange={(items) => onFieldChange('requirements', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Preferred Qualifications"
            helper="Refine the preferred qualifications so they add signal without becoming mandatory."
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
              emptyLabel="No preferred qualifications yet."
              disabled={disabled}
              onChange={(items) => onFieldChange('preferred_qualifications', items)}
            />
          </FieldChrome>

          <FieldChrome
            label="Benefits"
            helper="Rewrite the benefits to be clearer, more realistic, or more appealing."
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
              emptyLabel="No benefits yet."
              disabled={disabled}
              onChange={(items) => onFieldChange('benefits', items)}
            />
          </FieldChrome>
        </div>
      </div>
    </section>
  )
}
