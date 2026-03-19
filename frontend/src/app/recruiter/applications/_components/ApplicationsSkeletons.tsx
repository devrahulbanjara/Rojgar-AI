// ─── Recruiter Applications Skeleton Components ──────────────────────────────
// Mirrors the exact structure of CompanyApplicationsPage for seamless
// skeleton → content transitions.

// ---------------------------------------------------------------------------
// Applications table skeleton — shown while the API query is in-flight
// ---------------------------------------------------------------------------
export function RecruiterApplicationsTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>
                <div className="skeleton-block rec-apps-skeleton__th" />
              </th>
              <th>
                <div className="skeleton-block rec-apps-skeleton__th rec-apps-skeleton__th--email" />
              </th>
              <th>
                <div className="skeleton-block rec-apps-skeleton__th rec-apps-skeleton__th--mid" />
              </th>
              <th>
                <div className="skeleton-block rec-apps-skeleton__th rec-apps-skeleton__th--short" />
              </th>
              <th>
                <div className="skeleton-block rec-apps-skeleton__th rec-apps-skeleton__th--short" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {/* Applicant — avatar + name */}
                <td>
                  <div className="cell-user">
                    <div className="skeleton-block rec-apps-skeleton__avatar" />
                    <div className="skeleton-block rec-apps-skeleton__name" />
                  </div>
                </td>
                {/* Email */}
                <td>
                  <div className="skeleton-block rec-apps-skeleton__email" />
                </td>
                {/* Job */}
                <td>
                  <div className="skeleton-block rec-apps-skeleton__job" />
                </td>
                {/* Status badge */}
                <td>
                  <div className="skeleton-block rec-apps-skeleton__badge" />
                </td>
                {/* Applied date */}
                <td>
                  <div className="skeleton-block rec-apps-skeleton__date" />
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
// Header title/subtitle are static (render immediately); only the table body
// is skeleton'd here for the loading.tsx case.
// ---------------------------------------------------------------------------
export function RecruiterApplicationsPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      {/* Page header */}
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block rec-apps-skeleton__page-title" />
          <div className="skeleton-block rec-apps-skeleton__page-subtitle" />
        </div>
      </div>

      <RecruiterApplicationsTableSkeleton rows={7} />
    </div>
  )
}
