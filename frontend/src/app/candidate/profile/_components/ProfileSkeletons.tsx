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
        <Block width="4rem" height="1.75rem" radius="var(--radius-lg)" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Block key={i} width="100%" height="0.875rem" />
      ))}
    </div>
  )
}

export function ProfileDataSkeleton() {
  return (
    <div className={styles.page} aria-hidden="true">
      <div className={styles.identityCard}>
        <Block width="6rem" height="6rem" radius="var(--radius-full)" />
        <div className={styles.identityBody}>
          <Block width="14rem" height="1.5rem" />
          <Block width="22rem" height="0.875rem" />
          <Block width="18rem" height="0.75rem" />
        </div>
        <div className={styles.identityActions}>
          <Block width="10rem" height="2rem" radius="var(--radius-full)" />
          <Block width="100%" height="2.25rem" />
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.mainCol}>
          <CardSkeleton rows={6} />
          <CardSkeleton rows={3} />
        </div>
        <div className={styles.sideCol}>
          <CardSkeleton rows={2} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <Block width="9rem" height="1.5rem" />
          <Block width="22rem" height="0.875rem" />
        </div>
        <div className="dash-page-header__actions">
          <Block width="9rem" height="2rem" radius="var(--radius-lg)" />
        </div>
      </div>
      <ProfileDataSkeleton />
    </div>
  )
}
