'use client'

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
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
        />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={onAdd}
          disabled={isSaving || !skillInput.trim()}
        >
          Add
        </button>
      </div>

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
