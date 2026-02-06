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
        animate={{ width: isCollapsed ? 80 : 220 }}
        transition={disableAnimation ? { duration: 0 } : sidebarSpring}
        suppressHydrationWarning
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-64px)] flex-col',
          'bg-background-subtle dark:bg-[#1E293B]',
          'border-r border-border-default dark:border-[#334155]',
          'hidden lg:flex'
        )}
      >
        <motion.button
          type="button"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          suppressHydrationWarning
          className={cn(
            'absolute -right-3.5 top-8 z-50 flex h-7 w-7 items-center justify-center rounded-full',
            'border border-border-default bg-background-surface text-text-tertiary',
            'shadow-md hover:shadow-lg transition-shadow duration-200',
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
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <nav className="relative flex-1 px-3 pt-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
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

        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-6 pt-2"
            >
              <div className="flex justify-center">
                <div className="w-8 h-1 rounded-full bg-border-default" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                'bg-background-subtle dark:bg-[#1E293B]',
                'border-r border-border-default dark:border-[#334155] shadow-2xl',
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
        'group relative flex items-center rounded-xl cursor-pointer',
        'transition-all duration-200',
        isCollapsed ? 'h-12 w-12 justify-center mx-auto' : 'h-12 w-full px-4 gap-3',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-[3px] border-l-primary-600 dark:border-l-primary-500 rounded-l-none'
          : 'text-text-tertiary hover:bg-primary-50/60 dark:hover:bg-primary-950/40 hover:text-primary'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-200 ease-out',
          isActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-text-tertiary group-hover:text-primary group-hover:scale-105'
        )}
      >
        <Icon
          className={cn('transition-colors duration-200', isCollapsed ? 'h-6 w-6' : 'h-5 w-5')}
        />
      </div>

      {/* Label with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait" initial={false}>
        {!isCollapsed && (
          <motion.span
            key="label"
            variants={textVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className={cn(
              'text-[15px] font-medium whitespace-nowrap overflow-hidden',
              isActive
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-text-secondary group-hover:text-primary'
            )}
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}
