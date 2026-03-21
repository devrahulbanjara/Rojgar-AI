// ─── Screening Skeleton Components ──────────────────────────────────────────
// Mirrors the exact structure of RecruiterScreeningPage for seamless
// skeleton-to-content transitions.

// ---------------------------------------------------------------------------
// Status Card Skeleton — "Shortlisting Status" card at the top
// ---------------------------------------------------------------------------
export function ScreeningStatusCardSkeleton() {
  return (
    <div className="dash-card" aria-hidden="true" style={{ marginBottom: '2rem' }}>
      <div
        className="dash-card__body"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div className="dash-card__title" style={{ margin: 0 }}>
          Shortlisting Status
        </div>
        <div className="skeleton-block screening-skeleton__badge" />
        <div className="skeleton-block screening-skeleton__badge-meta" />
        <div className="skeleton-block screening-skeleton__run-btn" />
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
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Email</th>
              <th>Score</th>
              <th>Feedback</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="skeleton-block screening-skeleton__td-name" />
                </td>
                <td>
                  <div className="skeleton-block screening-skeleton__td-email" />
                </td>
                <td>
                  <div className="skeleton-block screening-skeleton__td-badge" />
                </td>
                <td>
                  <div className="skeleton-block screening-skeleton__td-feedback" />
                  <div
                    className="skeleton-block screening-skeleton__td-feedback screening-skeleton__td-feedback--short"
                    style={{ marginTop: '0.25rem' }}
                  />
                </td>
                <td>
                  <div className="skeleton-block screening-skeleton__td-status" />
                </td>
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
          <h2 className="dash-page-header__title">Screening</h2>
          <p className="dash-page-header__subtitle">
            Run AI screening, review ranked candidates, and finalize the shortlist.
          </p>
        </div>
        <div className="dash-page-header__actions">
          {/* Job select dropdowns as skeleton */}
          <div className="cell-actions" style={{ gap: '0.75rem' }}>
            <div className="skeleton-block screening-skeleton__select" />
            <div className="skeleton-block screening-skeleton__select" />
          </div>
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
