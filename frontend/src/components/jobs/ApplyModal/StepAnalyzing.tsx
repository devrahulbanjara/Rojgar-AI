import styles from './applyModal.module.scss'

export default function StepAnalyzing() {
  return (
    <div className={styles.applyModal__loading}>
      <div className={styles.applyModal__loadingDots}>
        <span className={styles.applyModal__loadingDot} />
        <span className={styles.applyModal__loadingDot} />
        <span className={styles.applyModal__loadingDot} />
      </div>
      <div>
        <p className={styles.applyModal__loadingTitle}>Analyzing your resume</p>
        <p className={styles.applyModal__loadingCopy}>
          Comparing your experience, skills, and summary against the job requirements.
        </p>
      </div>
    </div>
  )
}
