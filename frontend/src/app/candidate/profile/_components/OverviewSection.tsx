'use client'

import { Pencil } from 'lucide-react'

import styles from '../page.module.scss'
import type { FormProfile } from './profileForm'

interface OverviewSectionProps {
  form: FormProfile
  displayName: string
  email: string
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChange: <K extends keyof FormProfile>(key: K, value: FormProfile[K]) => void
}

const FIELDS: ReadonlyArray<{
  key:
    | 'headline'
    | 'phone'
    | 'location'
    | 'years_of_experience'
    | 'linkedin_url'
    | 'github_url'
    | 'portfolio_url'
  label: string
  type: string
}> = [
  { key: 'headline', label: 'Professional Headline', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'years_of_experience', label: 'Years of Experience', type: 'number' },
  { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
  { key: 'github_url', label: 'GitHub URL', type: 'url' },
  { key: 'portfolio_url', label: 'Portfolio / Website URL', type: 'url' },
]

export default function OverviewSection({
  form,
  displayName,
  email,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onChange,
}: OverviewSectionProps) {
  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardEyebrow}>About you</div>
            <h2 className={styles.cardTitle}>Personal Information</h2>
          </div>
          <div className={styles.cardActions}>
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
                  disabled={isSaving}
                >
                  Save
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit}>
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className={styles.fields}>
            {FIELDS.map((f) => (
              <div className={styles.field} key={f.key}>
                <label className={styles.fieldLabel} htmlFor={`field-${f.key}`}>
                  {f.label}
                </label>
                <input
                  id={`field-${f.key}`}
                  className={styles.fieldInput}
                  type={f.type}
                  value={form[f.key] as string}
                  onChange={(e) => onChange(f.key, e.target.value as FormProfile[typeof f.key])}
                  placeholder={f.label}
                  min={f.type === 'number' ? 0 : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.infoGrid}>
            {[
              { label: 'Full Name', value: displayName },
              { label: 'Email', value: email },
              { label: 'Headline', value: form.headline },
              { label: 'Phone', value: form.phone },
              { label: 'Location', value: form.location },
              { label: 'Years of Experience', value: form.years_of_experience },
              { label: 'LinkedIn', value: form.linkedin_url },
              { label: 'GitHub', value: form.github_url },
              { label: 'Portfolio', value: form.portfolio_url },
            ].map(({ label, value }) => (
              <div className={styles.infoItem} key={label}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardEyebrow}>In your words</div>
            <h2 className={styles.cardTitle}>Professional Summary</h2>
          </div>
          <div className={styles.cardActions}>
            {isEditing ? null : (
              <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit}>
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            className={styles.fieldTextarea}
            rows={6}
            value={form.summary}
            onChange={(e) => onChange('summary', e.target.value)}
            placeholder="Write a compelling professional summary…"
          />
        ) : (
          <p
            className={styles.infoValue}
            style={{ lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}
          >
            {form.summary || 'No summary added yet.'}
          </p>
        )}
      </div>
    </>
  )
}
