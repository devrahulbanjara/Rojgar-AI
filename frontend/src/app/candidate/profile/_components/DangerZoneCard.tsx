'use client'

import { useState } from 'react'

import { AlertTriangle, Trash2, X } from 'lucide-react'

import styles from '../page.module.scss'

interface DangerZoneCardProps {
  isDeleting: boolean
  onDelete: () => Promise<void>
}

export default function DangerZoneCard({ isDeleting, onDelete }: DangerZoneCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  function handleClose() {
    setShowModal(false)
    setConfirmText('')
  }

  return (
    <>
      <section className={styles.dangerCard} aria-label="Account danger zone">
        <span className={styles.dangerIcon} aria-hidden="true">
          <Trash2 size={18} />
        </span>
        <div className={styles.dangerCopy}>
          <h3 className={styles.dangerTitle}>Delete account</h3>
          <p className={styles.dangerDesc}>
            Permanently remove your account, profile, resumes, and all application history. This
            cannot be undone.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--danger btn--sm"
          onClick={() => setShowModal(true)}
        >
          Delete account
        </button>
      </section>

      {showModal && (
        <div className="modal-backdrop modal-backdrop--animated" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="modal__header">
              <h3 className="modal__title" id="delete-account-title">
                Delete account
              </h3>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={handleClose}
                aria-label="Close"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              <div className="modal-danger-warning" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>This action is permanent and cannot be undone.</span>
              </div>
              <p className={styles.dangerDesc} style={{ margin: '0.75rem 0' }}>
                Your account, profile, resume data, and all application history will be permanently
                deleted. You will be immediately signed out.
              </p>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="delete-confirm-input">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  className={styles.fieldInput}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn--danger${isDeleting ? ' btn--loading' : ''}`}
                onClick={() => void onDelete()}
                disabled={isDeleting || confirmText !== 'DELETE'}
              >
                {isDeleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
