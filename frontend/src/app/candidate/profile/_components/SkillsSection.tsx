'use client'

import { LIMITS, hasDuplicate } from '@/lib/validation'
import { X } from 'lucide-react'

import styles from '../page.module.scss'

interface SkillsSectionProps {
  skills: string[]
  skillInput: string
  isSaving: boolean
  onInputChange: (value: string) => void
  onAdd: () => void
  onRemove: (skill: string) => void
}

export default function SkillsSection({
  skills,
  skillInput,
  isSaving,
  onInputChange,
  onAdd,
  onRemove,
}: SkillsSectionProps) {
  const trimmed = skillInput.trim()
  const duplicate = hasDuplicate(skills, trimmed)
  const tooLong = trimmed.length > LIMITS.skill
  const error = duplicate
    ? 'Skill already added.'
    : tooLong
      ? `Skill too long (max ${LIMITS.skill}).`
      : null
  const canAdd = Boolean(trimmed) && !duplicate && !tooLong
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Your toolbox</div>
          <h2 className={styles.cardTitle}>Skills</h2>
        </div>
      </div>

      <div className={styles.skillsRow}>
        <input
          className={styles.fieldInput}
          placeholder="Add a skill (e.g. React) and press Enter"
          value={skillInput}
          maxLength={LIMITS.skill}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (canAdd) onAdd()
            }
          }}
        />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={onAdd}
          disabled={isSaving || !canAdd}
        >
          Add
        </button>
      </div>
      {error ? (
        <span className="auth__error-msg" role="alert">
          {error}
        </span>
      ) : null}

      {skills.length === 0 ? (
        <div className={styles.empty}>No skills added yet.</div>
      ) : (
        <div className={styles.skillsWrap}>
          {skills.map((sk) => (
            <span className={styles.skillChip} key={sk}>
              {sk}
              <button
                type="button"
                className={styles.skillRemove}
                disabled={isSaving}
                onClick={() => onRemove(sk)}
                aria-label={`Remove ${sk}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
