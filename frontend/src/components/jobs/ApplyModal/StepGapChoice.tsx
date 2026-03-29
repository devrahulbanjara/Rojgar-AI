import { ArrowRight, SearchCheck } from 'lucide-react'

import styles from './applyModal.module.scss'

interface StepGapChoiceProps {
  onAnalyze: () => void
  onSkip: () => void
}

export default function StepGapChoice({ onAnalyze, onSkip }: StepGapChoiceProps) {
  return (
    <div className={styles.applyModal__body}>
      <p className={styles.applyModal__intro}>
        Want a quick check before you submit? We can compare your selected resume with the job and
        suggest improvements first.
      </p>

      <button
        className={`${styles.applyModal__choiceCard} ${styles['applyModal__choiceCard--primary']}`}
        onClick={onAnalyze}
        type="button"
      >
        <span className={styles.applyModal__choiceIcon}>
          <SearchCheck size={18} />
        </span>
        <div>
          <p className={styles.applyModal__choiceTitle}>Identify resume gaps</p>
          <p className={styles.applyModal__choiceDescription}>
            See what is missing, where you already look strong, and get safe suggestions before
            applying.
          </p>
        </div>
        <ArrowRight className={styles.applyModal__choiceArrow} size={16} />
      </button>

      <button className={styles.applyModal__choiceCard} onClick={onSkip} type="button">
        <span className={styles.applyModal__choiceIcon}>
          <ArrowRight size={18} />
        </span>
        <div>
          <p className={styles.applyModal__choiceTitle}>Apply directly</p>
          <p className={styles.applyModal__choiceDescription}>
            Skip the gap check and submit the selected resume as it is.
          </p>
        </div>
      </button>
    </div>
  )
}
