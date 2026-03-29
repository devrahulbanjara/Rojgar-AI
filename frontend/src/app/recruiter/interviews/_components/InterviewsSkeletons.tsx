function SectionSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.75rem 0.875rem',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          borderRadius: '0.875rem',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.9))',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-gray-900, #111827)',
            }}
          >
            {label}
          </span>
          <div
            className="skeleton-block"
            style={{ width: '1.75rem', height: '1.5rem', borderRadius: '999px' }}
          />
        </div>
        <div className="skeleton-block" style={{ width: '240px', height: '0.875rem' }} />
        <div className="skeleton-block" style={{ width: '1rem', height: '1rem' }} />
      </div>

      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(420px, 1.8fr)',
            gap: '1rem',
            alignItems: 'stretch',
            padding: '0.95rem 1rem',
            border: '1px solid rgba(226, 232, 240, 0.96)',
            borderRadius: '1rem',
            background: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              paddingRight: '1rem',
              borderRight: '1px solid rgba(226, 232, 240, 0.9)',
            }}
          >
            <div
              className="skeleton-block"
              style={{ width: '2rem', height: '2rem', borderRadius: '999px', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
              <div className="skeleton-block" style={{ width: '150px', height: '1rem' }} />
              <div className="skeleton-block" style={{ width: '190px', height: '0.8125rem' }} />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(210px, 1.15fr) minmax(200px, 1.1fr) auto',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div className="skeleton-block" style={{ width: '90px', height: '0.75rem' }} />
              <div className="skeleton-block" style={{ width: '170px', height: '1rem' }} />
              <div className="skeleton-block" style={{ width: '140px', height: '0.8125rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div className="skeleton-block" style={{ width: '52px', height: '0.75rem' }} />
              <div className="skeleton-block" style={{ width: '190px', height: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <div className="skeleton-block" style={{ width: '64px', height: '0.75rem' }} />
              <div
                className="skeleton-block"
                style={{ width: '112px', height: '1.75rem', borderRadius: '999px' }}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

export function InterviewsTableSkeleton({ count = 4 }: { count?: number }) {
  const todayRows = Math.max(1, Math.ceil(count / 2))
  const weekRows = Math.max(1, count - todayRows)

  return (
    <div className="dash-card">
      <div
        className="dash-card__body"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1rem' }}
      >
        <SectionSkeleton label="Today" rows={todayRows} />
        <SectionSkeleton label="This week" rows={weekRows} />
      </div>
    </div>
  )
}
