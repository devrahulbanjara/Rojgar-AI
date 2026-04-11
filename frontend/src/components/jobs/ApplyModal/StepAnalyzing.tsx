import styles from './applyModal.module.scss'

interface StepAnalyzingProps {
  title?: string
  subtitle?: string
}

export default function StepAnalyzing({
  title = 'Analyzing your resume',
  subtitle = 'Comparing your experience, skills, and summary against the job requirements.',
}: StepAnalyzingProps) {
  return (
    <div className={styles.applyModal__loading}>
      <div className={styles.applyModal__loadingDots}>
        <span className={styles.applyModal__loadingDot} />
        <span className={styles.applyModal__loadingDot} />
        <span className={styles.applyModal__loadingDot} />
      </div>
      <div>
        <p className={styles.applyModal__loadingTitle}>{title}</p>
        <p className={styles.applyModal__loadingCopy}>{subtitle}</p>
      </div>
    </div>
  )
}
