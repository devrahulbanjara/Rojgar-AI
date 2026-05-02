import type { PatchedFieldDiff } from '@/store/services/resumeGapApi'
import { CheckCircle2 } from 'lucide-react'

import styles from './applyModal.module.scss'

interface StepPatchingProps {
  isPatching: boolean
  patchedDiffs?: PatchedFieldDiff[]
  message?: string
  onContinue: () => void
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export default function StepPatching({
  isPatching,
  patchedDiffs,
  message,
  onContinue,
}: StepPatchingProps) {
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

  const visibleDiffs = (patchedDiffs ?? []).filter(
    (diff) => normalize(diff.old_value) !== normalize(diff.new_value),
  )
  const hasChanges = visibleDiffs.length > 0

  return (
    <div className={styles.applyModal__patchSuccess}>
      <div className={styles.applyModal__patchHero}>
        <div className={styles.applyModal__patchIconWrap}>
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className={styles.applyModal__patchTitle}>
            {hasChanges ? 'Resume updated' : 'Resume already aligned'}
          </p>
          <p className={styles.applyModal__patchCopy}>
            {hasChanges
              ? 'Your resume has been enhanced with AI suggestions to better match this job.'
              : (message ?? 'No changes were needed - your resume already fits this job well.')}
          </p>
        </div>
      </div>

      {hasChanges && (
        <div className={styles.applyModal__diffSection}>
          {visibleDiffs.map((diff) => (
            <div className={styles.applyModal__diffCard} key={diff.field}>
              <div className={styles.applyModal__diffHeader}>
                <span className={styles.applyModal__diffLabel}>{diff.label}</span>
              </div>
              <div className={styles.applyModal__diffContent}>
                {diff.old_value && (
                  <div
                    className={`${styles.applyModal__diffRow} ${styles['applyModal__diffRow--old']}`}
                  >
                    <span className={styles.applyModal__diffLabelOld}>Before</span>
                    <p
                      className={`${styles.applyModal__diffValue} ${styles['applyModal__diffValue--old']}`}
                    >
                      {diff.old_value}
                    </p>
                  </div>
                )}
                {diff.new_value && (
                  <div
                    className={`${styles.applyModal__diffRow} ${styles['applyModal__diffRow--new']}`}
                  >
                    <span className={styles.applyModal__diffLabelNew}>After</span>
                    <p
                      className={`${styles.applyModal__diffValue} ${styles['applyModal__diffValue--new']}`}
                    >
                      {diff.new_value}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.applyModal__stepActions}>
        <button className="btn btn--primary" onClick={onContinue} type="button">
          Continue to submit
        </button>
      </div>
    </div>
  )
}
