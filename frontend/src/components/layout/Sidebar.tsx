'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  role: UserType
  isMobileOpen?: boolean
  onMobileClose?: () => void
  disableAnimation?: boolean
}

const sidebarSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

// Text animation variants
const textVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    display: 'block' as const,
    transition: { duration: 0.2, delay: 0.05, ease: [0.0, 0, 0.2, 1] as const },
  },
  collapsed: {
    opacity: 0,
    x: 8,
    transitionEnd: { display: 'none' as const },
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] as const },
  },
}

export function Sidebar({
  isCollapsed,
  onToggle,
  role,
  isMobileOpen = false,
  onMobileClose,
  disableAnimation = false,
}: SidebarProps) {
  const pathname = usePathname()

  const recruiterItems = [
    { title: 'Dashboard', path: '/dashboard/recruiter', icon: LayoutDashboard },
    { title: 'Jobs', path: '/recruiter/jobs', icon: BriefcaseIcon },
    { title: 'Candidates', path: '/recruiter/candidates', icon: Users },
    { title: 'Shortlist', path: '/recruiter/shortlist', icon: ListChecks },
    { title: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
    { title: 'Final Selection', path: '/recruiter/final-selection', icon: BarChart3 },
  ]

  const candidateItems = [
    { title: 'Dashboard', path: '/dashboard/candidate', icon: LayoutDashboard },
    { title: 'Jobs', path: '/candidate/browse-jobs', icon: Search },
    { title: 'Resumes', path: '/candidate/resumes', icon: FileText },
    { title: 'Profile', path: '/candidate/profile', icon: User },
  ]

  const organizationItems = [
    { title: 'Overview', path: '/dashboard/organization', icon: LayoutDashboard },
    { title: 'Recruiters', path: '/organization/recruiters', icon: Users },
  ]

  const items =
    role === 'organization'
      ? organizationItems
      : role === 'recruiter'
        ? recruiterItems
        : candidateItems

  const toggleAriaLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={disableAnimation ? { duration: 0 } : sidebarSpring}
        suppressHydrationWarning
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-64px)] flex-col',
          'bg-white dark:bg-background-surface',
          'border-r border-border-default dark:border-border',
          'hidden lg:flex'
        )}
      >
        <motion.button
          type="button"
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          suppressHydrationWarning
          className={cn(
            'absolute -right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full p-2',
            'border border-border-default bg-background-surface text-text-tertiary',
            'shadow-md hover:shadow-lg transition-all duration-200',
            'hover:border-primary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950/50',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label={toggleAriaLabel}
          aria-expanded={!isCollapsed}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isCollapsed ? 'expand' : 'collapse'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <nav className="relative flex-1 px-2 pt-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {items.map((item, index) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)

            return (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
                index={index}
              />
            )
          })}
        </nav>
      </motion.aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={sidebarSpring}
              className={cn(
                'fixed left-0 top-16 z-50 h-[calc(100vh-64px)] w-72 flex-col',
                'bg-white dark:bg-background-surface',
                'border-r border-border-default dark:border-border shadow-2xl',
                'lg:hidden flex'
              )}
            >
              <nav className="relative flex-1 px-4 pt-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {items.map((item, index) => {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)

                  return (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={isActive}
                      isCollapsed={false}
                      index={index}
                      onNavigate={onMobileClose}
                    />
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

interface NavItemProps {
  item: { title: string; path: string; icon: React.ComponentType<{ className?: string }> }
  isActive: boolean
  isCollapsed: boolean
  index: number
  onNavigate?: () => void
}

function NavItem({ item, isActive, isCollapsed, index: _index, onNavigate }: NavItemProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      aria-label={item.title}
      className={cn(
        'group relative flex items-center cursor-pointer',
        'transition-all duration-200',
        isCollapsed ? 'h-11 w-11 justify-center mx-auto rounded-lg' : 'h-[44px] w-full px-4 gap-3 rounded-[6px]',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-[3px] border-l-brand text-brand dark:text-primary-400 font-semibold'
          : 'text-text-tertiary hover:bg-primary-50/60 dark:hover:bg-primary-950/40 hover:text-primary'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-200 ease-out',
          isActive
            ? 'text-[#2563EB] dark:text-primary-400'
            : 'text-text-tertiary group-hover:text-primary'
        )}
      >
        <Icon
          className={cn('transition-colors duration-200', 'h-5 w-5')}
        />
      </div>

      {!isCollapsed && (
        <motion.span
          key="label"
          variants={textVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className={cn(
            'text-[14px] font-medium whitespace-nowrap overflow-hidden',
            isActive
              ? 'text-brand dark:text-primary-400'
              : 'text-text-secondary group-hover:text-primary'
          )}
        >
          {item.title}
        </motion.span>
      )}
    </Link>
  )
}

