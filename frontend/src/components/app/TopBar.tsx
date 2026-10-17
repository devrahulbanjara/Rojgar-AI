'use client'

import { useIsOwner } from '@/lib/session'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { AccountMenu } from './AccountMenu'
import type { AppArea } from './AppSidebar'
import { CommandSearch } from './CommandSearch'
import { NotificationsBell } from './NotificationsBell'

/**
 * Opens the sidebar: an off-canvas sheet on mobile, collapse/expand on desktop
 * (handled by the shadcn Sidebar).
 */
export function MobileNav() {
  return <SidebarTrigger className="-ml-1 [&_svg]:size-5" />
}

/** Top bar: sidebar toggle · space · search · notifications · account (staff: account only). */
export function TopBar({ area = 'business' }: { area?: AppArea }) {
  const isAdmin = useIsOwner()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <div className="ml-auto flex items-center gap-1">
        {area === 'business' ? (
          <>
            <CommandSearch isAdmin={isAdmin} />
            <NotificationsBell />
          </>
        ) : null}
        <AccountMenu />
      </div>
    </header>
  )
}
