'use client'

import type { ReactNode } from 'react'

import { useIsOwner } from '@/lib/session'

import { PageContainer } from '@/components/app/AppShell'
import { EmptyState } from '@/components/app/EmptyState'

/** Owner-only pages (team, business settings, audit log). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useIsOwner()
  if (isAdmin) return <>{children}</>
  return (
    <PageContainer>
      <EmptyState>Only the business owner can open this page.</EmptyState>
    </PageContainer>
  )
}
