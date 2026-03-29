export default function Loading() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <div className="skeleton-block rec-apps-skeleton__page-title" />
          <div className="skeleton-block rec-apps-skeleton__page-subtitle" />
        </div>
      </div>
      <div className="dash-card">
        <div className="dash-card__body">
          <div className="skeleton-block applications-page-skeleton__search" />
        </div>
      </div>
      <div className="dash-card">
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Status</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td>
                    <div className="cell-user">
                      <div className="skeleton-block rec-apps-skeleton__avatar" />
                      <div className="skeleton-block rec-apps-skeleton__name" />
                    </div>
                  </td>
                  <td>
                    <div className="skeleton-block rec-apps-skeleton__job" />
                  </td>
                  <td>
                    <div className="skeleton-block rec-apps-skeleton__badge" />
                  </td>
                  <td>
                    <div className="skeleton-block rec-apps-skeleton__date" />
                  </td>
                  <td>
                    <div className="skeleton-block screening-skeleton__td-action" />
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
