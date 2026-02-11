import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, LogOut, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '../common/ThemeToggle'
import { NotificationDropdown } from './NotificationDropdown'
import { authService } from '../../services/authService'
import { ROUTES } from '../../config/constants'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'

interface TopbarProps {
  onMenuClick?: () => void
  user: {
    name: string
    email: string
    role?: string
    picture?: string | null
  } | null
}

const BREADCRUMB_MAP: Record<string, { label: string; parent?: string }> = {
  '/dashboard/recruiter': { label: 'Dashboard' },
  '/dashboard/candidate': { label: 'Dashboard' },
  '/dashboard/organization': { label: 'Overview' },
  '/recruiter/jobs': { label: 'Jobs' },
  '/recruiter/candidates': { label: 'Candidates' },
  '/recruiter/shortlist': { label: 'Shortlist' },
  '/recruiter/interviews': { label: 'Interviews' },
  '/recruiter/final-selection': { label: 'Final Selection' },
  '/candidate/browse-jobs': { label: 'Browse Jobs' },
  '/candidate/resumes': { label: 'Resumes' },
  '/candidate/profile': { label: 'Profile' },
  '/organization/recruiters': { label: 'Recruiters' },
}

function Breadcrumbs() {
  const pathname = usePathname()

  const getBreadcrumbs = (): string[] => {
    if (!pathname) return []
    const match = BREADCRUMB_MAP[pathname]
    if (match) {
      if (match.parent) {
        const parentMatch = BREADCRUMB_MAP[match.parent]
        return [parentMatch?.label || '', match.label].filter(Boolean)
      }
      return [match.label]
    }
    // Fallback: generate from path segments
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return []
    const lastSegment = segments[segments.length - 1]
    return [lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')]
  }

  const crumbs = getBreadcrumbs()

  if (crumbs.length === 0) return null

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
          <span
            className={cn(
              'font-medium transition-colors',
              index === crumbs.length - 1 ? 'text-text-primary' : 'text-text-tertiary'
            )}
          >
            {crumb}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Determine if user is a recruiter based on role or current path
  const isRecruiter =
    user?.role === 'recruiter' ||
    pathname?.startsWith('/recruiter') ||
    pathname?.startsWith('/dashboard/recruiter')

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    try {
      await authService.logout()
      router.push(ROUTES.HOME)
    } catch {
      router.push(ROUTES.HOME)
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  // Close dropdown on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false)
    }
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDropdownOpen])

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b border-border-subtle dark:border-[#1E293B] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] bg-white/85 dark:bg-[#0F172A]/80 backdrop-blur-[12px]">
      <div className="flex items-center justify-between h-full px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <motion.button
              onClick={onMenuClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg hover:bg-background-subtle text-text-secondary hover:text-text-primary transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          )}

          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Link href={ROUTES.HOME}>
              <Image
                src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
                alt="ConvexHire Logo"
                width={180}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </motion.div>
        </div>

        {/* Center: Breadcrumbs */}
        <div className="hidden md:flex flex-1 justify-center">
          <Breadcrumbs />
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <ThemeToggle variant="icon-only" />

          {/* Notification Bell - Shows Recent Activity for Recruiters */}
          {isRecruiter ? (
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onToggle={() => setIsNotificationOpen(prev => !prev)}
              onClose={() => setIsNotificationOpen(false)}
            />
          ) : (
            <button
              className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-subtle transition-colors duration-200"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
          )}

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error-50/60 dark:hover:bg-error-950/20 transition-all duration-200"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </motion.button>

          {/* Separator */}
          <div className="h-6 w-px bg-border-default/60 mx-1.5 hidden sm:block" />

          {/* User Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className={cn(
                'group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer',
                isDropdownOpen
                  ? 'bg-background-subtle ring-1 ring-border-default'
                  : 'hover:bg-background-subtle'
              )}
              aria-label="User menu"
              aria-expanded={isDropdownOpen}
            >
              {user ? (
                <UserAvatar
                  name={user.name}
                  src={user.picture}
                  className="w-8 h-8 border-2 border-background-surface shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  U
                </div>
              )}
              <span className="hidden sm:block text-[13px] font-semibold text-text-primary max-w-[120px] truncate">
                {user?.name}
              </span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 w-64 bg-background-surface border border-border-default rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-border-default/60 bg-background-subtle/50">
                    <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{user?.email}</p>
                    {roleLabel && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full">
                        {roleLabel}
                      </span>
                    )}
                  </div>

                  {/* Future: Additional menu items can go here */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
