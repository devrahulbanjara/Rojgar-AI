import { CheckCircle2 } from 'lucide-react'

import styles from './applyModal.module.scss'

const FIELD_LABELS: Record<string, string> = {
  headline: 'Professional headline',
  summary: 'Profile summary',
  skills: 'Skills section',
}

interface StepPatchingProps {
  isPatching: boolean
  patchedFields: string[]
  onContinue: () => void
}

export default function StepPatching({ isPatching, patchedFields, onContinue }: StepPatchingProps) {
  if (isPatching) {
    return (
      <div className={styles.applyModal__loading}>
        <div className={styles.applyModal__loadingDots}>
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
        </div>
        <div>
          <p className={styles.applyModal__loadingTitle}>Updating your resume</p>
          <p className={styles.applyModal__loadingCopy}>
            Rewriting the strongest safe version for this application.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.applyModal__patchSuccess}>
      <div className={styles.applyModal__patchHero}>
        <span className={styles.applyModal__patchIcon}>
          <CheckCircle2 size={20} />
        </span>
        <div>
          <p className={styles.applyModal__patchTitle}>Resume updated</p>
          <p className={styles.applyModal__patchCopy}>
            Your selected resume is now better aligned for this role. Review the sections below,
            then submit when ready.
          </p>
        </div>
      </div>

      {patchedFields.length > 0 && (
        <div className={styles.applyModal__updatedList}>
          {patchedFields.map((field) => (
            <div className={styles.applyModal__updatedRow} key={field}>
              <CheckCircle2 size={14} />
              <span>{FIELD_LABELS[field] ?? field}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.applyModal__stepActions}>
        <button className="btn btn--primary" onClick={onContinue} type="button">
          Submit Application
        </button>
      </div>
    </div>
  )
}
