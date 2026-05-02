import { CheckCircle2 } from 'lucide-react'

import type { PatchedFieldDiff } from '@/store/services/resumeGapApi'

import styles from './applyModal.module.scss'

interface StepPatchingProps {
  isPatching: boolean
  patchedFields: string[]
  patchedDiffs?: PatchedFieldDiff[]
  onContinue: () => void
}

export default function StepPatching({
  isPatching,
  patchedFields,
  patchedDiffs,
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

  return (
    <div className={styles.applyModal__patchSuccess}>
      <div className={styles.applyModal__patchHero}>
        <div className={styles.applyModal__patchIconWrap}>
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className={styles.applyModal__patchTitle}>Resume updated</p>
          <p className={styles.applyModal__patchCopy}>
            Your resume has been enhanced with AI suggestions to better match this job.
          </p>
        </div>
      </div>

      {patchedDiffs && patchedDiffs.length > 0 && (
        <div className={styles.applyModal__diffSection} onWheel={(e) => e.stopPropagation()}>
          {patchedDiffs
            .filter((diff) => diff.old_value !== diff.new_value)
            .map((diff) => (
              <div className={styles.applyModal__diffCard} key={diff.field}>
                <div className={styles.applyModal__diffHeader}>
                  <span className={styles.applyModal__diffLabel}>{diff.label}</span>
                </div>
                <div className={styles.applyModal__diffContent}>
                  {diff.old_value && (
                    <div className={styles.applyModal__diffRow}>
                      <span className={styles.applyModal__diffLabelOld}>Before</span>
                      <p className={styles.applyModal__diffValue}>{diff.old_value}</p>
                    </div>
                  )}
                  {diff.new_value && (
                    <div className={styles.applyModal__diffRow}>
                      <span className={styles.applyModal__diffLabelNew}>After</span>
                      <p className={styles.applyModal__diffValue}>{diff.new_value}</p>
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
