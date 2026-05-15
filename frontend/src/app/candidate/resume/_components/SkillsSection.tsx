'use client'

import { useState } from 'react'

import { LIMITS, hasDuplicate } from '@/lib/validation'

// ── Skills chip input ──────────────────────────────────────────────────────

export default function SkillsSection({
  skills,
  onAdd,
  onRemove,
}: {
  skills: string[]
  onAdd: (s: string) => void
  onRemove: (s: string) => void
}) {
  const [input, setInput] = useState('')

  const trimmed = input.trim()
  const duplicate = hasDuplicate(skills, trimmed)
  const tooLong = trimmed.length > LIMITS.skill
  const error = duplicate
    ? 'Skill already added.'
    : tooLong
      ? `Skill too long (max ${LIMITS.skill}).`
      : null
  const canAdd = Boolean(trimmed) && !duplicate && !tooLong

  function handleAdd() {
    if (canAdd) {
      onAdd(trimmed)
      setInput('')
    }
  }

  return (
    <div className="resume-section">
      <div className="resume-section__title">Skills</div>
      <div className="skills-input-row">
        <input
          className="resume-field__input"
          placeholder="Add a skill (e.g. Figma)"
          value={input}
          maxLength={LIMITS.skill}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button className="btn btn--primary btn--sm" onClick={handleAdd} disabled={!canAdd}>
          Add
        </button>
      </div>
      {error ? (
        <span className="auth__error-msg" role="alert">
          {error}
        </span>
      ) : null}
      <div className="skills-wrap">
        {skills.map((sk) => (
          <span className="skill-item" key={sk}>
            {sk}
            <button
              className="btn btn--icon btn--sm"
              onClick={() => onRemove(sk)}
              aria-label={`Remove ${sk}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
