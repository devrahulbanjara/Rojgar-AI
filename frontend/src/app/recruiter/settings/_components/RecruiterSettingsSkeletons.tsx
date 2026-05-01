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
        <Block width="11rem" height="1rem" />
        <Block width="6rem" height="1.75rem" radius="var(--radius-lg)" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Block key={i} width="100%" height="2.25rem" radius="var(--radius-lg)" />
      ))}
    </div>
  )
}

export function RecruiterSettingsDataSkeleton() {
  return (
    <div className={styles.page} aria-hidden="true">
      <CardSkeleton rows={4} />
      <CardSkeleton rows={3} />
      <div className={styles.dangerCard}>
        <Block width="2.25rem" height="2.25rem" radius="var(--radius-full)" />
        <div>
          <Block width="10rem" height="1rem" />
          <div style={{ height: '0.35rem' }} />
          <Block width="22rem" height="0.75rem" />
        </div>
        <Block width="7rem" height="2rem" radius="var(--radius-lg)" />
      </div>
    </div>
  )
}

export function RecruiterSettingsPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Recruiter Settings</h2>
          <p className="dash-page-header__subtitle">
            Personal workspace defaults for notifications, outreach, and interviews.
          </p>
        </div>
      </div>
      <RecruiterSettingsDataSkeleton />
    </div>
  )
}
