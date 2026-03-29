import type { CSSProperties } from 'react'

import styles from '../outreach.module.css'

function SkeletonBlock({ style }: { style?: CSSProperties }) {
  return <div className="skeleton-block" aria-hidden="true" style={style} />
}

export function OutreachDraftListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body dash-card__body--no-top">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="app-item app-item--skeleton">
            <div className="app-item__body">
              <div className="app-item__top" style={{ justifyContent: 'space-between' }}>
                <SkeletonBlock style={{ width: '8rem', height: '14px', borderRadius: '999px' }} />
                <SkeletonBlock style={{ width: '5rem', height: '1.8rem', borderRadius: '999px' }} />
              </div>
              <SkeletonBlock
                style={{ width: '75%', height: '13px', borderRadius: '999px', marginTop: '0.6rem' }}
              />
              <SkeletonBlock
                style={{
                  width: '58%',
                  height: '12px',
                  borderRadius: '999px',
                  marginTop: '0.55rem',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OutreachDraftDetailSkeleton() {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__body">
        <SkeletonBlock style={{ width: '10rem', height: '16px', borderRadius: '999px' }} />
        <SkeletonBlock
          style={{ width: '12rem', height: '13px', borderRadius: '999px', marginTop: '0.45rem' }}
        />
        <SkeletonBlock
          style={{ width: '5rem', height: '12px', borderRadius: '999px', marginTop: '1rem' }}
        />
        <SkeletonBlock
          style={{ width: '100%', height: '44px', borderRadius: '16px', marginTop: '0.45rem' }}
        />
        <SkeletonBlock
          style={{ width: '4rem', height: '12px', borderRadius: '999px', marginTop: '1rem' }}
        />
        <SkeletonBlock
          style={{ width: '100%', height: '220px', borderRadius: '22px', marginTop: '0.45rem' }}
        />
        <div className="cell-actions" style={{ marginTop: '1rem' }}>
          <SkeletonBlock style={{ width: '5rem', height: '40px', borderRadius: '999px' }} />
          <SkeletonBlock style={{ width: '6rem', height: '40px', borderRadius: '999px' }} />
          <SkeletonBlock style={{ width: '6rem', height: '40px', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  )
}

export function OutreachPageSkeleton() {
  return (
    <div
      className={`dash-content container container--app-shell ${styles.outreachPage}`}
      aria-hidden="true"
    >
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Outreach</h2>
          <p className="dash-page-header__subtitle">
            Review finalized jobs, track draft progress, and open the outreach workspace.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <SkeletonBlock style={{ width: '7rem', height: '2rem', borderRadius: '999px' }} />
          <SkeletonBlock style={{ width: '7rem', height: '2rem', borderRadius: '999px' }} />
        </div>
      </div>

      <div className={styles.contextBar}>
        <div className={styles.contextTop}>
          <div className={styles.selectorRow}>
            <div className={`${styles.selectWrap} ${styles.selectWrapView}`}>
              <span className={styles.selectLabel}>View</span>
              <SkeletonBlock style={{ width: '100%', height: '44px', borderRadius: '16px' }} />
            </div>
            <div className={`${styles.selectWrap} ${styles.selectWrapJob}`}>
              <span className={styles.selectLabel}>Job</span>
              <SkeletonBlock style={{ width: '100%', height: '44px', borderRadius: '16px' }} />
            </div>
            <div className={styles.actionCluster}>
              <SkeletonBlock style={{ width: '9rem', height: '40px', borderRadius: '999px' }} />
              <SkeletonBlock style={{ width: '11rem', height: '40px', borderRadius: '999px' }} />
            </div>
          </div>
        </div>

        <div className={styles.contextMeta}>
          <div className={styles.statusList}>
            <SkeletonBlock style={{ width: '10rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '10rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '9rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '8rem', height: '2rem', borderRadius: '999px' }} />
          </div>
        </div>
      </div>

      <section className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <SkeletonBlock style={{ width: '18rem', height: '18px', borderRadius: '999px' }} />
          <SkeletonBlock
            style={{ width: '30rem', height: '14px', borderRadius: '999px', marginTop: '0.5rem' }}
          />
        </div>

        <div className={styles.flowPanel}>
          <div className={styles.flowSteps}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.flowStep}>
                <div className={styles.flowIcon}>
                  <SkeletonBlock
                    style={{ width: '0.7rem', height: '0.7rem', borderRadius: '999px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div className={styles.flowRow}>
                    <SkeletonBlock
                      style={{ width: '1rem', height: '1rem', borderRadius: '999px' }}
                    />
                    <SkeletonBlock
                      style={{ width: '7rem', height: '14px', borderRadius: '999px' }}
                    />
                    <SkeletonBlock
                      style={{ width: '2.5rem', height: '1.7rem', borderRadius: '999px' }}
                    />
                  </div>
                  <SkeletonBlock
                    style={{
                      width: '78%',
                      height: '12px',
                      borderRadius: '999px',
                      marginTop: '0.45rem',
                    }}
                  />
                  <SkeletonBlock
                    style={{
                      width: '62%',
                      height: '12px',
                      borderRadius: '999px',
                      marginTop: '0.45rem',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.flowFooter}>
            <div style={{ flex: 1 }}>
              <SkeletonBlock style={{ width: '75%', height: '12px', borderRadius: '999px' }} />
              <SkeletonBlock
                style={{
                  width: '55%',
                  height: '12px',
                  borderRadius: '999px',
                  marginTop: '0.45rem',
                }}
              />
            </div>
            <div className={styles.flowFooterBadge}>
              <SkeletonBlock style={{ width: '8rem', height: '2rem', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
