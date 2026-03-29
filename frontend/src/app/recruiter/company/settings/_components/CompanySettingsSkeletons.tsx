// ─── Company Settings Skeleton Components ──────────────────────────────
// Mirrors the exact structure of CompanySettingsPage for seamless
// skeleton → content transitions.

export function CompanySettingsDataSkeleton() {
  return (
    <div className="profile-layout" aria-hidden="true">
      {/* ── Aside: logo + info card skeleton ── */}
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
          <div
            className="skeleton-block profile-skeleton__block-title"
            style={{ marginBottom: '0.5rem' }}
          />
          <div className="profile-skeleton__copy" style={{ marginBottom: '1rem' }}>
            <div className="skeleton-block profile-skeleton__line" />
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
      </aside>

      {/* ── Main: company information skeleton ── */}
      <div className="profile-layout__main">
        <div className="profile-section profile-section--skeleton">
          <div className="profile-block profile-block--skeleton">
            <div className="profile-block__header profile-skeleton__block-header">
              <div className="skeleton-block profile-skeleton__block-title" />
              <div className="skeleton-block profile-skeleton__button" />
            </div>
            <div className="resume-form-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="resume-field">
                  <div className="skeleton-block profile-skeleton__info-label" />
                  <div className="skeleton-block profile-skeleton__info-value" />
                </div>
              ))}
            </div>
            <div className="resume-field">
              <div className="skeleton-block profile-skeleton__info-label" />
              <div
                className="skeleton-block profile-skeleton__line"
                style={{ height: '8rem', marginTop: '0.5rem' }}
              />
            </div>
            <div className="resume-field">
              <div className="skeleton-block profile-skeleton__info-label" />
              <div className="skeleton-block profile-skeleton__info-value" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompanySettingsPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Company Settings</h2>
          <p className="dash-page-header__subtitle">
            Update your public company profile and hiring brand assets.
          </p>
        </div>
      </div>
      <CompanySettingsDataSkeleton />
    </div>
  )
}
