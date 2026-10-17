'use client'

import type { ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import { AccountMenu } from './AccountMenu'
import { CommandSearch } from './CommandSearch'
import { NotificationsBell } from './NotificationsBell'
import { type NavItem, RECRUITER_NAV, RECRUITER_SETTINGS, isActivePath } from './navigation'

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActivePath(pathname, item)} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * Recruiter/admin shell: collapsible left sidebar (Today · Jobs · Candidates ·
 * Interviews · Team, Settings pinned at the bottom) and a top bar with ⌘K
 * search, notifications and the account menu.
 */
export function RecruiterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')
  const items = RECRUITER_NAV.filter((item) => isAdmin || !item.adminOnly)

  return (
    <SidebarProvider className="app-surface">
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:px-2">
          <Link href="/recruiter" className="flex items-center">
            <Image
              src="/logo/logo.png"
              alt="ConvexHire"
              width={120}
              height={26}
              priority
              className="group-data-[collapsible=icon]:hidden"
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <NavLink item={RECRUITER_SETTINGS} pathname={pathname} />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <CommandSearch isAdmin={isAdmin} />
          <div className="ml-auto flex items-center gap-2">
            <NotificationsBell />
            <AccountMenu />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Candidate shell: a simple, mobile-first top bar. */
export function CandidateShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-surface">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/me/applications" className="shrink-0">
            <Image src="/logo/logo.png" alt="ConvexHire" width={112} height={24} priority />
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
