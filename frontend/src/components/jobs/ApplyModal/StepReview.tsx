import { useState } from 'react'

import Link from 'next/link'

import type { ApiResumeData } from '@/store/services/resumeApi'
import { Info } from 'lucide-react'

import StepShareProfile, { type ShareSettingsDraft } from './StepShareProfile'
import styles from './applyModal.module.scss'

interface StepReviewProps {
  resumes: ApiResumeData[]
  loading: boolean
  selectedResumeId: string | null
  onSelect: (resumeId: string) => void
  shareSettings: ShareSettingsDraft
  onToggleShare: <K extends keyof ShareSettingsDraft>(key: K, value: ShareSettingsDraft[K]) => void
  onCreateFromProfile: () => void
  creatingFromProfile: boolean
  importHref: string
  hasPendingPatch: boolean
}

export default function StepReview({
  resumes,
  loading,
  selectedResumeId,
  onSelect,
  shareSettings,
  onToggleShare,
  onCreateFromProfile,
  creatingFromProfile,
  importHref,
  hasPendingPatch,
}: StepReviewProps) {
  const [showSharing, setShowSharing] = useState(false)

  if (loading) {
    return (
      <div className={styles.applyModal__loading}>
        <div className={styles.applyModal__loadingDots}>
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
        </div>
        <div>
          <p className={styles.applyModal__loadingTitle}>Loading your resumes</p>
          <p className={styles.applyModal__loadingCopy}>Fetching your latest resume versions.</p>
        </div>
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div className={styles.applyModal__empty}>
        <p>You need a resume to apply. Create one from your profile in one click.</p>
        <div className={styles.applyModal__stepActions}>
          <button
            className="btn btn--primary"
            disabled={creatingFromProfile}
            onClick={onCreateFromProfile}
            type="button"
          >
            {creatingFromProfile ? 'Creating resume…' : 'Use my profile'}
          </button>
          <Link href={importHref} className="btn btn--ghost">
            Import a PDF instead
          </Link>
        </div>
      </div>
    )
  }

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId)

  return (
    <div className={styles.applyModal__body}>
      {resumes.length > 1 ? (
        <div className={styles.applyModal__resumeList} role="radiogroup" aria-label="Resume">
          {resumes.map((resume) => {
            const selected = selectedResumeId === resume.id

            return (
              <button
                key={resume.id}
                aria-checked={selected}
                className={`${styles.applyModal__resumeCard} ${
                  selected ? styles['applyModal__resumeCard--selected'] : ''
                }`}
                onClick={() => onSelect(resume.id)}
                role="radio"
                type="button"
              >
                <span
                  className={`${styles.applyModal__resumeIndicator} ${
                    selected ? styles['applyModal__resumeIndicator--selected'] : ''
                  }`}
                />
                <div className={styles.applyModal__resumeMeta}>
                  <div className={styles.applyModal__resumeName}>{resume.resume_name}</div>
                  <p className={styles.applyModal__resumeHeadline}>
                    {resume.headline || 'No headline yet. You can still apply with this resume.'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className={styles.applyModal__intro}>
          Applying with <strong>{selectedResume?.resume_name ?? resumes[0].resume_name}</strong>.
        </p>
      )}

      {hasPendingPatch ? (
        <p className={styles.applyModal__intro}>
          Your AI-suggested resume changes will be saved when you submit.
        </p>
      ) : null}

      <p className={styles.applyModal__intro}>
        Sharing: {shareSettings.share_profile_all ? 'full profile' : 'limited profile'} ·{' '}
        <button
          aria-expanded={showSharing}
          className={styles.applyModal__inlineLink}
          onClick={() => setShowSharing((value) => !value)}
          type="button"
        >
          {showSharing ? 'Done' : 'Edit'}
        </button>
      </p>

      {showSharing ? <StepShareProfile onToggle={onToggleShare} settings={shareSettings} /> : null}

      <p className={styles.applyModal__notice}>
        <Info size={14} aria-hidden="true" />
        <span>
          Your application will be screened with AI assistance; a recruiter makes the final
          decision.
        </span>
      </p>
    </div>
  )
}
