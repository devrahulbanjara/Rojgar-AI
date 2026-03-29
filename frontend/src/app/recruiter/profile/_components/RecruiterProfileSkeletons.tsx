export function RecruiterProfileDataSkeleton() {
  return (
    <div className="profile-layout" aria-hidden="true">
      {/* ── Aside: avatar + info card skeleton ── */}
      <aside className="profile-layout__aside">
        <div className="profile-aside-card profile-aside-card--skeleton">
          <div className="profile-media-control">
            <div className="skeleton-block profile-skeleton__avatar" />
            <div className="profile-media-actions">
              <div className="skeleton-block profile-skeleton__button profile-skeleton__button--sm" />
              <div className="skeleton-block profile-skeleton__button profile-skeleton__button--sm" />
            </div>
          </div>
          <div className="skeleton-block profile-skeleton__name" />
          <div className="skeleton-block profile-skeleton__headline" />
          <div className="profile-aside-card__divider" />
          <div className="profile-aside-card__location">
            <div className="skeleton-block profile-skeleton__line profile-skeleton__line--icon" />
          </div>
          <div className="profile-aside-card__location">
            <div className="skeleton-block profile-skeleton__line profile-skeleton__line--icon" />
          </div>
          <div className="profile-aside-card__location">
            <div className="skeleton-block profile-skeleton__line profile-skeleton__line--icon" />
          </div>
        </div>
      </aside>

      {/* ── Main: sections skeleton ── */}
      <div className="profile-layout__main">
        <div className="profile-section profile-section--skeleton">
          {/* Basic Info block */}
          <div className="profile-block profile-block--skeleton">
            <div className="profile-block__header profile-skeleton__block-header">
              <div className="skeleton-block profile-skeleton__block-title" />
              <div className="skeleton-block profile-skeleton__button" />
            </div>
            <div className="resume-form-grid">
              <div className="resume-field">
                <div className="skeleton-block profile-skeleton__info-label" />
                <div className="skeleton-block profile-skeleton__info-value" />
              </div>
              <div className="resume-field">
                <div className="skeleton-block profile-skeleton__info-label" />
                <div className="skeleton-block profile-skeleton__info-value" />
              </div>
            </div>
          </div>

          {/* Password block */}
          <div className="profile-block profile-block--skeleton">
            <div className="profile-block__header profile-skeleton__block-header">
              <div className="skeleton-block profile-skeleton__block-title" />
              <div className="skeleton-block profile-skeleton__button" />
            </div>
            <div className="profile-skeleton__copy">
              <div className="skeleton-block profile-skeleton__line" />
            </div>
            <div className="resume-form-grid">
              <div className="resume-field">
                <div className="skeleton-block profile-skeleton__info-label" />
                <div className="skeleton-block profile-skeleton__info-value" />
              </div>
              <div className="resume-field">
                <div className="skeleton-block profile-skeleton__info-label" />
                <div className="skeleton-block profile-skeleton__info-value" />
              </div>
              <div className="resume-field">
                <div className="skeleton-block profile-skeleton__info-label" />
                <div className="skeleton-block profile-skeleton__info-value" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RecruiterProfilePageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Profile</h2>
          <p className="dash-page-header__subtitle">
            Manage your account details, photo, and password.
          </p>
        </div>
      </div>
      <RecruiterProfileDataSkeleton />
    </div>
  )
}
