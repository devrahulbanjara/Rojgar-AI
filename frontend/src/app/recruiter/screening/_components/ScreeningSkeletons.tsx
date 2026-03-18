// ─── Screening Skeleton Components ──────────────────────────────────────────
// Mirrors the exact structure of RecruiterScreeningPage for seamless
// skeleton-to-content transitions.

// ---------------------------------------------------------------------------
// Status Card Skeleton — "Shortlisting Status" card at the top
// ---------------------------------------------------------------------------
export function ScreeningStatusCardSkeleton() {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body recruiter-summary__body">
        <div className="skeleton-block screening-skeleton__card-title" />
        <div className="cell-actions">
          <div className="skeleton-block screening-skeleton__badge" />
          <div className="skeleton-block screening-skeleton__badge-meta" />
          <div className="skeleton-block screening-skeleton__run-btn" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table Skeleton — applications table rows
// ---------------------------------------------------------------------------
export function ScreeningTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body">
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th><div className="skeleton-block screening-skeleton__th" /></th>
                <th><div className="skeleton-block screening-skeleton__th screening-skeleton__th--email" /></th>
                <th><div className="skeleton-block screening-skeleton__th screening-skeleton__th--short" /></th>
                <th><div className="skeleton-block screening-skeleton__th screening-skeleton__th--long" /></th>
                <th><div className="skeleton-block screening-skeleton__th screening-skeleton__th--short" /></th>
                <th><div className="skeleton-block screening-skeleton__th" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  <td><div className="skeleton-block screening-skeleton__td-name" /></td>
                  <td><div className="skeleton-block screening-skeleton__td-email" /></td>
                  <td><div className="skeleton-block screening-skeleton__td-badge" /></td>
                  <td>
                    <div className="skeleton-block screening-skeleton__td-feedback" />
                    <div className="skeleton-block screening-skeleton__td-feedback screening-skeleton__td-feedback--short" style={{ marginTop: '0.25rem' }} />
                  </td>
                  <td><div className="skeleton-block screening-skeleton__td-status" /></td>
                  <td>
                    <div className="cell-actions">
                      <div className="skeleton-block screening-skeleton__td-action" />
                      <div className="skeleton-block screening-skeleton__td-action" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full page skeleton — used in loading.tsx for instant route-level display
// Mirrors: page header (static shell) + job select (shows as skeleton) +
//          status card + applications table
// ---------------------------------------------------------------------------
export function ScreeningPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      {/* Page Header — same structure as the real header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block screening-skeleton__page-title" />
          <div className="skeleton-block screening-skeleton__page-subtitle" />
        </div>
        <div className="dash-page-header__actions">
          {/* Job select dropdown as skeleton */}
          <div className="skeleton-block screening-skeleton__select" />
        </div>
      </div>

      {/* Content stack */}
      <div className="dashboard-overview-stack">
        <ScreeningStatusCardSkeleton />
        <ScreeningTableSkeleton rows={6} />
      </div>
    </div>
  )
}
