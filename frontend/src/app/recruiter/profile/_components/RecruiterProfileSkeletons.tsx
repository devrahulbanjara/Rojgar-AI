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
        <Block width="6rem" height="1.75rem" radius="var(--radius-lg)" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Block key={i} width="100%" height="0.875rem" />
      ))}
    </div>
  )
}

export function RecruiterProfileDataSkeleton() {
  return (
    <div className={styles.page} aria-hidden="true">
      <div className={styles.identityCard}>
        <Block width="5rem" height="5rem" radius="var(--radius-full)" />
        <div className={styles.identityBody}>
          <Block width="14rem" height="1.5rem" />
          <Block width="22rem" height="0.875rem" />
        </div>
      </div>
      <CardSkeleton rows={3} />
      <CardSkeleton rows={4} />
      <CardSkeleton rows={2} />
    </div>
  )
}

export function RecruiterProfilePageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Your account</h2>
          <p className="dash-page-header__subtitle">Manage your details, photo, and password.</p>
        </div>
      </div>
      <RecruiterProfileDataSkeleton />
    </div>
  )
}
