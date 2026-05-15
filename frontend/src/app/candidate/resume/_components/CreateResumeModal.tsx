'use client'

import { useState } from 'react'

import { LIMITS } from '@/lib/validation'

// ── Modal for naming a new resume before creation ─────────────────────────

export default function CreateResumeModal({
  onConfirm,
  onCancel,
  isLoading,
  error,
}: {
  onConfirm: (name: string, forkFromProfile: boolean) => void
  onCancel: () => void
  isLoading: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [forkFromProfile, setForkFromProfile] = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim()) {
      onConfirm(name.trim(), forkFromProfile)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">Create New Resume</h3>
          <button className="btn btn--icon btn--sm" onClick={onCancel} aria-label="Close">
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="resume-field">
              <label className="resume-field__label">Resume Name</label>
              <input
                className="resume-field__input"
                autoFocus
                placeholder="e.g. Frontend Engineer at Acme"
                value={name}
                maxLength={LIMITS.name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="resume-field" style={{ marginTop: 12 }}>
              <label
                className="resume-field__toggle-row"
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={forkFromProfile}
                  onChange={(e) => setForkFromProfile(e.target.checked)}
                  disabled={isLoading}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span className="resume-field__hint" style={{ margin: 0 }}>
                  Pre-fill from my profile
                </span>
              </label>
            </div>

            {error && <p className="resume-field__error">{error}</p>}
          </div>
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn--primary btn--sm${isLoading ? ' btn--loading' : ''}`}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
