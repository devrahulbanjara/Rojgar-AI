type JobCardsSkeletonProps = {
  count?: number
}

export function JobCardsSkeleton({ count = 5 }: JobCardsSkeletonProps) {
  return (
    <div className="job-list-stack" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="job-card job-card--skeleton">
          <div className="job-card__header">
            <div className="skeleton-block job-card-skeleton__logo" />
            <div className="job-card__title-wrap job-card-skeleton__title-wrap">
              <div className="skeleton-block job-card-skeleton__title" />
              <div className="skeleton-block job-card-skeleton__company" />
            </div>
          </div>

          <div className="job-card__tags">
            <div className="skeleton-block job-card-skeleton__tag" />
            <div className="skeleton-block job-card-skeleton__tag job-card-skeleton__tag--mid" />
            <div className="skeleton-block job-card-skeleton__tag job-card-skeleton__tag--short" />
          </div>

          <div className="job-card__meta job-card-skeleton__meta">
            <div className="skeleton-block job-card-skeleton__meta-item" />
            <div className="skeleton-block job-card-skeleton__meta-item job-card-skeleton__meta-item--short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function JobPreviewSkeleton() {
  return (
    <div className="job-preview job-preview--skeleton" aria-hidden="true">
      <div className="skeleton-block job-preview-skeleton__cover" />

      <div className="job-preview__header job-preview-skeleton__header">
        <div className="skeleton-block job-preview-skeleton__title" />
        <div className="skeleton-block job-preview-skeleton__company" />
        <div className="skeleton-block job-preview-skeleton__location" />
      </div>

      <div className="job-preview__chips job-preview-skeleton__chips">
        <div className="skeleton-block job-preview-skeleton__chip" />
        <div className="skeleton-block job-preview-skeleton__chip job-preview-skeleton__chip--wide" />
      </div>

      <div className="job-preview__overview job-preview-skeleton__overview">
        <div className="skeleton-block job-preview-skeleton__line job-preview-skeleton__line--full" />
        <div className="skeleton-block job-preview-skeleton__line job-preview-skeleton__line--long" />
        <div className="skeleton-block job-preview-skeleton__line job-preview-skeleton__line--mid" />
        <div className="skeleton-block job-preview-skeleton__line job-preview-skeleton__line--short" />
      </div>

      <div className="job-preview__cta job-preview-skeleton__cta">
        <div className="skeleton-block job-preview-skeleton__button" />
        <div className="skeleton-block job-preview-skeleton__button" />
      </div>
    </div>
  )
}

export function JobsPageSkeleton() {
  return (
    <div className="dash-content container" aria-hidden="true">
      <div className="dash-page-header applications-page-skeleton__header">
        <div className="dash-page-header__left applications-page-skeleton__header-left">
          <div className="skeleton-block applications-page-skeleton__title" />
          <div className="skeleton-block applications-page-skeleton__subtitle" />
        </div>
        <div className="dash-page-header__actions">
          <div className="skeleton-block applications-page-skeleton__hint" />
        </div>
      </div>

      <div className="jobs-layout jobs-layout--skeleton">
        <div className="jobs-layout__sidebar jobs-skeleton__sidebar">
          <div className="skeleton-block jobs-skeleton__sidebar-title" />

          <div className="jobs-skeleton__filter-group">
            <div className="skeleton-block jobs-skeleton__filter-label" />
            <div className="skeleton-block jobs-skeleton__filter-control jobs-skeleton__filter-control--pill" />
          </div>

          <div className="jobs-skeleton__filter-group">
            <div className="skeleton-block jobs-skeleton__filter-label jobs-skeleton__filter-label--short" />
            <div className="skeleton-block jobs-skeleton__filter-control jobs-skeleton__filter-control--pill" />
          </div>

          <div className="jobs-skeleton__filter-group">
            <div className="skeleton-block jobs-skeleton__filter-label" />
            <div className="skeleton-block jobs-skeleton__filter-control jobs-skeleton__filter-control--pill" />
          </div>

          <div className="jobs-skeleton__filter-group jobs-skeleton__filter-group--last">
            <div className="skeleton-block jobs-skeleton__filter-label jobs-skeleton__filter-label--mid" />
            <div className="jobs-skeleton__salary-row">
              <div className="skeleton-block jobs-skeleton__filter-control" />
              <div className="skeleton-block jobs-skeleton__filter-control" />
            </div>
          </div>
        </div>

        <div>
          <div className="dash-page-toolbar" aria-hidden="true">
            <div className="skeleton-block dash-page-toolbar__skeleton-field" />
            <div className="skeleton-block dash-page-toolbar__skeleton-button" />
          </div>
          <JobCardsSkeleton count={5} />
        </div>

        <JobPreviewSkeleton />
      </div>
    </div>
  )
}
