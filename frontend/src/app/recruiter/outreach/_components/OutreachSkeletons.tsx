// ─── Recruiter Outreach Skeleton Components ───────────────────────────────────
// Mirrors the exact structure of RecruiterOutreachPage for seamless
// skeleton → content transitions.
//
// Layout: dash-grid dash-grid--2col
//   Left card  — draft list items (app-item rows)
//   Right card — draft detail editor (name, email, subject input, body textarea, actions)

// ---------------------------------------------------------------------------
// Draft list skeleton (left panel)
// ---------------------------------------------------------------------------
export function OutreachDraftListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body dash-card__body--no-top">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="app-item app-item--skeleton">
            <div className="app-item__body">
              <div className="app-item__top outreach-skeleton__item-top">
                <div className="skeleton-block outreach-skeleton__item-name" />
                <div className="skeleton-block outreach-skeleton__item-badge" />
              </div>
              <div className="skeleton-block outreach-skeleton__item-subject" />
              <div className="app-item__meta outreach-skeleton__item-meta">
                <div className="skeleton-block outreach-skeleton__item-email" />
                <div className="skeleton-block outreach-skeleton__item-score" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Draft detail skeleton (right panel)
// ---------------------------------------------------------------------------
export function OutreachDraftDetailSkeleton() {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body">
        {/* Candidate name + email */}
        <div className="skeleton-block outreach-skeleton__detail-name" />
        <div className="skeleton-block outreach-skeleton__detail-email" style={{ marginTop: '0.375rem', marginBottom: '1rem' }} />

        {/* Subject field */}
        <div className="skeleton-block outreach-skeleton__detail-label" />
        <div className="skeleton-block outreach-skeleton__detail-input" style={{ marginTop: '0.375rem' }} />

        {/* Body textarea */}
        <div className="skeleton-block outreach-skeleton__detail-label" style={{ marginTop: '1rem' }} />
        <div className="skeleton-block outreach-skeleton__detail-textarea" style={{ marginTop: '0.375rem' }} />

        {/* Action buttons */}
        <div className="cell-actions" style={{ marginTop: '1rem' }}>
          <div className="skeleton-block outreach-skeleton__detail-action" />
          <div className="skeleton-block outreach-skeleton__detail-action" />
          <div className="skeleton-block outreach-skeleton__detail-action" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full page skeleton — used in loading.tsx
// ---------------------------------------------------------------------------
export function OutreachPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      {/* Page header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block outreach-skeleton__page-title" />
          <div className="skeleton-block outreach-skeleton__page-subtitle" />
        </div>
        <div className="dash-page-header__actions">
          {/* select + 2 buttons */}
          <div className="skeleton-block outreach-skeleton__select" />
          <div className="skeleton-block outreach-skeleton__header-btn" />
          <div className="skeleton-block outreach-skeleton__header-btn" />
        </div>
      </div>

      <div className="dash-grid dash-grid--2col">
        <OutreachDraftListSkeleton rows={5} />
        <OutreachDraftDetailSkeleton />
      </div>
    </div>
  )
}
