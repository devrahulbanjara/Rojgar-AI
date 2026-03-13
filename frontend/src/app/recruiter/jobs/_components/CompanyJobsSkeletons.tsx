export function CompanyJobsCardsSkeleton({
  view,
  count = 4,
}: {
  view: 'grid' | 'list'
  count?: number
}) {
  return (
    <div className={`company-jobs-cards company-jobs-cards--${view}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`company-job-card company-job-card--skeleton${view === 'grid' ? ' company-job-card--grid' : ''}`}
        >
          <div className="company-job-card__top-row company-job-skeleton__top-row">
            <div className="skeleton-block company-job-skeleton__status" />
          </div>

          <div className="skeleton-block company-job-skeleton__title" />

          <div className="company-job-card__location company-job-skeleton__meta-row">
            <div className="skeleton-block company-job-skeleton__icon" />
            <div className="skeleton-block company-job-skeleton__line company-job-skeleton__line--mid" />
          </div>

          <div className="company-job-card__salary company-job-skeleton__meta-row">
            <div className="skeleton-block company-job-skeleton__icon" />
            <div className="skeleton-block company-job-skeleton__line company-job-skeleton__line--long" />
          </div>

          <div className="company-job-card__divider" />

          <div className="company-job-card__footer company-job-skeleton__footer">
            <div className="company-job-card__footer-meta company-job-skeleton__footer-meta">
              <div className="skeleton-block company-job-skeleton__link" />
              <div className="skeleton-block company-job-skeleton__date" />
            </div>

            <div className="company-job-card__actions">
              <div className="skeleton-block company-job-skeleton__action" />
              <div className="skeleton-block company-job-skeleton__action" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
