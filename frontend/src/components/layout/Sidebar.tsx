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

const tooltipVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

export function Sidebar({ isCollapsed, onToggle, role, isMobileOpen = false, onMobileClose, disableAnimation = false }: SidebarProps) {
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
        animate={{ width: isCollapsed ? 80 : 260 }}
        transition={disableAnimation ? { duration: 0 } : sidebarSpring}
        className={cn(
          'fixed left-0 top-[72px] z-40 h-[calc(100vh-72px)] flex-col',
          'bg-background-surface/95 backdrop-blur-xl',
          'border-r border-border-default shadow-sm',
          'hidden lg:flex'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 dark:from-primary-950/20 via-transparent to-ai-50/30 dark:to-ai-950/20 pointer-events-none" />

        <motion.button
          type="button"
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
            const Icon = item.icon

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
                'fixed left-0 top-[72px] z-50 h-[calc(100vh-72px)] w-72 flex-col',
                'bg-background-surface/98 backdrop-blur-xl',
                'border-r border-border-default shadow-2xl',
                'lg:hidden flex'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 dark:from-primary-950/20 via-transparent to-ai-50/30 dark:to-ai-950/20 pointer-events-none" />

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

function NavItem({ item, isActive, isCollapsed, index, onNavigate }: NavItemProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const Icon = item.icon

  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={item.title}
      className={cn(
        'group relative flex items-center rounded-xl cursor-pointer overflow-visible',
        'transition-colors duration-200',
        isCollapsed ? 'h-12 w-12 justify-center mx-auto' : 'h-12 w-full px-4 gap-3',
        isActive
          ? 'bg-gradient-primary text-white shadow-lg shadow-primary/25'
          : 'text-text-tertiary hover:bg-primary-50/60 dark:hover:bg-primary-950/40 hover:text-primary'
      )}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div
        className={cn(
          'flex-shrink-0 transition-transform duration-200',
          isActive ? 'text-white' : 'text-text-tertiary group-hover:text-primary group-hover:scale-110'
        )}
      >
        <Icon className={cn('transition-colors duration-200', isCollapsed ? 'h-6 w-6' : 'h-5 w-5')} />
      </div>

      <span
        className={cn(
          'text-[15px] font-medium whitespace-nowrap transition-all duration-200',
          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100',
          isActive ? 'text-white font-semibold' : 'text-text-secondary group-hover:text-primary'
        )}
      >
        {item.title}
      </span>

      <AnimatePresence>
        {isCollapsed && isHovered && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              'absolute left-full ml-3 px-3 py-2 rounded-lg z-[100]',
              'bg-text-primary dark:bg-slate-800 text-white',
              'text-sm font-medium whitespace-nowrap',
              'shadow-xl pointer-events-none'
            )}
          >
            {item.title}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-text-primary dark:border-r-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}
