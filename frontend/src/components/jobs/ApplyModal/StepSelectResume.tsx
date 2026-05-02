import Link from 'next/link'

import type { ApiResumeData } from '@/store/services/resumeApi'

import styles from './applyModal.module.scss'

interface StepSelectResumeProps {
  resumes: ApiResumeData[]
  loading: boolean
  selectedResumeId: string | null
  onSelect: (resumeId: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export default function StepSelectResume({
  resumes,
  loading,
  selectedResumeId,
  onSelect,
  onConfirm,
  onCancel,
}: StepSelectResumeProps) {
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
        <p>You need a resume before you can apply for this job.</p>
        <div className={styles.applyModal__stepActions}>
          <Link href="/candidate/profile" className="btn btn--primary">
            Create Resume
          </Link>
          <button className="btn btn--ghost" onClick={onCancel} type="button">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.applyModal__body}>
      <p className={styles.applyModal__intro}>
        Select which resume you want to use for this application. You can review gaps before you
        submit.
      </p>

      <div className={styles.applyModal__resumeList}>
        {resumes.map((resume) => {
          const selected = selectedResumeId === resume.id

          return (
            <button
              key={resume.id}
              className={`${styles.applyModal__resumeCard} ${
                selected ? styles['applyModal__resumeCard--selected'] : ''
              }`}
              onClick={() => onSelect(resume.id)}
              type="button"
            >
              <span
                className={`${styles.applyModal__resumeIndicator} ${
                  selected ? styles['applyModal__resumeIndicator--selected'] : ''
                }`}
              />
              <div className={styles.applyModal__resumeMeta}>
                <div className={styles.applyModal__resumeName}>{resume.resume_name}</div>
                {resume.headline ? (
                  <p className={styles.applyModal__resumeHeadline}>{resume.headline}</p>
                ) : (
                  <p className={styles.applyModal__resumeHeadline}>
                    No headline yet. You can still continue with this resume.
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className={styles.applyModal__stepActions}>
        <button className="btn btn--ghost" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="btn btn--primary"
          disabled={!selectedResumeId}
          onClick={onConfirm}
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
