import type { CSSProperties } from 'react'

import styles from '../screening.module.css'

function SkeletonBlock({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`skeleton-block ${className ?? ''}`.trim()} aria-hidden="true" style={style} />
  )
}

export function ScreeningControlsSkeleton() {
  return (
    <div className={styles.selectorRow} aria-hidden="true">
      <div className={`${styles.selectWrap} ${styles.selectWrapView}`}>
        <span className={styles.selectLabel}>View</span>
        <SkeletonBlock style={{ width: '100%', height: '44px', borderRadius: '16px' }} />
      </div>

      <div className={`${styles.selectWrap} ${styles.selectWrapJob}`}>
        <span className={styles.selectLabel}>Job</span>
        <SkeletonBlock style={{ width: '100%', height: '44px', borderRadius: '16px' }} />
      </div>

      <div className={styles.inlineControls}>
        <div className={styles.thresholdCluster}>
          <span className={styles.thresholdLabel}>Shortlist threshold</span>
          <div className={styles.thresholdControls}>
            <SkeletonBlock style={{ width: '6rem', height: '44px', borderRadius: '16px' }} />
            <SkeletonBlock style={{ width: '2.6rem', height: '12px', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '5.4rem', height: '40px', borderRadius: '999px' }} />
          </div>
        </div>

        <div className={styles.actionCluster}>
          <SkeletonBlock style={{ width: '11rem', height: '40px', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  )
}

export function ScreeningStatusCardSkeleton() {
  return (
    <div className={styles.contextMeta} aria-hidden="true">
      <div className={styles.statusList}>
        <SkeletonBlock style={{ width: '12rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '12.5rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '9.75rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '9rem', height: '2rem', borderRadius: '999px' }} />
      </div>

      <div className={styles.statsGroup}>
        <SkeletonBlock style={{ width: '7rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '6.6rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '6.2rem', height: '2rem', borderRadius: '999px' }} />
        <SkeletonBlock style={{ width: '9rem', height: '2rem', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

export function ScreeningTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <section className={styles.filterSection} aria-hidden="true">
        <div className={styles.filterBar}>
          <SkeletonBlock
            style={{ flex: '1 1 22rem', maxWidth: '26rem', height: '44px', borderRadius: '999px' }}
          />

          <div className={styles.filterCluster}>
            <SkeletonBlock style={{ width: '2.9rem', height: '12px', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '3.5rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '4rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '4rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '3.25rem', height: '2rem', borderRadius: '999px' }} />
            <span className={styles.verticalDivider} />
            <SkeletonBlock style={{ width: '5.6rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '5.2rem', height: '2rem', borderRadius: '999px' }} />
            <SkeletonBlock style={{ width: '7.2rem', height: '2rem', borderRadius: '999px' }} />
          </div>
        </div>
      </section>

      <section className={styles.tableSection} aria-hidden="true">
        <div className={styles.tableShell}>
          <div className={styles.tableScroller}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Review</th>
                  <th>Score</th>
                  <th>Status / Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, index) => (
                  <tr key={index} className={styles.dataRow}>
                    <td>
                      <div className={styles.candidateCell}>
                        <SkeletonBlock
                          style={{
                            width: '3.1rem',
                            height: '3.1rem',
                            borderRadius: '999px',
                          }}
                        />
                        <div className={styles.candidateMeta} style={{ width: '100%' }}>
                          <SkeletonBlock
                            style={{
                              width: `${54 + (index % 3) * 9}%`,
                              height: '15px',
                              borderRadius: '999px',
                            }}
                          />
                          <SkeletonBlock
                            style={{
                              width: `${68 + (index % 2) * 10}%`,
                              height: '12px',
                              borderRadius: '999px',
                              marginTop: '0.45rem',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.reviewCell}>
                        <SkeletonBlock
                          style={{ width: '100%', height: '13px', borderRadius: '999px' }}
                        />
                        <SkeletonBlock
                          style={{ width: '92%', height: '13px', borderRadius: '999px' }}
                        />
                        <div className={styles.reviewActions}>
                          <SkeletonBlock
                            style={{ width: '4.9rem', height: '12px', borderRadius: '999px' }}
                          />
                          <SkeletonBlock
                            style={{ width: '5.6rem', height: '12px', borderRadius: '999px' }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.scoreCell}>
                        <SkeletonBlock
                          style={{ width: '4.5rem', height: '1.4rem', borderRadius: '999px' }}
                        />
                        <SkeletonBlock
                          style={{ width: '7rem', height: '0.42rem', borderRadius: '999px' }}
                        />
                      </div>
                    </td>

                    <td>
                      <div className={styles.statusActionCell}>
                        <SkeletonBlock
                          style={{ width: '7.4rem', height: '2rem', borderRadius: '999px' }}
                        />
                        <div className={styles.rowActionButtons}>
                          <SkeletonBlock
                            style={{ width: '2.3rem', height: '2.3rem', borderRadius: '999px' }}
                          />
                          <SkeletonBlock
                            style={{ width: '2.3rem', height: '2.3rem', borderRadius: '999px' }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

export function ScreeningPageSkeleton() {
  return (
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Screening</h2>
          <p className="dash-page-header__subtitle">
            Review applicants, edit screening scores, and make shortlisting decisions.
          </p>
        </div>

        <div className="dash-page-header__actions">
          <SkeletonBlock style={{ width: '7.75rem', height: '2rem', borderRadius: '999px' }} />
          <SkeletonBlock style={{ width: '7rem', height: '2rem', borderRadius: '999px' }} />
        </div>
      </div>

      <div className={styles.contextBar}>
        <div className={styles.contextTop}>
          <ScreeningControlsSkeleton />
        </div>
        <ScreeningStatusCardSkeleton />
      </div>

      <ScreeningTableSkeleton rows={6} />
    </div>
  )
}
