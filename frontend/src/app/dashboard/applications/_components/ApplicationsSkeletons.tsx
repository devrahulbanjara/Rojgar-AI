export function ApplicationsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="apps-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="app-item app-item--skeleton">
          <div className="skeleton-block applications-skeleton__logo" />
          <div className="app-item__body applications-skeleton__body">
            <div className="app-item__top applications-skeleton__top">
              <div className="skeleton-block applications-skeleton__role" />
              <div className="skeleton-block applications-skeleton__badge" />
            </div>
            <div className="skeleton-block applications-skeleton__company" />
            <div className="skeleton-block applications-skeleton__meta" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ApplicationsDetailSkeleton() {
  return (
    <div className="app-detail app-detail--skeleton" aria-hidden="true">
      <div className="app-detail__header applications-detail-skeleton__header">
        <div className="skeleton-block applications-detail-skeleton__logo" />
        <div className="applications-detail-skeleton__info">
          <div className="skeleton-block applications-detail-skeleton__title" />
          <div className="skeleton-block applications-detail-skeleton__company" />
          <div className="skeleton-block applications-detail-skeleton__location" />
        </div>
      </div>

      <div className="app-detail__section applications-detail-skeleton__section">
        <div className="skeleton-block applications-detail-skeleton__section-title" />
        <div className="skeleton-block applications-detail-skeleton__badge" />
      </div>

      <div className="app-detail__section applications-detail-skeleton__section">
        <div className="skeleton-block applications-detail-skeleton__section-title" />
        <div className="applications-detail-skeleton__timeline">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="applications-detail-skeleton__timeline-row">
              <div className="skeleton-block applications-detail-skeleton__timeline-dot" />
              <div className="applications-detail-skeleton__timeline-copy">
                <div className="skeleton-block applications-detail-skeleton__timeline-line" />
                <div className="skeleton-block applications-detail-skeleton__timeline-date" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="app-detail__section applications-detail-skeleton__section">
        <div className="skeleton-block applications-detail-skeleton__section-title" />
        <div className="skeleton-block applications-detail-skeleton__activity" />
        <div className="skeleton-block applications-detail-skeleton__activity applications-detail-skeleton__activity--short" />
      </div>

      <div className="app-detail__actions applications-detail-skeleton__actions">
        <div className="skeleton-block applications-detail-skeleton__button" />
        <div className="skeleton-block applications-detail-skeleton__button" />
      </div>
    </div>
  )
}

export function ApplicationsPageSkeleton() {
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

      <div className="apps-layout">
        <aside className="apps-layout__sidebar">
          <div className="apps-sidebar applications-sidebar-skeleton">
            <div className="skeleton-block applications-sidebar-skeleton__title" />
            <div className="applications-sidebar-skeleton__group">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton-block applications-sidebar-skeleton__row" />
              ))}
            </div>
            <div className="apps-sidebar__divider" />
            <div className="skeleton-block applications-sidebar-skeleton__title applications-sidebar-skeleton__title--short" />
            <div className="applications-sidebar-skeleton__group">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton-block applications-sidebar-skeleton__row" />
              ))}
            </div>
          </div>
        </aside>

        <div className="apps-layout__list">
          <div className="apps-search-row" aria-hidden="true">
            <div className="skeleton-block applications-page-skeleton__search" />
            <div className="skeleton-block applications-page-skeleton__results" />
          </div>
          <ApplicationsListSkeleton count={5} />
        </div>

        <aside className="apps-layout__detail">
          <ApplicationsDetailSkeleton />
        </aside>
      </div>
    </div>
  )
}
