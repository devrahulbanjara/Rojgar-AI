'use client'

import { LIMITS, isDateOrderValid } from '@/lib/validation'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import styles from '../page.module.scss'
import { type FormEducation, formatDate } from './profileForm'

interface EducationSectionProps {
  educations: FormEducation[]
  editingKey: string | null
  isSaving: boolean
  onAdd: () => void
  onEdit: (key: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onRemove: (key: string) => void
  onChange: (key: string, field: keyof FormEducation, value: string) => void
}

export default function EducationSection({
  educations,
  editingKey,
  isSaving,
  onAdd,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onChange,
}: EducationSectionProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Schools & programs</div>
          <h2 className={styles.cardTitle}>Education</h2>
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
        {educations.length === 0 && <div className={styles.empty}>No education added yet.</div>}

        {educations.map((edu) => (
          <EducationEntry
            key={edu._key}
            entry={edu}
            isEditing={editingKey === edu._key}
            isSaving={isSaving}
            onEdit={() => onEdit(edu._key)}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onRemove={() => onRemove(edu._key)}
            onChange={(field, value) => onChange(edu._key, field, value)}
          />
        ))}
      </div>
    </div>
  )
}

interface EntryProps {
  entry: FormEducation
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: () => void
  onChange: (field: keyof FormEducation, value: string) => void
}

function EducationEntry({
  entry,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  onChange,
}: EntryProps) {
  const dateError = !isDateOrderValid(entry.startDate, entry.endDate)
    ? 'End date must be on or after start date.'
    : null
  return (
    <article className={styles.entry}>
      <header className={styles.entryHeader}>
        <div>
          <h3 className={styles.entryTitle}>{entry.degree || 'Untitled Degree'}</h3>
          {entry.institution && <p className={styles.entrySub}>{entry.institution}</p>}
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
                disabled={isSaving || Boolean(dateError)}
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
                aria-label="Edit education"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={onRemove}
                disabled={isSaving}
                aria-label="Remove education"
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
              <label className={styles.fieldLabel}>Degree / Certification</label>
              <input
                className={styles.fieldInput}
                value={entry.degree}
                maxLength={LIMITS.title}
                onChange={(e) => onChange('degree', e.target.value)}
                placeholder="B.S. Computer Science"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Institution</label>
              <input
                className={styles.fieldInput}
                value={entry.institution}
                maxLength={LIMITS.companyName}
                onChange={(e) => onChange('institution', e.target.value)}
                placeholder="University name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Field of Study</label>
              <input
                className={styles.fieldInput}
                value={entry.field_of_study}
                maxLength={LIMITS.shortText}
                onChange={(e) => onChange('field_of_study', e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Start Date</label>
              <input
                className={styles.fieldInput}
                type="month"
                value={entry.startDate}
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
                onChange={(e) => onChange('endDate', e.target.value)}
              />
            </div>
          </div>
          {dateError ? (
            <span className="auth__error-msg" role="alert">
              {dateError}
            </span>
          ) : null}
        </div>
      ) : (
        <div className={styles.entryMeta}>
          {entry.field_of_study && <span>{entry.field_of_study}</span>}
          {(entry.startDate || entry.endDate) && (
            <span>
              {formatDate(entry.startDate)} — {formatDate(entry.endDate)}
            </span>
          )}
        </div>
      )}
    </article>
  )
}
