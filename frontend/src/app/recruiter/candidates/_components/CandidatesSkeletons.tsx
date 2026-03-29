export function CandidatesTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="dash-card">
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Applications</th>
              <th>Latest status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="cell-user">
                    <div className="skeleton-block cell-user__avatar cell-user__avatar--sm" />
                    <div className="recruiter-candidates-table__identity">
                      <div
                        className="skeleton-block recruiter-candidates-table__name"
                        style={{ width: '120px', height: '1.125rem' }}
                      />
                      <div
                        className="skeleton-block recruiter-candidates-table__meta"
                        style={{ width: '160px', height: '0.875rem', marginTop: '4px' }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="skeleton-block" style={{ width: '160px', height: '1.125rem' }} />
                </td>
                <td>
                  <div
                    className="skeleton-block"
                    style={{ width: '80px', height: '1.5rem', borderRadius: '1rem' }}
                  />
                </td>
                <td>
                  <div className="skeleton-block" style={{ width: '100px', height: '1.125rem' }} />
                </td>
                <td>
                  <div
                    className="skeleton-block"
                    style={{ width: '88px', height: '2rem', borderRadius: '999px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CandidateDetailSkeleton() {
  return (
    <div className="recruiter-candidate-detail">
      <div className="dash-card">
        <div className="dash-card__body recruiter-candidate-detail__hero">
          <div className="recruiter-candidate-detail__identity">
            <div className="skeleton-block recruiter-candidate-detail__avatar" />
            <div className="recruiter-candidate-detail__copy">
              <div
                className="skeleton-block recruiter-candidate-detail__title"
                style={{ width: '200px', height: '2rem' }}
              />
              <div
                className="skeleton-block recruiter-candidate-detail__subtitle"
                style={{ width: '150px', height: '1.25rem', marginTop: '8px' }}
              />
              <div className="recruiter-candidate-detail__meta" style={{ marginTop: '12px' }}>
                <div
                  className="skeleton-block"
                  style={{ width: '80px', height: '1.5rem', borderRadius: '1rem' }}
                />
                <div className="skeleton-block" style={{ width: '120px', height: '1.25rem' }} />
              </div>
            </div>
          </div>
          <div className="recruiter-candidate-detail__contacts">
            <div
              className="skeleton-block"
              style={{ width: '180px', height: '1.5rem', borderRadius: '4px' }}
            />
            <div
              className="skeleton-block"
              style={{ width: '120px', height: '1.5rem', borderRadius: '4px' }}
            />
            <div
              className="skeleton-block"
              style={{ width: '150px', height: '1.5rem', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="skeleton-block" style={{ width: '150px', height: '1.25rem' }} />
            <div
              className="skeleton-block"
              style={{ width: '250px', height: '0.875rem', marginTop: '4px' }}
            />
          </div>
          <div className="dash-card__body">
            <div className="skeleton-block" style={{ width: '100%', height: '100px' }} />
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="skeleton-block" style={{ width: '150px', height: '1.25rem' }} />
            <div
              className="skeleton-block"
              style={{ width: '250px', height: '0.875rem', marginTop: '4px' }}
            />
          </div>
          <div className="dash-card__body">
            <div className="skeleton-block" style={{ width: '100%', height: '100px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
