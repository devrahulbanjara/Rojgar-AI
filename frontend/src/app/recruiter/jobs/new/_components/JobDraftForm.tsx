'use client'

import type { ReactNode } from 'react'

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
  onRegenerate: (fields: DraftField[]) => void
}

function hasAny(targets: string[], keys: string[]) {
  return keys.some((key) => targets.includes(key))
}

function serializeList(items: string[]) {
  return items.join('\n')
}

function parseList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function FieldChrome({
  label,
  fieldKeys,
  lockedFields,
  dirtyFields,
  missingFields,
  disabled,
  onToggleLock,
  onRegenerate,
  children,
}: {
  label: string
  fieldKeys: DraftField[]
  lockedFields: string[]
  dirtyFields: string[]
  missingFields: string[]
  disabled: boolean
  onToggleLock: (field: DraftField) => void
  onRegenerate: (fields: DraftField[]) => void
  children: ReactNode
}) {
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

        <div className="job-ai-field__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={disabled}
            onClick={() => onToggleLock(fieldKeys[0])}
          >
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={disabled || isLocked}
            onClick={() => onRegenerate(fieldKeys)}
          >
            Regenerate
          </button>
        </div>
      </div>
      {children}
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
  onRegenerate,
}: JobDraftFormProps) {
  if (!draft) {
    return (
      <section className="job-ai-card job-ai-card--placeholder">
        <div className="job-ai-empty">
          <h2 className="job-ai-empty__title">No draft yet</h2>
          <p className="job-ai-empty__copy">
            Generate a draft from the assistant panel and your structured job form will appear here.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="job-ai-card job-ai-form">
      <div className="job-ai-card__header">
        <div>
          <h2 className="job-ai-card__title">Structured Draft</h2>
          <p className="job-ai-card__subtitle">
            Edit the real job fields directly. Locks prevent accidental regeneration from that area.
          </p>
        </div>
      </div>

      <div className="job-ai-form__grid">
        <FieldChrome
          label="Title"
          fieldKeys={['title']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <input
            className="job-ai-input"
            value={draft.title}
            onChange={(event) => onFieldChange('title', event.target.value)}
          />
        </FieldChrome>

        <FieldChrome
          label="Location"
          fieldKeys={['location']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <input
            className="job-ai-input"
            value={draft.location ?? ''}
            onChange={(event) => onFieldChange('location', event.target.value || null)}
          />
        </FieldChrome>

        <FieldChrome
          label="Location Type"
          fieldKeys={['location_type']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <select
            className="job-ai-input"
            value={draft.location_type}
            onChange={(event) =>
              onFieldChange('location_type', event.target.value as JobAIDraftPayload['location_type'])
            }
          >
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </FieldChrome>
      </div>

      <FieldChrome
        label="Salary Range"
        fieldKeys={['salary_min', 'salary_max', 'currency']}
        lockedFields={lockedFields}
        dirtyFields={dirtyFields}
        missingFields={missingFields}
        disabled={disabled}
        onToggleLock={onToggleLock}
        onRegenerate={onRegenerate}
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
          />
          <input
            className="job-ai-input"
            value={draft.currency ?? ''}
            onChange={(event) => onFieldChange('currency', event.target.value || null)}
            placeholder="Currency"
          />
        </div>
      </FieldChrome>

      <FieldChrome
        label="Overview"
        fieldKeys={['overview']}
        lockedFields={lockedFields}
        dirtyFields={dirtyFields}
        missingFields={missingFields}
        disabled={disabled}
        onToggleLock={onToggleLock}
        onRegenerate={onRegenerate}
      >
        <textarea
          className="job-ai-textarea"
          rows={6}
          value={draft.overview}
          onChange={(event) => onFieldChange('overview', event.target.value)}
        />
      </FieldChrome>

      <div className="job-ai-form__stack">
        <FieldChrome
          label="Responsibilities"
          fieldKeys={['responsibilities']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <textarea
            className="job-ai-textarea"
            rows={7}
            value={serializeList(draft.responsibilities)}
            onChange={(event) => onFieldChange('responsibilities', parseList(event.target.value))}
          />
        </FieldChrome>

        <FieldChrome
          label="Requirements"
          fieldKeys={['requirements']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <textarea
            className="job-ai-textarea"
            rows={7}
            value={serializeList(draft.requirements)}
            onChange={(event) => onFieldChange('requirements', parseList(event.target.value))}
          />
        </FieldChrome>

        <FieldChrome
          label="Preferred Qualifications"
          fieldKeys={['preferred_qualifications']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <textarea
            className="job-ai-textarea"
            rows={6}
            value={serializeList(draft.preferred_qualifications)}
            onChange={(event) =>
              onFieldChange('preferred_qualifications', parseList(event.target.value))
            }
          />
        </FieldChrome>

        <FieldChrome
          label="Benefits"
          fieldKeys={['benefits']}
          lockedFields={lockedFields}
          dirtyFields={dirtyFields}
          missingFields={missingFields}
          disabled={disabled}
          onToggleLock={onToggleLock}
          onRegenerate={onRegenerate}
        >
          <textarea
            className="job-ai-textarea"
            rows={6}
            value={serializeList(draft.benefits)}
            onChange={(event) => onFieldChange('benefits', parseList(event.target.value))}
          />
        </FieldChrome>
      </div>
    </section>
  )
}
