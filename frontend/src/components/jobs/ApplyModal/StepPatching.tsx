import type { PatchedFieldDiff } from '@/store/services/resumeGapApi'
import { CheckCircle2, FileDiff } from 'lucide-react'

import styles from './applyModal.module.scss'

type StepPatchingMode = 'loading' | 'preview' | 'committing' | 'committed'

interface StepPatchingProps {
  mode: StepPatchingMode
  patchedDiffs?: PatchedFieldDiff[]
  message?: string
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export default function StepPatching({ mode, patchedDiffs, message }: StepPatchingProps) {
  if (mode === 'loading' || mode === 'committing') {
    const isCommitting = mode === 'committing'
    return (
      <div className={styles.applyModal__loading}>
        <div className={styles.applyModal__loadingDots}>
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
          <span className={styles.applyModal__loadingDot} />
        </div>
        <div>
          <p className={styles.applyModal__loadingTitle}>
            {isCommitting ? 'Saving changes to your resume' : 'Drafting proposed changes'}
          </p>
          <p className={styles.applyModal__loadingCopy}>
            {isCommitting
              ? 'Persisting the confirmed AI updates.'
              : 'Comparing the job to your resume and preparing a safe rewrite — nothing is saved yet.'}
          </p>
        </div>
      </div>
    )
  }

  const visibleDiffs = (patchedDiffs ?? []).filter(
    (diff) => normalize(diff.old_value) !== normalize(diff.new_value),
  )
  const hasChanges = visibleDiffs.length > 0
  const isPreview = mode === 'preview'

  const heroIcon = isPreview ? <FileDiff size={20} /> : <CheckCircle2 size={20} />
  const heroTitle = isPreview
    ? hasChanges
      ? 'Proposed updates (not yet saved)'
      : 'No changes proposed'
    : hasChanges
      ? 'Resume updated'
      : 'Resume already aligned'
  const heroCopy = isPreview
    ? hasChanges
      ? 'Review the red/green diff below. Your resume is unchanged until you confirm.'
      : (message ?? 'Your resume already fits this job well — nothing to update.')
    : hasChanges
      ? 'These changes are now part of your resume. You can apply to this job or close this dialog.'
      : (message ?? 'No changes were needed — your resume already fits this job well.')

  return (
    <div className={styles.applyModal__patchSuccess}>
      <div className={styles.applyModal__patchHero}>
        <div className={styles.applyModal__patchIconWrap}>{heroIcon}</div>
        <div>
          <p className={styles.applyModal__patchTitle}>{heroTitle}</p>
          <p className={styles.applyModal__patchCopy}>{heroCopy}</p>
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
    </div>
  )
}
