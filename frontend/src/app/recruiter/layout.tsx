'use client'

import { useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery } from '@/store/services/authApi'
import { useLogoutMutation } from '@/store/services/authApi'
import { Clock, ShieldOff } from 'lucide-react'

import AuthGuard from '@/components/common/AuthGuard'
import DashNavbar from '@/components/layout/DashNavbar'

function CompanyLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector((s) => s.auth)
  const [triggerGetMe, { isFetching }] = useLazyGetMeQuery()
  const [logout] = useLogoutMutation()

  if (user?.primary_role === 'recruiter') {
    const ms = user.membership_status

    if (ms !== 'active') {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1.5rem',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--color-bg, #0a0a0a)',
            color: 'var(--color-text, #fff)',
          }}
        >
          {ms === 'rejected' ? (
            <>
              <ShieldOff size={48} strokeWidth={1.5} color="#ef4444" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Access Denied</h2>
              <p
                style={{
                  color: 'var(--color-muted)',
                  maxWidth: 420,
                  margin: 0,
                }}
              >
                Your request to join the company has been rejected by the company admin. Please
                contact the company directly if you believe this is a mistake.
              </p>
            </>
          ) : (
            <>
              <Clock size={48} strokeWidth={1.5} color="#f59e0b" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pending Approval</h2>
              <p
                style={{
                  color: 'var(--color-muted)',
                  maxWidth: 420,
                  margin: 0,
                }}
              >
                Your account is waiting for approval from the company admin. You&apos;ll be able to
                access the dashboard once they approve your request.
              </p>
            </>
          )}

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {ms !== 'rejected' && (
              <button
                className="btn btn--outline btn--sm"
                disabled={isFetching}
                onClick={() => triggerGetMe()}
              >
                {isFetching ? 'Checking…' : 'Refresh Status'}
              </button>
            )}
            <button className="btn btn--danger btn--sm" onClick={() => logout()}>
              Log Out
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <DashNavbar role="recruiter_admin" />
      <main className="dash-page">{children}</main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Exported layout
// ---------------------------------------------------------------------------

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole={['recruiter_admin', 'recruiter']}>
      <CompanyLayoutInner>{children}</CompanyLayoutInner>
    </AuthGuard>
  )
}
