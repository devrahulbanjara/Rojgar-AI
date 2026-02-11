'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import { Topbar } from './Topbar'
import { MainContentContainer } from '../common/MainContentContainer'
import { useAuth } from '../../hooks/useAuth'

import { SidebarProvider, SidebarInset } from '../ui/sidebar'
import { AppSidebar } from './AppSidebar'

interface AppShellProps {
  children: React.ReactNode
  hideSidebar?: boolean
}

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const isOrganizationRoute = pathname?.startsWith('/organization/')

  const sidebarRole = isOrganizationRoute ? 'organization' : user?.role || 'candidate'

  return (
    <SidebarProvider>
      {!hideSidebar && (
        <AppSidebar role={sidebarRole as 'candidate' | 'recruiter' | 'organization'} />
      )}
      <SidebarInset className="min-h-screen bg-background-subtle dark:bg-background flex flex-col">
        <Topbar user={user} />

        <main className="flex-1 pt-16">
          <MainContentContainer maxWidth="full" padding="none">
            {children}
          </MainContentContainer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
