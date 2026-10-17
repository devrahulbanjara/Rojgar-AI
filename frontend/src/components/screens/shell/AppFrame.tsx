'use client'

import { type ReactNode, useEffect } from 'react'

import type { PrimaryRole } from '@/lib/types/user'
import { useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery } from '@/store/services/authApi'

import { useLogout } from '@/components/app/AccountMenu'
import { CandidateShell, RecruiterShell } from '@/components/app/AppShell'
import { SystemState } from '@/components/app/SystemState'
import AuthGuard from '@/components/common/AuthGuard'
import { Button } from '@/components/ui/button'

const RECRUITER_ROLES: PrimaryRole[] = ['recruiter_admin', 'recruiter']
const ALL_ROLES: PrimaryRole[] = ['recruiter_admin', 'recruiter', 'candidate']

/** A recruiter whose join request is pending or declined sees one line instead of the app. */
function MembershipGate({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user)
  const [getMe] = useLazyGetMeQuery()
  const logout = useLogout()
  const status = user?.primary_role === 'recruiter' ? user.membership_status : 'active'

  // While waiting, check every 15 s so the app opens by itself once approved.
  useEffect(() => {
    if (status !== 'pending') return
    const timer = window.setInterval(() => void getMe(), 15_000)
    return () => window.clearInterval(timer)
  }, [status, getMe])

  if (status === 'pending' || status === 'rejected') {
    return (
      <SystemState
        fullScreen
        action={
          <Button variant="outline" onClick={() => void logout()}>
            Log out
          </Button>
        }
      >
        {status === 'pending'
          ? "Your company admin hasn't approved you yet. This page opens by itself once they do."
          : 'Your request to join was declined. Ask your company admin to invite you again.'}
      </SystemState>
    )
  }
  return <>{children}</>
}

/** Recruiter and admin pages: sign-in check, approval gate, sidebar + top bar. */
export function RecruiterFrame({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole={RECRUITER_ROLES}>
      <MembershipGate>
        <RecruiterShell>
          <main className="min-w-0 flex-1">{children}</main>
        </RecruiterShell>
      </MembershipGate>
    </AuthGuard>
  )
}

/** Pages every signed-in role shares (notifications): the shell follows the role. */
export function SharedFrame({ children }: { children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.primary_role)
  return (
    <AuthGuard requiredRole={ALL_ROLES}>
      {role === 'candidate' ? (
        <CandidateShell>{children}</CandidateShell>
      ) : (
        <MembershipGate>
          <RecruiterShell>
            <main className="min-w-0 flex-1">{children}</main>
          </RecruiterShell>
        </MembershipGate>
      )}
    </AuthGuard>
  )
}
