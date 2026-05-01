'use client'

import { useEffect, useRef, useState } from 'react'

import { FileUp, Sparkles, X } from 'lucide-react'

import styles from '../page.module.scss'
import { AVAILABLE_ROLES, type FormProfile } from './profileForm'

interface SidePanelProps {
  form: FormProfile
  isSaving: boolean
  onAddTargetRole: (role: string) => void
  onRemoveTargetRole: (role: string) => void
  onOpenImport: () => void
}

export default function SidePanel({
  form,
  isSaving,
  onAddTargetRole,
  onRemoveTargetRole,
  onOpenImport,
}: SidePanelProps) {
  return (
    <>
      <StatsCard form={form} />
      <TargetRolesCard
        roles={form.target_roles}
        isSaving={isSaving}
        onAdd={onAddTargetRole}
        onRemove={onRemoveTargetRole}
      />
      <ResumeImportCard onOpen={onOpenImport} />
    </>
  )
}

function StatsCard({ form }: { form: FormProfile }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Snapshot</div>
          <h2 className={styles.cardTitle}>Profile Stats</h2>
        </div>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{form.experiences.length}</div>
          <div className={styles.statLabel}>Roles</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{form.educations.length}</div>
          <div className={styles.statLabel}>Degrees</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{form.skills.length}</div>
          <div className={styles.statLabel}>Skills</div>
        </div>
      </div>
    </div>
  )
}

interface TargetRolesProps {
  roles: string[]
  isSaving: boolean
  onAdd: (role: string) => void
  onRemove: (role: string) => void
}

function TargetRolesCard({ roles, isSaving, onAdd, onRemove }: TargetRolesProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = AVAILABLE_ROLES.filter(
    (role) => role.toLowerCase().includes(input.toLowerCase()) && !roles.includes(role),
  ).slice(0, 30)

  function commit(role: string) {
    const r = role.trim()
    if (!r || roles.includes(r)) return
    onAdd(r)
    setInput('')
    setOpen(false)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>What you want</div>
          <h2 className={styles.cardTitle}>Target Roles</h2>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className={styles.empty}>
          No target roles yet — add a few to help recruiters match you.
        </div>
      ) : (
        <div className={styles.skillsWrap}>
          {roles.map((role) => (
            <span className={styles.skillChip} key={role}>
              {role}
              <button
                type="button"
                className={styles.skillRemove}
                disabled={isSaving}
                onClick={() => onRemove(role)}
                aria-label={`Remove ${role}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.rolesPicker} ref={wrapRef}>
        <input
          className={styles.fieldInput}
          placeholder="Add a target role…"
          value={input}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (input.trim()) commit(input)
            }
          }}
        />
        {open && (input.length > 0 || filtered.length > 0) && (
          <div className={styles.rolesDropdown} role="listbox">
            {filtered.map((role) => (
              <button
                key={role}
                type="button"
                className={styles.rolesOption}
                onClick={() => commit(role)}
              >
                {role}
              </button>
            ))}
            {input.trim() &&
              !filtered.some((r) => r.toLowerCase() === input.trim().toLowerCase()) && (
                <button type="button" className={styles.rolesOption} onClick={() => commit(input)}>
                  + Add &ldquo;{input.trim()}&rdquo;
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

function ResumeImportCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>Faster setup</div>
          <h2 className={styles.cardTitle}>Import from Resume</h2>
        </div>
        <Sparkles size={16} aria-hidden="true" color="var(--color-primary)" />
      </div>
      <div className={styles.importCardBody}>
        Upload a PDF or DOCX and we&rsquo;ll pre-fill your profile and resume in seconds.
      </div>
      <button type="button" className="btn btn--secondary btn--sm" onClick={onOpen}>
        <FileUp size={13} />
        Import resume
      </button>
    </div>
  )
}
