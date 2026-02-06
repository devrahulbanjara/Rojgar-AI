'use client'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MainContentContainer } from '../common/MainContentContainer'
import { useAuth } from '../../hooks/useAuth'

interface AppShellProps {
  children: React.ReactNode
  hideSidebar?: boolean
}

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const { user } = useAuth()

  const [isHydrated, setIsHydrated] = React.useState(false)

  const prevCollapsedRef = React.useRef<boolean | null>(null)

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)

  React.useEffect(() => {
    if (hideSidebar) {
      setIsHydrated(true)
      return
    }

    try {
      const storedPreference = window.localStorage.getItem('sidebarCollapsed')
      if (storedPreference !== null) {
        const collapsed = storedPreference === 'true'
        setIsSidebarCollapsed(collapsed)
        prevCollapsedRef.current = collapsed
      } else {
        const collapsed = window.innerWidth < 1024
        setIsSidebarCollapsed(collapsed)
        prevCollapsedRef.current = collapsed
      }
    } catch {
      const collapsed = window.innerWidth < 1024
      setIsSidebarCollapsed(collapsed)
      prevCollapsedRef.current = collapsed
    }

    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [hideSidebar])

  React.useEffect(() => {
    prevCollapsedRef.current = isSidebarCollapsed
  }, [isSidebarCollapsed])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        return
      }
      setIsSidebarCollapsed(true)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSidebarToggle = React.useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const nextState = !prev
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('sidebarCollapsed', String(nextState))
        } catch {
          // Ignore localStorage errors
        }
      }
      return nextState
    })
  }, [])

  const sidebarMarginClass = React.useMemo(() => {
    if (hideSidebar) return ''
    return isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[252px]'
  }, [isSidebarCollapsed, hideSidebar])

  const getTransitionDuration = React.useCallback(() => {
    if (!isHydrated) {
      return '0ms'
    }

    if (prevCollapsedRef.current === null) {
      return '500ms'
    }

    const isCollapsing = !prevCollapsedRef.current && isSidebarCollapsed
    const isExpanding = prevCollapsedRef.current && !isSidebarCollapsed

    if (isCollapsing) {
      return '700ms'
    } else if (isExpanding) {
      return '350ms'
    }

    return '500ms'
  }, [isSidebarCollapsed, isHydrated])

  const pathname = usePathname()
  const isOrganizationRoute =
    pathname?.startsWith('/dashboard/organization') || pathname?.startsWith('/organization/')

  return (
    <div className="min-h-screen bg-background-subtle">
      <Topbar onMenuClick={hideSidebar ? () => {} : handleSidebarToggle} user={user} />

      <div className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        {!hideSidebar && (
          <>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              role={isOrganizationRoute ? 'organization' : user?.role || 'candidate'}
              disableAnimation={!isHydrated}
            />

            {!isSidebarCollapsed && (
              <div
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                onClick={handleSidebarToggle}
                aria-hidden="true"
              />
            )}
          </>
        )}

        <main
          className={`flex-1 ${isHydrated ? 'transition-all' : ''} ${sidebarMarginClass} max-lg:ml-0`}
          style={{
            transitionDuration: getTransitionDuration(),
            transitionTimingFunction: 'ease-in-out',
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
