'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { PLANS, useGetCompanyPlanQuery } from '@/lib/api/company'
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
        {isAdmin ? <PlanChip /> : null}
        <SidebarMenu className="gap-1">
          <NavLink item={RECRUITER_INSIGHTS} pathname={pathname} />
          <NavLink item={RECRUITER_SETTINGS} pathname={pathname} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
