export function ProfileDataSkeleton() {
  return (
    <div className="profile-layout" aria-hidden="true">
      <aside className="profile-layout__aside">
        <div className="profile-aside-card profile-aside-card--skeleton">
          <div
            className="profile-completion profile-skeleton__completion"
            style={{ marginBottom: '1.5rem' }}
          >
            <div className="profile-completion__header">
              <div className="skeleton-block profile-skeleton__completion-label" />
              <div className="skeleton-block profile-skeleton__completion-pct" />
            </div>
            <div className="skeleton-block profile-skeleton__completion-bar" />
          </div>
          <div className="skeleton-block profile-skeleton__avatar" />
          <div className="skeleton-block profile-skeleton__name" />
          <div className="skeleton-block profile-skeleton__headline" />
          <div className="skeleton-block profile-skeleton__location" />
          <div
            className="open-to-work-status open-to-work-status--skeleton"
            style={{ padding: '0.25rem 0', marginTop: '0.25rem' }}
          >
            <div
              className="skeleton-block"
              style={{ width: '8px', height: '8px', borderRadius: '50%' }}
            />
            <div className="skeleton-block" style={{ width: '120px', height: '14px' }} />
            <div
              className="skeleton-block"
              style={{ width: '50px', height: '14px', marginLeft: 'auto' }}
            />
          </div>
          <div className="profile-aside-card__divider" />
          <div className="profile-aside-card__stats">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="profile-aside-card__stat profile-skeleton__stat">
                <div className="skeleton-block profile-skeleton__stat-value" />
                <div className="skeleton-block profile-skeleton__stat-label" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="profile-layout__main">
        <div className="team-tabs" role="tablist" aria-label="Profile sections" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="team-tabs__btn"
              style={{ opacity: 0.5, pointerEvents: 'none' }}
            >
              <div className="skeleton-block" style={{ width: '60px', height: '14px' }} />
            </div>
          ))}
        </div>

        <div className="profile-section profile-section--skeleton">
          <div className="profile-block profile-block--skeleton">
            <div className="profile-block__header profile-skeleton__block-header">
              <div className="skeleton-block profile-skeleton__block-title" />
              <div className="skeleton-block profile-skeleton__button" />
            </div>
            <div className="profile-info-grid profile-skeleton__info-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="profile-info-item profile-skeleton__info-item">
                  <div className="skeleton-block profile-skeleton__info-label" />
                  <div className="skeleton-block profile-skeleton__info-value" />
                </div>
              ))}
            </div>
          </div>

          <div className="profile-block profile-block--skeleton">
            <div className="profile-block__header profile-skeleton__block-header">
              <div className="skeleton-block profile-skeleton__block-title profile-skeleton__block-title--wide" />
              <div className="skeleton-block profile-skeleton__button" />
            </div>
            <div className="profile-skeleton__copy">
              <div className="skeleton-block profile-skeleton__line" />
              <div className="skeleton-block profile-skeleton__line profile-skeleton__line--mid" />
              <div className="skeleton-block profile-skeleton__line profile-skeleton__line--short" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="dash-content container" aria-hidden="true">
      <div className="dash-page-header profile-page-skeleton__header">
        <div className="dash-page-header__left profile-page-skeleton__header-left">
          <div className="skeleton-block profile-page-skeleton__title" />
          <div className="skeleton-block profile-page-skeleton__subtitle" />
        </div>
        <div className="dash-page-header__actions profile-page-skeleton__actions">
          <div className="skeleton-block profile-page-skeleton__hint" />
          <div className="skeleton-block profile-page-skeleton__cta" />
        </div>
      </div>
      <ProfileDataSkeleton />
    </div>
  )
}
