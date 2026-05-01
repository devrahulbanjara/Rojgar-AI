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
    <div className="jd-page jd-page--skeleton jd-detail-skeleton" aria-hidden="true">
      <div className="jd-hero jd-hero--skeleton">
        <div className="jd-hero__body">
          <div className="jd-hero__info">
            <div className="skeleton-block jd-detail-skeleton__logo" />
            <div className="skeleton-block jd-detail-skeleton__date" />
            <div className="skeleton-block jd-detail-skeleton__title" />
            <div className="jd-detail-skeleton__meta-line">
              <div className="skeleton-block jd-detail-skeleton__meta-icon" />
              <div className="skeleton-block jd-detail-skeleton__company" />
            </div>
            <div className="jd-detail-skeleton__meta-line">
              <div className="skeleton-block jd-detail-skeleton__meta-icon" />
              <div className="skeleton-block jd-detail-skeleton__location" />
            </div>
            <div className="job-meta jd-hero__chips jd-detail-skeleton__chips">
              <div className="skeleton-block jd-detail-skeleton__chip" />
              <div className="skeleton-block jd-detail-skeleton__chip jd-detail-skeleton__chip--wide" />
              <div className="skeleton-block jd-detail-skeleton__chip" />
              <div className="skeleton-block jd-detail-skeleton__chip jd-detail-skeleton__chip--time" />
            </div>
          </div>
          <div className="jd-hero__apply-wrap">
            <div className="skeleton-block jd-detail-skeleton__primary-action" />
            <div className="skeleton-block jd-detail-skeleton__secondary-action" />
            <div className="skeleton-block jd-detail-skeleton__secondary-action" />
          </div>
        </div>
      </div>

      <div className="jd-detail-skeleton__view-tabs">
        <div className="skeleton-block jd-detail-skeleton__view-tab jd-detail-skeleton__view-tab--active" />
        <div className="skeleton-block jd-detail-skeleton__view-tab" />
      </div>

      <div className="jd-detail-skeleton__pipeline-tabs">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="jd-detail-skeleton__pipeline-tab">
            <div className="skeleton-block jd-detail-skeleton__stage-label" />
            <div className="skeleton-block jd-detail-skeleton__stage-count" />
          </div>
        ))}
      </div>

      <div className="jd-detail-skeleton__pipeline-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="jd-detail-skeleton__candidate-row">
            <div className="skeleton-block jd-detail-skeleton__avatar" />
            <div className="jd-detail-skeleton__identity">
              <div className="skeleton-block jd-detail-skeleton__name" />
              <div className="skeleton-block jd-detail-skeleton__email" />
            </div>
            <div className="skeleton-block jd-detail-skeleton__score" />
            <div className="skeleton-block jd-detail-skeleton__feedback" />
            <div className="skeleton-block jd-detail-skeleton__applied" />
          </div>
        ))}
      </div>
    </div>
  )
}
