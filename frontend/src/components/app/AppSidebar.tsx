'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { PLANS, useGetCompanyPlanQuery } from '@/lib/api/company'
import { useIsOwner } from '@/lib/session'

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
  ADMIN_NAV,
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

/** Admins see their plan at the bottom; it links to company settings. */
function PlanChip() {
  const { data: plan } = useGetCompanyPlanQuery()
  if (!plan) return null
  const first = plan.usage[0]
  return (
    <Link
      href="/recruiter/settings/company"
      className="mx-2 flex flex-col rounded-xl border bg-card px-3 py-2 text-xs group-data-[collapsible=icon]:hidden hover:bg-accent"
    >
      <span className="font-medium text-foreground">{PLANS[plan.plan].name}</span>
      {first ? (
        <span className="text-muted-foreground">
          {first.limit === null
            ? `${first.used} ${first.unit} used`
            : `${first.used} of ${first.limit} ${first.unit} used`}
        </span>
      ) : null}
    </Link>
  )
}

export type AppArea = 'business' | 'admin'

/**
 * Business: Today · Jobs · Applicants · Interviews · Team (owners), Insights and Settings pinned.
 * Admin (Rojgar AI staff): Approvals · Businesses · Reports · Payments.
 */
export function AppSidebar({ area = 'business' }: { area?: AppArea }) {
  const pathname = usePathname()
  const isAdmin = useIsOwner()
  const items =
    area === 'admin' ? ADMIN_NAV : RECRUITER_NAV.filter((item) => isAdmin || !item.adminOnly)
  const home = area === 'admin' ? '/admin' : '/recruiter'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:px-2">
        <Link href={home} className="flex items-center">
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
      {area === 'business' ? (
        <SidebarFooter>
          {isAdmin ? <PlanChip /> : null}
          <SidebarMenu className="gap-1">
            <NavLink item={RECRUITER_INSIGHTS} pathname={pathname} />
            <NavLink item={RECRUITER_SETTINGS} pathname={pathname} />
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  )
}
