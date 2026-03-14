export function ResumeGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="resume-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="resume-card resume-card--skeleton">
          <div className="resume-card__preview">
            <div className="resume-card__preview-inner resume-card-skeleton__preview-inner">
              <div className="skeleton-block resume-card-skeleton__preview-name" />
              <div className="skeleton-block resume-card-skeleton__preview-headline" />
              <div className="skeleton-block resume-card-skeleton__preview-divider" />
              <div className="skeleton-block resume-card-skeleton__preview-line" />
              <div className="skeleton-block resume-card-skeleton__preview-line resume-card-skeleton__preview-line--mid" />
              <div className="skeleton-block resume-card-skeleton__preview-line resume-card-skeleton__preview-line--short" />
            </div>
          </div>
          <div className="resume-card__info resume-card-skeleton__info">
            <div className="skeleton-block resume-card-skeleton__name" />
            <div className="skeleton-block resume-card-skeleton__meta" />
            <div className="resume-card-skeleton__summary">
              <div className="skeleton-block resume-card-skeleton__line" />
              <div className="skeleton-block resume-card-skeleton__line resume-card-skeleton__line--mid" />
              <div className="skeleton-block resume-card-skeleton__line resume-card-skeleton__line--short" />
            </div>
            <div className="resume-card__actions resume-card-skeleton__actions">
              <div className="skeleton-block resume-card-skeleton__button" />
              <div className="skeleton-block resume-card-skeleton__button" />
              <div className="skeleton-block resume-card-skeleton__button" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ResumePageSkeleton() {
  return (
    <div className="dash-content container" aria-hidden="true">
      <div className="dash-page-header resume-page-skeleton__header">
        <div className="dash-page-header__left resume-page-skeleton__header-left">
          <div className="skeleton-block resume-page-skeleton__title" />
          <div className="skeleton-block resume-page-skeleton__subtitle" />
        </div>
        <div className="dash-page-header__actions">
          <div className="skeleton-block resume-page-skeleton__action" />
        </div>
      </div>
      <ResumeGridSkeleton count={5} />
    </div>
  )
}
