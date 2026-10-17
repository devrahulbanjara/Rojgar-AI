'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'

import { Logo } from '@/components/app/Logo'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AccountMenu } from './AccountMenu'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'

/** Recruiter/admin shell: AppSidebar + TopBar around the page. */
export function RecruiterShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="app-surface">
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <TopBar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Role-aware entry point. */
export function AppShell({
  role,
  children,
}: {
  role: 'recruiter' | 'candidate'
  children: ReactNode
}) {
  return role === 'recruiter' ? (
    <RecruiterShell>{children}</RecruiterShell>
  ) : (
    <CandidateShell>{children}</CandidateShell>
  )
}

/** Candidate shell: a simple, mobile-first top bar. */
export function CandidateShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-surface">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/me/applications" className="shrink-0">
            <Logo className="h-6" />
          </Link>
          <div className="ml-auto">
            <AccountMenu showName={false} />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

export function PageContainer({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8',
        narrow ? 'max-w-2xl' : 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  )
}
