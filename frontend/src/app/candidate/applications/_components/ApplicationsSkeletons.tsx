import appStyles from '../page.module.scss'

export function ApplicationsPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block" style={{ width: '11rem', height: '1.5rem' }} />
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

      <div className={appStyles.skeleton}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={appStyles.skeletonCard} />
        ))}
      </div>
    </div>
  )
}
