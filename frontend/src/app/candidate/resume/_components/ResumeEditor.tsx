'use client'

import { useEffect, useRef, useState } from 'react'

import { notify } from '@/lib/notify'
import type { EducationEntry, ExperienceEntry, Resume } from '@/lib/types/resume'
import {
  LIMITS,
  isDateOrderValid,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  todayMonthInput,
} from '@/lib/validation'
import { ArrowLeft } from 'lucide-react'

import SkillsSection from './SkillsSection'
import { SECTIONS, type Section, uid } from './resumeUtils'

// ── Resume editor form ─────────────────────────────────────────────────────

export default function ResumeEditor({
  resume,
  onClose,
  onPreview,
  onSave,
  onChange,
  isSaving,
}: {
  resume: Resume
  onClose: () => void
  onPreview: () => void
  onSave?: (r: Resume) => void
  onChange: (r: Resume) => void
  isSaving?: boolean
}) {
  const [activeSection, setActiveSection] = useState<Section>('Personal')
  const [draft, setDraft] = useState<Resume>({ ...resume })

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChangeRef.current(draft)
  }, [draft])

  function update<K extends keyof Resume>(key: K, value: Resume[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function updateExp(id: string, field: keyof ExperienceEntry, value: string | boolean) {
    const updated = draft.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    update('experience', updated)
  }

  function addExp() {
    const entry: ExperienceEntry = {
      id: uid(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
    update('experience', [...draft.experience, entry])
  }

  function removeExp(id: string) {
    update(
      'experience',
      draft.experience.filter((e) => e.id !== id),
    )
  }

  function updateEdu(id: string, field: keyof EducationEntry, value: string) {
    const updated = draft.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    update('education', updated)
  }

  function addEdu() {
    const entry: EducationEntry = {
      id: uid(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
    }
    update('education', [...draft.education, entry])
  }

  function removeEdu(id: string) {
    update(
      'education',
      draft.education.filter((e) => e.id !== id),
    )
  }

  function addSkill(sk: string) {
    const t = sk.trim()
    if (!t || t.length > LIMITS.skill) return
    if (draft.skills.some((s) => s.toLowerCase() === t.toLowerCase())) return
    update('skills', [...draft.skills, t])
  }

  function validateDraft(): string | null {
    if (draft.email && !isValidEmail(draft.email)) return 'Enter a valid email address.'
    if (draft.phone && !isValidPhone(draft.phone)) return 'Enter a valid phone number.'
    for (const key of ['website', 'linkedin_url', 'github_url'] as const) {
      const v = draft[key] as string | undefined
      if (v && !isValidUrl(v))
        return `${key.replace('_url', '').replace('website', 'Portfolio')} URL must start with http(s)://.`
    }
    const today = todayMonthInput()
    for (const exp of draft.experience) {
      if (exp.startDate && exp.startDate > today)
        return `Experience "${exp.title || 'Untitled'}" start date cannot be in the future.`
      if (!exp.current && exp.endDate && exp.endDate > today)
        return `Experience "${exp.title || 'Untitled'}" end date cannot be in the future.`
      if (!exp.current && !isDateOrderValid(exp.startDate, exp.endDate))
        return `Experience "${exp.title || 'Untitled'}" end date must be on or after start date.`
    }
    for (const edu of draft.education) {
      if (!isDateOrderValid(edu.startDate, edu.endDate))
        return `Education "${edu.degree || 'Untitled'}" end date must be on or after start date.`
      if (edu.gpa && edu.gpa.trim()) {
        const n = Number(edu.gpa)
        if (Number.isNaN(n) || n < 0 || n > 10)
          return `Education "${edu.degree || 'Untitled'}" GPA must be a number 0–10.`
      }
    }
    return null
  }

  function handleSave() {
    const err = validateDraft()
    if (err) {
      notify.error(err)
      return
    }
    onSave?.(draft)
  }

  function removeSkill(sk: string) {
    update(
      'skills',
      draft.skills.filter((s) => s !== sk),
    )
  }

  return (
    <div className="resume-editor">
      {/* Editor topbar */}
      <div className="resume-editor__topbar">
        <button className="btn btn--ghost btn--sm" onClick={onClose}>
          <ArrowLeft size={14} />
          Back to Resumes
        </button>
        <div className="resume-editor__title">{draft.name}</div>
        <div className="resume-editor__topbar-actions">
          <button className="btn btn--ghost btn--sm" onClick={onPreview}>
            Preview
          </button>
          <button
            className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="resume-editor__body">
        {/* Section nav */}
        <nav className="resume-editor__nav">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`resume-editor__nav-item${activeSection === s ? ' resume-editor__nav-item--active' : ''}`}
              onClick={() => setActiveSection(s)}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* Section form */}
        <div className="resume-editor__form" data-lenis-prevent>
          {activeSection === 'Personal' && (
            <div className="resume-section">
              <div className="resume-section__title">Personal Information</div>
              <div className="resume-form-grid">
                {(
                  [
                    ['fullName', 'Full Name', 'text'],
                    ['headline', 'Professional Headline', 'text'],
                    ['email', 'Email', 'email'],
                    ['phone', 'Phone', 'tel'],
                    ['location', 'Location', 'text'],
                    ['website', 'Portfolio URL', 'url'],
                    ['linkedin_url', 'LinkedIn URL', 'url'],
                    ['github_url', 'GitHub URL', 'url'],
                  ] as [keyof Resume, string, string][]
                ).map(([field, label, type]) => {
                  const maxByType =
                    type === 'email'
                      ? LIMITS.email
                      : type === 'tel'
                        ? LIMITS.phone
                        : type === 'url'
                          ? LIMITS.url
                          : LIMITS.shortText
                  return (
                    <div className="resume-field" key={field}>
                      <label className="resume-field__label">{label}</label>
                      <input
                        className="resume-field__input"
                        type={type}
                        value={draft[field] as string}
                        maxLength={maxByType}
                        onChange={(e) => update(field, e.target.value)}
                        placeholder={label}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'Summary' && (
            <div className="resume-section">
              <div className="resume-section__title">Professional Summary</div>
              <div className="resume-field">
                <label className="resume-field__label">Summary</label>
                <textarea
                  className="resume-field__textarea"
                  rows={6}
                  value={draft.summary}
                  maxLength={LIMITS.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  placeholder="Write a compelling summary of your professional background..."
                />
              </div>
            </div>
          )}

          {activeSection === 'Experience' && (
            <div className="resume-section">
              <div className="resume-section__header">
                <div className="resume-section__title">Work Experience</div>
                <button className="btn btn--secondary btn--sm" onClick={addExp}>
                  + Add Experience
                </button>
              </div>
              {draft.experience.map((exp) => (
                <div className="resume-entry" key={exp.id}>
                  <div className="resume-entry__header">
                    <div className="resume-entry__title">{exp.title || 'New Entry'}</div>
                    <button
                      className="resume-entry__remove"
                      onClick={() => removeExp(exp.id)}
                      aria-label="Remove"
                    >
                      x
                    </button>
                  </div>
                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label">Job Title</label>
                      <input
                        className="resume-field__input"
                        value={exp.title}
                        maxLength={LIMITS.title}
                        onChange={(e) => updateExp(exp.id, 'title', e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Company</label>
                      <input
                        className="resume-field__input"
                        value={exp.company}
                        maxLength={LIMITS.companyName}
                        onChange={(e) => updateExp(exp.id, 'company', e.target.value)}
                        placeholder="Company"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Location</label>
                      <input
                        className="resume-field__input"
                        value={exp.location}
                        maxLength={LIMITS.location}
                        onChange={(e) => updateExp(exp.id, 'location', e.target.value)}
                        placeholder="Location"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Start Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={exp.startDate}
                        max={todayMonthInput()}
                        onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">End Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={exp.endDate}
                        min={exp.startDate || undefined}
                        max={todayMonthInput()}
                        disabled={exp.current}
                        onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)}
                        placeholder="Present"
                      />
                    </div>
                    <div className="resume-field resume-field--checkbox">
                      <label className="resume-field__checkbox-label">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExp(exp.id, 'current', e.target.checked)}
                        />
                        Currently working here
                      </label>
                    </div>
                  </div>
                  <div className="resume-field">
                    <label className="resume-field__label">Description</label>
                    <textarea
                      className="resume-field__textarea"
                      rows={4}
                      value={exp.description}
                      maxLength={LIMITS.description}
                      onChange={(e) => updateExp(exp.id, 'description', e.target.value)}
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'Education' && (
            <div className="resume-section">
              <div className="resume-section__header">
                <div className="resume-section__title">Education</div>
                <button className="btn btn--secondary btn--sm" onClick={addEdu}>
                  + Add Education
                </button>
              </div>
              {draft.education.map((edu) => (
                <div className="resume-entry" key={edu.id}>
                  <div className="resume-entry__header">
                    <div className="resume-entry__title">{edu.degree || 'New Entry'}</div>
                    <button
                      className="resume-entry__remove"
                      onClick={() => removeEdu(edu.id)}
                      aria-label="Remove"
                    >
                      x
                    </button>
                  </div>
                  <div className="resume-form-grid">
                    <div className="resume-field">
                      <label className="resume-field__label">Degree / Certification</label>
                      <input
                        className="resume-field__input"
                        value={edu.degree}
                        maxLength={LIMITS.title}
                        onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)}
                        placeholder="B.S. in Computer Science"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Institution</label>
                      <input
                        className="resume-field__input"
                        value={edu.institution}
                        maxLength={LIMITS.companyName}
                        onChange={(e) => updateEdu(edu.id, 'institution', e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Location</label>
                      <input
                        className="resume-field__input"
                        value={edu.location}
                        maxLength={LIMITS.location}
                        onChange={(e) => updateEdu(edu.id, 'location', e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">Start Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEdu(edu.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">End Date</label>
                      <input
                        className="resume-field__input"
                        type="month"
                        value={edu.endDate}
                        min={edu.startDate || undefined}
                        onChange={(e) => updateEdu(edu.id, 'endDate', e.target.value)}
                      />
                    </div>
                    <div className="resume-field">
                      <label className="resume-field__label">GPA (optional)</label>
                      <input
                        className="resume-field__input"
                        type="number"
                        step="0.01"
                        min={0}
                        max={10}
                        value={edu.gpa}
                        onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)}
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'Skills' && (
            <SkillsSection skills={draft.skills} onAdd={addSkill} onRemove={removeSkill} />
          )}
        </div>
      </div>
    </div>
  )
}
