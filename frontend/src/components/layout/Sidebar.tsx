import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import type { UserType } from '../../types/index'
import {
  LayoutDashboard,
  BriefcaseIcon,
  Users,
  Search,
  FileText,
  Calendar,
  BarChart3,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ListChecks,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  role: UserType
  disableAnimation?: boolean
}

export function Sidebar({ isCollapsed, onToggle, role, disableAnimation = false }: SidebarProps) {
  const pathname = usePathname()
  const [showPulse, setShowPulse] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const recruiterItems = [
    { title: 'Dashboard', path: '/dashboard/recruiter', icon: LayoutDashboard },
    { title: 'Jobs', path: '/recruiter/jobs', icon: BriefcaseIcon },
    { title: 'Candidates', path: '/recruiter/candidates', icon: Users },
    { title: 'Shortlist', path: '/recruiter/shortlist', icon: ListChecks },
    { title: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
    {
      title: 'Final Selection',
      path: '/recruiter/final-selection',
      icon: BarChart3,
    },
  ]

  const candidateItems = [
    { title: 'Dashboard', path: '/dashboard/candidate', icon: LayoutDashboard },
    { title: 'Jobs', path: '/candidate/browse-jobs', icon: Search },
    { title: 'Resumes', path: '/candidate/resumes', icon: FileText },
    { title: 'Profile', path: '/candidate/profile', icon: User },
  ]

  const organizationItems = [
    {
      title: 'Overview',
      path: '/dashboard/organization',
      icon: LayoutDashboard,
    },
    { title: 'Recruiters', path: '/organization/recruiters', icon: Users },
  ]

  const items =
    role === 'organization'
      ? organizationItems
      : role === 'recruiter'
        ? recruiterItems
        : candidateItems
  const toggleAriaLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      className={cn(
        'fixed left-0 top-[72px] z-40 flex h-[calc(100vh-72px)] flex-col',
        'bg-white/80 backdrop-blur-xl',
        'border-r border-[#E2E8F0] shadow-sm',
        !disableAnimation && 'transition-all duration-500 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[252px]',
        'max-lg:w-[252px] max-lg:transition-transform max-lg:duration-300 max-lg:shadow-xl',
        isCollapsed
          ? 'max-lg:-translate-x-full max-lg:pointer-events-none'
          : 'max-lg:translate-x-0 max-lg:pointer-events-auto'
      )}
      style={{
        transitionDuration: disableAnimation ? '0ms' : '500ms',
        transitionTimingFunction: disableAnimation ? undefined : 'ease-in-out',
      }}
    >
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'group absolute z-50 hidden h-8 w-8 items-center justify-center rounded-full',
          'border border-[#E2E8F0] bg-white text-[#64748B]',
          'shadow-sm hover:shadow-md transition-all duration-200 ease-in-out lg:flex cursor-pointer',
          'hover:border-[#3056F5] hover:text-[#3056F5]',
          'active:scale-95 active:shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-[#3056F5] focus:ring-offset-2',
          isCollapsed ? 'bottom-6 left-1/2 -translate-x-1/2' : 'top-6 -right-4'
        )}
        aria-label={toggleAriaLabel}
        aria-expanded={!isCollapsed}
        title={toggleAriaLabel}
      >
        {showPulse && (
          <div className="absolute inset-0 z-40">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3056F5] opacity-20" />
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#3056F5] opacity-10" />
          </div>
        )}

        <ToggleIcon
          className={cn(
            'h-4 w-4 transition-all duration-500 ease-in-out relative z-10',
            'group-hover:scale-110'
          )}
          style={{
            transform: isCollapsed ? 'rotateY(0deg)' : 'rotateY(180deg)',
          }}
        />
      </button>

      <nav
        className={cn(
          'relative pt-8 flex flex-col space-y-2 transition-all duration-500 max-lg:pt-6 overflow-y-auto overflow-x-hidden px-4 flex-1',
          isCollapsed ? 'items-center' : '',
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        )}
      >
        {items.map(item => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-label={item.title}
              title={item.title}
              className={cn(
                'group relative flex items-center rounded-xl transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0',
                isCollapsed ? 'w-12 h-12 justify-center' : 'w-full h-12 px-4 gap-3',
                isActive
                  ? 'bg-gradient-to-r from-[#3056F5] to-[#6366F1] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#64748B] hover:bg-blue-50/50 hover:text-[#3056F5]'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              <Icon
                className={cn(
                  'flex-shrink-0 transition-all duration-300',
                  isCollapsed ? 'h-6 w-6' : 'h-5 w-5',
                  isActive
                    ? 'text-white'
                    : 'text-[#64748B] group-hover:text-[#3056F5] group-hover:scale-110'
                )}
              />

              <span
                className={cn(
                  'text-[15px] font-medium whitespace-nowrap block transition-all duration-300',
                  isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100',
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-[#475569] group-hover:text-[#3056F5]'
                )}
              >
                {item.title}
              </span>

              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1E293B] text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                  {item.title}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[#1E293B]" />
                </div>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
