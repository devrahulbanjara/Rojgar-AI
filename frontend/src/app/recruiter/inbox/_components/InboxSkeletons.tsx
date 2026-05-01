import styles from '../page.module.scss'

function Block({ width, height, radius }: { width: string; height: string; radius?: string }) {
  return (
    <div
      className="skeleton-block"
      style={{ width, height, borderRadius: radius ?? 'var(--radius-md)' }}
    />
  )
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardHeader}>
        <Block width="9rem" height="1rem" />
        <Block width="3rem" height="1.25rem" radius="var(--radius-full)" />
      </div>
      <Block width="100%" height="0.75rem" />
      <div className={styles.list}>
        {Array.from({ length: rows }).map((_, i) => (
          <Block key={i} width="100%" height="3rem" radius="var(--radius-lg)" />
        ))}
      </div>
    </div>
  )
}

export function RecruiterInboxSkeleton() {
  return (
    <div className={styles.page} aria-hidden="true">
      <div className={styles.col}>
        <CardSkeleton rows={2} />
        <CardSkeleton rows={4} />
      </div>
      <div className={styles.col}>
        <CardSkeleton rows={5} />
      </div>
    </div>
  )
}
