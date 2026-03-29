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
    <div className="jd-page jd-page--skeleton" aria-hidden="true">
      {/* ── Hero Skeleton ── */}
      <div className="jd-hero jd-hero--skeleton">
        <div className="jd-hero__body">
          <div className="jd-hero__info">
            <div
              className="skeleton-block jd-hero__logo"
              style={{ width: 68, height: 68, borderRadius: 16 }}
            />
            <div
              className="skeleton-block"
              style={{ width: 120, height: '0.875rem', marginBottom: '1rem' }}
            />
            <div
              className="skeleton-block"
              style={{ width: '60%', height: '2.5rem', marginBottom: '1rem' }}
            />
            <div
              className="skeleton-block"
              style={{ width: '40%', height: '1.25rem', marginBottom: '0.75rem' }}
            />
            <div
              className="skeleton-block"
              style={{ width: '30%', height: '1.25rem', marginBottom: '1.5rem' }}
            />
            <div className="jd-hero__chips">
              <div className="skeleton-block" style={{ width: 80, height: 24, borderRadius: 12 }} />
              <div
                className="skeleton-block"
                style={{ width: 100, height: 24, borderRadius: 12 }}
              />
              <div className="skeleton-block" style={{ width: 70, height: 24, borderRadius: 12 }} />
            </div>
          </div>
          <div className="jd-hero__apply-wrap">
            <div className="skeleton-block" style={{ width: 140, height: 44, borderRadius: 22 }} />
            <div className="skeleton-block" style={{ width: 90, height: 36, borderRadius: 18 }} />
          </div>
        </div>
      </div>

      {/* ── Content Sections Skeletons ── */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="jd-section">
          <div
            className="skeleton-block"
            style={{ width: 150, height: '1.5rem', marginBottom: '1rem' }}
          />
          <div
            className="skeleton-block"
            style={{ width: '100%', height: '1rem', marginBottom: '0.5rem' }}
          />
          <div
            className="skeleton-block"
            style={{ width: '90%', height: '1rem', marginBottom: '0.5rem' }}
          />
          <div
            className="skeleton-block"
            style={{ width: '95%', height: '1rem', marginBottom: '0.5rem' }}
          />
        </div>
      ))}
    </div>
  )
}
