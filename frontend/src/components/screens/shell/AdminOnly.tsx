'use client'

import type { ReactNode } from 'react'

import { useAppSelector } from '@/store/hooks'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'

/** Company-admin pages (team, company settings, audit log). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')
  if (isAdmin) return <>{children}</>
  return (
    <PageContainer>
      <EmptyState>Only your company admin can open this page.</EmptyState>
    </PageContainer>
  )
}
