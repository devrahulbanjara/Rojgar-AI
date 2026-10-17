'use client'

import { useAppSelector } from '@/store/hooks'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { AccountMenu } from './AccountMenu'
import { CommandSearch } from './CommandSearch'
import { NotificationsBell } from './NotificationsBell'

/**
 * Opens the sidebar: an off-canvas sheet on mobile, collapse/expand on desktop
 * (handled by the shadcn Sidebar).
 */
export function MobileNav() {
  return <SidebarTrigger className="-ml-1 [&_svg]:size-5" />
}

/** Recruiter top bar: sidebar toggle · space · search · notifications · account. */
export function TopBar() {
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <div className="ml-auto flex items-center gap-1">
        <CommandSearch isAdmin={isAdmin} />
        <NotificationsBell />
        <AccountMenu />
      </div>
    </header>
  )
}
