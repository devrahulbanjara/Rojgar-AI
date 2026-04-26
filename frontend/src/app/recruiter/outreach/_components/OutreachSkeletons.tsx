import type { CSSProperties } from 'react'

import styles from '../outreach.module.css'

function SkeletonBlock({ style }: { style?: CSSProperties }) {
  return <div className="skeleton-block" aria-hidden="true" style={style} />
}

export function OutreachDraftListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dash-card" aria-hidden="true">
      <div className="dash-card__header">
        <div className="dash-card__title">Candidates</div>
      </div>
      <div className="dash-card__body dash-card__body--no-top">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={styles.draftButton}>
            <div className={styles.draftRow}>
              <SkeletonBlock
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              <div className={styles.draftBody}>
                <div className={styles.draftTop}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <SkeletonBlock
                      style={{ width: '9rem', height: '14px', borderRadius: '999px' }}
                    />
                    <SkeletonBlock
                      style={{
                        width: '12rem',
                        height: '12px',
                        borderRadius: '999px',
                        marginTop: '0.45rem',
                      }}
                    />
                  </div>
                  <div className={styles.draftTopActions}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <SkeletonBlock style={{ width: 7, height: 7, borderRadius: '50%' }} />
                      <SkeletonBlock
                        style={{ width: '4rem', height: '0.8rem', borderRadius: '999px' }}
                      />
                    </div>
                    <SkeletonBlock
                      style={{ width: '2rem', height: '2rem', borderRadius: '999px' }}
                    />
                  </div>
                </div>
              </div>
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
      <div className="dash-card__header">
        <div className="dash-card__title">Draft editor</div>
      </div>
      <div className="dash-card__body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SkeletonBlock
            style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
          />
          <div>
            <SkeletonBlock style={{ width: '10rem', height: '14px', borderRadius: '999px' }} />
            <SkeletonBlock
              style={{
                width: '12rem',
                height: '12px',
                borderRadius: '999px',
                marginTop: '0.35rem',
              }}
            />
          </div>
        </div>
        <SkeletonBlock
          style={{
            width: '100%',
            height: '58px',
            borderRadius: '16px',
            marginTop: '1rem',
          }}
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
    <div className="dash-content container container--app-shell" aria-hidden="true">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Outreach</h2>
          <p className="dash-page-header__subtitle">
            Generate, review, and send hiring updates to shortlisted and rejected candidates.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <SkeletonBlock style={{ width: '5.5rem', height: '1.8rem', borderRadius: '999px' }} />
          <SkeletonBlock style={{ width: '7rem', height: '2rem', borderRadius: '999px' }} />
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
          </div>
        </div>
      </div>

      <div className={`dash-grid dash-grid--2col ${styles.workspaceGrid}`}>
        <OutreachDraftListSkeleton rows={5} />
        <OutreachDraftDetailSkeleton />
      </div>
    </div>
  )
}
