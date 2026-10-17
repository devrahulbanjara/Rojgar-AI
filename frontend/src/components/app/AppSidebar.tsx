'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAppSelector } from '@/store/hooks'

import { Logo } from '@/components/app/Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import {
  type NavItem,
  RECRUITER_INSIGHTS,
  RECRUITER_NAV,
  RECRUITER_SETTINGS,
  isActivePath,
} from './navigation'

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActivePath(pathname, item)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon weight={active ? 'fill' : 'regular'} />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** Recruiter/admin sidebar: Today · Jobs · Candidates · Interviews · Team, Settings pinned. */
export function AppSidebar() {
  const pathname = usePathname()
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')
  const items = RECRUITER_NAV.filter((item) => isAdmin || !item.adminOnly)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:px-2">
        <Link href="/recruiter" className="flex items-center">
          <Logo className="h-7 group-data-[collapsible=icon]:hidden" />
          <Logo variant="mark" className="hidden size-8 group-data-[collapsible=icon]:block" />
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
        <SidebarMenu className="gap-1">
          <NavLink item={RECRUITER_INSIGHTS} pathname={pathname} />
          <NavLink item={RECRUITER_SETTINGS} pathname={pathname} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
