'use client'

import type { ReactNode } from 'react'

import { useAppSelector } from '@/store/hooks'

import { CandidateShell, RecruiterShell } from '@/components/app/AppShell'
import AuthGuard from '@/components/common/AuthGuard'
import { BusinessBanner } from '@/components/screens/business/BusinessBanner'

/** Business team pages: sign-in check, verification banner, sidebar + top bar. */
export function RecruiterFrame({ children }: { children: ReactNode }) {
  return (
    <AuthGuard access="member">
      <RecruiterShell>
        <BusinessBanner />
        <main className="min-w-0 flex-1">{children}</main>
      </RecruiterShell>
    </AuthGuard>
  )
}

/** Pages every signed-in person shares (notifications): the shell follows the person. */
export function SharedFrame({ children }: { children: ReactNode }) {
  const isMember = useAppSelector((s) => Boolean(s.auth.user?.active_business))
  return (
    <AuthGuard access="person">
      {isMember ? (
        <RecruiterShell>
          <BusinessBanner />
          <main className="min-w-0 flex-1">{children}</main>
        </RecruiterShell>
      ) : (
        <CandidateShell>{children}</CandidateShell>
      )}
    </AuthGuard>
  )
}
