export function CompanyJobsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="company-jobs-cards company-jobs-cards--grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="company-job-card company-job-card--skeleton company-job-card--grid"
        >
          <div className="company-job-card__top-row company-job-skeleton__top-row">
            <div className="skeleton-block company-job-skeleton__status" />
          </div>

          <div className="skeleton-block company-job-skeleton__title" />

          <div className="company-job-card__location company-job-skeleton__meta-row">
            <div className="skeleton-block company-job-skeleton__icon" />
            <div className="skeleton-block company-job-skeleton__line company-job-skeleton__line--mid" />
          </div>

          <div className="company-job-card__salary company-job-skeleton__meta-row">
            <div className="skeleton-block company-job-skeleton__icon" />
            <div className="skeleton-block company-job-skeleton__line company-job-skeleton__line--long" />
          </div>

          <div className="company-job-card__divider" />

          <div className="company-job-card__footer company-job-skeleton__footer">
            <div className="company-job-card__footer-meta company-job-skeleton__footer-meta">
              <div className="skeleton-block company-job-skeleton__link" />
              <div className="skeleton-block company-job-skeleton__date" />
            </div>

            <div className="company-job-card__actions">
              <div className="skeleton-block company-job-skeleton__action" />
              <div className="skeleton-block company-job-skeleton__action" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CompanyJobEditorSkeleton() {
  return (
    <div className="job-editor-skeleton" aria-hidden="true">
      <div className="dash-grid dash-grid--2col" style={{ marginBottom: '2rem' }}>
        <div className="skeleton-field">
          <div
            className="skeleton-block"
            style={{ width: 100, height: '0.875rem', marginBottom: '0.5rem' }}
          />
          <div className="skeleton-block" style={{ width: '100%', height: '2.75rem' }} />
        </div>
        <div className="skeleton-field">
          <div
            className="skeleton-block"
            style={{ width: 100, height: '0.875rem', marginBottom: '0.5rem' }}
          />
          <div className="skeleton-block" style={{ width: '100%', height: '2.75rem' }} />
        </div>
      </div>

      <div className="dash-grid dash-grid--3col" style={{ marginBottom: '2rem' }}>
        <div className="skeleton-field">
          <div
            className="skeleton-block"
            style={{ width: 80, height: '0.875rem', marginBottom: '0.5rem' }}
          />
          <div className="skeleton-block" style={{ width: '100%', height: '2.75rem' }} />
        </div>
        <div className="skeleton-field">
          <div
            className="skeleton-block"
            style={{ width: 80, height: '0.875rem', marginBottom: '0.5rem' }}
          />
          <div className="skeleton-block" style={{ width: '100%', height: '2.75rem' }} />
        </div>
        <div className="skeleton-field">
          <div
            className="skeleton-block"
            style={{ width: 80, height: '0.875rem', marginBottom: '0.5rem' }}
          />
          <div className="skeleton-block" style={{ width: '100%', height: '2.75rem' }} />
        </div>
      </div>

      <div className="skeleton-field" style={{ marginBottom: '2rem' }}>
        <div
          className="skeleton-block"
          style={{ width: 120, height: '0.875rem', marginBottom: '0.5rem' }}
        />
        <div className="skeleton-block" style={{ width: '100%', height: '8rem' }} />
      </div>

      <div className="skeleton-field" style={{ marginBottom: '2rem' }}>
        <div
          className="skeleton-block"
          style={{ width: 150, height: '0.875rem', marginBottom: '0.5rem' }}
        />
        <div className="skeleton-block" style={{ width: '100%', height: '6rem' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
        <div className="skeleton-block" style={{ width: 100, height: '2.5rem', borderRadius: 6 }} />
        <div className="skeleton-block" style={{ width: 140, height: '2.5rem', borderRadius: 6 }} />
      </div>
    </div>
  )
}

export function CompanyJobDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="jd-detail-header-skeleton">
        <div className="jd-detail-header-skeleton__title" />
        <div className="jd-detail-header-skeleton__subtitle" />
      </div>
      <div className="jd-detail-tabs-skeleton">
        <div />
        <div />
      </div>
      <div className="jd-detail">
        <div className="jd-detail__main">
          <div className="jd-detail__skeleton-section" />
          <div className="jd-detail__skeleton-section" />
          <div className="jd-detail__skeleton-section" />
        </div>
        <div className="jd-detail__sidebar">
          <div className="jd-detail__skeleton-sidebar" />
        </div>
      </div>
    </div>
  )
}
