'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MainContentContainer } from '../common/MainContentContainer'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

interface AppShellProps {
  children: React.ReactNode
  hideSidebar?: boolean
}

function getInitialSidebarState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = window.localStorage.getItem('sidebarCollapsed')
    if (stored !== null) {
      return stored === 'true'
    }
    return window.innerWidth < 1280
  } catch {
    return false
  }
}

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const [isHydrated, setIsHydrated] = React.useState(false)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(getInitialSidebarState)

  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDesktopToggle = React.useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const nextState = !prev
      try {
        window.localStorage.setItem('sidebarCollapsed', String(nextState))
      } catch {
      }
      return nextState
    })
  }, [])

  const handleMobileToggle = React.useCallback(() => {
    setIsMobileOpen(prev => !prev)
  }, [])

  const handleMenuClick = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      handleMobileToggle()
    } else {
      handleDesktopToggle()
    }
  }, [handleDesktopToggle, handleMobileToggle])

  const isOrganizationRoute =
    pathname?.startsWith('/dashboard/organization') || pathname?.startsWith('/organization/')

  const sidebarRole = isOrganizationRoute ? 'organization' : user?.role || 'candidate'

  const sidebarMarginClass = React.useMemo(() => {
    if (hideSidebar) return ''
    return isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'
  }, [isSidebarCollapsed, hideSidebar])

  return (
    <div className="min-h-screen bg-background-subtle">
      <Topbar onMenuClick={hideSidebar ? undefined : handleMenuClick} user={user} />

      <div className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        {!hideSidebar && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={handleDesktopToggle}
            role={sidebarRole}
            isMobileOpen={isMobileOpen}
            onMobileClose={handleMobileToggle}
            disableAnimation={!isHydrated}
          />
        )}

        <main
          className={cn(
            'flex-1 max-lg:ml-0',
            sidebarMarginClass,
            isHydrated && 'transition-[margin] duration-300 ease-out'
          )}
          style={{
            transitionDuration: isHydrated ? undefined : '0ms',
          }}
        >
          <MainContentContainer maxWidth="full" padding="none">
            {children}
          </MainContentContainer>
        </main>
      </div>
    </div>
  )
}
