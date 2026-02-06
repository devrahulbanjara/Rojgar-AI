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

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const [isHydrated, setIsHydrated] = React.useState(false)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean | null>(null)

  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  React.useEffect(() => {
    let collapsed = false
    try {
      const stored = window.localStorage.getItem('sidebarCollapsed')
      if (stored !== null) {
        collapsed = stored === 'true'
      } else {
        collapsed = window.innerWidth < 1280
      }
    } catch {
      collapsed = false
    }

    setIsSidebarCollapsed(collapsed)

    const raf = requestAnimationFrame(() => {
      setIsHydrated(true)
    })
    return () => cancelAnimationFrame(raf)
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
      const nextState = prev === null ? true : !prev
      try {
        window.localStorage.setItem('sidebarCollapsed', String(nextState))
      } catch {
        // Ignore localStorage errors
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
    if (isSidebarCollapsed === null) return 'lg:ml-[220px]'
    return isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[220px]'
  }, [isSidebarCollapsed, hideSidebar])

  return (
    <div className="min-h-screen bg-background-subtle">
      <Topbar onMenuClick={hideSidebar ? undefined : handleMenuClick} user={user} />

      <div className="flex min-h-[calc(100vh-64px)] pt-16">
        {!hideSidebar && isSidebarCollapsed !== null && (
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
