export function ResumeTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Resume Title</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="skeleton-block resume-table-skeleton__title" />
                </td>
                <td>
                  <div className="skeleton-block resume-table-skeleton__updated" />
                </td>
                <td>
                  <div className="skeleton-block resume-table-skeleton__menu" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
      <ResumeTableSkeleton rows={6} />
    </div>
  )
}
