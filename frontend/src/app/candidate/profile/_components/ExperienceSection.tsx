'use client'

import { LIMITS, isDateOrderValid, todayMonthInput } from '@/lib/validation'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import styles from '../page.module.scss'
import { type FormExperience, formatDate } from './profileForm'

interface ExperienceSectionProps {
  experiences: FormExperience[]
  editingKey: string | null
  isSaving: boolean
  onAdd: () => void
  onEdit: (key: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onRemove: (key: string) => void
  onChange: (key: string, field: keyof FormExperience, value: string | boolean) => void
}

export default function ExperienceSection({
  experiences,
  editingKey,
  isSaving,
  onAdd,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onChange,
}: ExperienceSectionProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Work history</div>
          <h2 className={styles.cardTitle}>Experience</h2>
        </div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onAdd}
          disabled={isSaving}
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      <div className={styles.timeline}>
        {experiences.length === 0 && (
          <div className={styles.empty}>
            No experience added yet. Add your first role to start building your story.
          </div>
        )}

        {experiences.map((exp) => (
          <ExperienceEntry
            key={exp._key}
            entry={exp}
            isEditing={editingKey === exp._key}
            isSaving={isSaving}
            onEdit={() => onEdit(exp._key)}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onRemove={() => onRemove(exp._key)}
            onChange={(field, value) => onChange(exp._key, field, value)}
          />
        ))}
      </div>
    </div>
  )
}

interface EntryProps {
  entry: FormExperience
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: () => void
  onChange: (field: keyof FormExperience, value: string | boolean) => void
}

function ExperienceEntry({
  entry,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onChange,
}: EntryProps) {
  const today = todayMonthInput()
  const titleError = !entry.title.trim() ? 'Title is required.' : null
  const startInFuture = entry.startDate && entry.startDate > today
  const endInFuture = !entry.current && entry.endDate && entry.endDate > today
  const dateOrderBad = !entry.current && !isDateOrderValid(entry.startDate, entry.endDate)
  const dateError = startInFuture
    ? 'Start date cannot be in the future.'
    : endInFuture
      ? 'End date cannot be in the future.'
      : dateOrderBad
        ? 'End date must be on or after start date.'
        : null
  const hasError = Boolean(titleError || dateError)
  return (
    <article className={styles.entry}>
      <header className={styles.entryHeader}>
        <div>
          <h3 className={styles.entryTitle}>{entry.title || 'Untitled Role'}</h3>
          {entry.company_name && <p className={styles.entrySub}>{entry.company_name}</p>}
        </div>
        <div className={styles.entryActions}>
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
                onClick={onSave}
                disabled={isSaving || hasError}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={onEdit}
                disabled={isSaving}
                aria-label="Edit experience"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={onRemove}
                disabled={isSaving}
                aria-label="Remove experience"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </header>

      {isEditing ? (
        <div className={styles.entryEditBody}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Job Title</label>
              <input
                className={styles.fieldInput}
                value={entry.title}
                maxLength={LIMITS.title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="Senior Product Designer"
              />
              {titleError ? (
                <span className="auth__error-msg" role="alert">
                  {titleError}
                </span>
              ) : null}
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Company</label>
              <input
                className={styles.fieldInput}
                value={entry.company_name}
                maxLength={LIMITS.companyName}
                onChange={(e) => onChange('company_name', e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Start Date</label>
              <input
                className={styles.fieldInput}
                type="month"
                value={entry.startDate}
                max={today}
                onChange={(e) => onChange('startDate', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>End Date</label>
              <input
                className={styles.fieldInput}
                type="month"
                value={entry.endDate}
                min={entry.startDate || undefined}
                max={today}
                disabled={entry.current}
                onChange={(e) => onChange('endDate', e.target.value)}
              />
            </div>
          </div>
          {dateError ? (
            <span className="auth__error-msg" role="alert">
              {dateError}
            </span>
          ) : null}
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) => onChange('current', e.target.checked)}
            />
            I currently work here
          </label>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Description <span className={styles.fieldHint}>(one achievement per line)</span>
            </label>
            <textarea
              className={styles.fieldTextarea}
              rows={4}
              value={entry.description}
              maxLength={LIMITS.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder={
                'Led end-to-end design for the core product\nIncreased engagement by 32%'
              }
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.entryMeta}>
            {(entry.startDate || entry.endDate || entry.current) && (
              <span>
                {formatDate(entry.startDate)} —{' '}
                {entry.current ? 'Present' : formatDate(entry.endDate)}
              </span>
            )}
          </div>
          {entry.description && (
            <ul className={styles.entryDescList}>
              {entry.description
                .split('\n')
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ul>
          )}
        </>
      )}
    </article>
  )
}
