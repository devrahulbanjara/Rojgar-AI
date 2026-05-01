import styles from '../page.module.scss'

export function JobsPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block" style={{ width: '8rem', height: '1.5rem' }} />
          <div
            className="skeleton-block"
            style={{ width: '20rem', maxWidth: '100%', height: '0.875rem', marginTop: '0.5rem' }}
          />
        </div>
        <div className="dash-page-header__actions">
          <div className="skeleton-block" style={{ width: '8rem', height: '0.75rem' }} />
        </div>
      </div>

      <div
        className="skeleton-block"
        style={{ width: '100%', height: '3rem', borderRadius: 'var(--radius-xl)' }}
      />

      <div className={styles.skeleton}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  )
}
