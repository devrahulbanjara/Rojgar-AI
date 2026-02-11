'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  FileText,
  Calendar,
  BarChart3,
  User,
  ListChecks,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '../ui/sidebar'
import { cn } from '../../lib/utils'

interface AppSidebarProps {
  role: 'candidate' | 'recruiter' | 'organization'
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname()
  const { state, setOpen } = useSidebar()

  const recruiterItems = [
    { title: 'Dashboard', url: '/recruiter/dashboard', icon: LayoutDashboard },
    { title: 'Jobs', url: '/recruiter/jobs', icon: Briefcase },
    { title: 'Candidates', url: '/recruiter/candidates', icon: Users },
    { title: 'Shortlist', url: '/recruiter/shortlist', icon: ListChecks },
    { title: 'Interviews', url: '/recruiter/interviews', icon: Calendar },
    { title: 'Final Selection', url: '/recruiter/final-selection', icon: BarChart3 },
  ]

  const candidateItems = [
    { title: 'Dashboard', url: '/candidate/dashboard', icon: LayoutDashboard },
    { title: 'Jobs', url: '/candidate/jobs', icon: Search },
    { title: 'Resumes', url: '/candidate/resumes', icon: FileText },
    { title: 'Profile', url: '/candidate/profile', icon: User },
  ]

  const organizationItems = [
    { title: 'Overview', url: '/organization/dashboard', icon: LayoutDashboard },
    { title: 'Recruiters', url: '/organization/recruiters', icon: Users },
  ]

  const menuItems =
    role === 'organization'
      ? organizationItems
      : role === 'recruiter'
        ? recruiterItems
        : candidateItems

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border-subtle bg-background-surface"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border-subtle/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-4 h-4 bg-white rounded-full opacity-90" />
          </div>
          {state === 'expanded' && (
            <span className="font-bold text-xl text-text-primary tracking-tight whitespace-nowrap">
              Convex<span className="text-primary">Hire</span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map(item => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        'h-11 transition-all duration-200 rounded-[5px]',
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary font-semibold shadow-sm border border-primary/20'
                          : 'text-text-tertiary hover:bg-primary-50/60 dark:hover:bg-primary-900/20 hover:text-primary'
                      )}
                    >
                      <Link
                        href={item.url}
                        aria-current={isActive ? 'page' : undefined}
                        className="flex items-center gap-3"
                      >
                        <item.icon
                          className={cn(
                            'w-[22px] h-[22px]',
                            isActive
                              ? 'text-primary'
                              : 'text-text-tertiary group-hover/menu-item:text-primary'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[15px] font-medium',
                            isActive
                              ? 'text-primary'
                              : 'text-text-secondary group-hover/menu-item:text-primary'
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* You can add user profile or settings here if needed */}
      </SidebarFooter>
    </Sidebar>
  )
}
