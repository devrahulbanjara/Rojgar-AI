'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { getInitials } from '@/lib/mediaValidation'
import { useAppSelector } from '@/store/hooks'
import { useGetCandidateDashboardQuery } from '@/store/services/dashboardApi'
import { Bell, ChevronDown, FileText, LayoutGrid, LogOut, Search, User, X } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

// DashRole uses the three canonical roles.
export type DashRole = 'candidate' | 'recruiter_admin' | 'recruiter'

type NavItem = { label: string; href: string }

type DashNavbarProps = {
  role: DashRole
  userName?: string
  userRole?: string
  userInitials?: string
}

function formatRelativeDate(iso: string): string {
  const timestamp = new Date(iso).getTime()
  const diffMs = Date.now() - timestamp
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(diffMs / day)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NotificationsSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="activity-item activity-item--panel activity-item--skeleton">
      <div className="skeleton-block activity-item__dot activity-item__dot--skeleton" />
      <div className="activity-item__body">
        <div className="skeleton-block dashboard-activity-skeleton__line" />
        <div className="skeleton-block dashboard-activity-skeleton__line dashboard-activity-skeleton__line--short" />
        <div className="skeleton-block dashboard-activity-skeleton__time" />
      </div>
    </div>
  ))
}

function buildNavItems(role: DashRole): NavItem[] {
  if (role === 'candidate') {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Jobs', href: '/dashboard/jobs' },
      { label: 'Applications', href: '/dashboard/applications' },
      { label: 'Resumes', href: '/dashboard/resume' },
      { label: 'Profile', href: '/dashboard/profile' },
    ]
  }
  // "recruiter" or "recruiter_admin" — both share the company layout
  const items: NavItem[] = [
    { label: 'Dashboard', href: '/company' },
    { label: 'My Jobs', href: '/company/jobs' },
    { label: 'Applications', href: '/company/applications' },
    { label: 'Candidates', href: '/company/candidates' },
  ]
  if (role === 'recruiter_admin') {
    items.push({ label: 'Recruiters', href: '/company/recruiters' })
  }
  return items
}

export default function DashNavbar({
  role,
  userName = 'User',
  userRole = 'Member',
  userInitials = 'U',
}: DashNavbarProps) {
  const pathname = usePathname()
  const { user } = useAppSelector((s) => s.auth)
  // Optional: override `role` prop with the actual authenticated primary_role if available
  const activeRole = user?.primary_role || role
  const navItems = buildNavItems(activeRole as DashRole)
  const isCandidate = activeRole === 'candidate'

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const { data: dashboardResponse, isFetching: isNotificationsLoading } =
    useGetCandidateDashboardQuery(undefined, {
      skip: !isCandidate,
    })
  const notifications = dashboardResponse?.data.recent_activity ?? []
  const notificationsCount = notifications.length

  const displayName = user?.full_name ?? userName
  const displayInitials = getInitials(displayName, userInitials)
  const displayRole =
    user?.primary_role === 'recruiter_admin'
      ? 'Company Admin'
      : user?.primary_role === 'recruiter'
        ? 'Recruiter'
        : user?.primary_role === 'candidate'
          ? 'Candidate'
          : userRole

  const searchRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setDropdownOpen(false)
    setNotificationsOpen(false)
  }, [pathname])

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function isActive(href: string) {
    if (href === '/') return pathname === href
    // match exact for dashboard root
    const isRoot = href === '/dashboard' || href === '/company'
    if (isRoot) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="dash-navbar">
      <div className="dash-navbar__inner container">
        {/* Logo — links to the role's dashboard root */}
        <Link href={navItems[0].href} className="dash-navbar__logo">
          <Image
            src="/logo/logo.png"
            alt="ConvexHire"
            width={140}
            height={30}
            className="dash-navbar__logo-image"
            priority
          />
        </Link>

        {/* Nav links — centred via grid */}
        <nav className="dash-navbar__nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-navbar__nav-link${isActive(item.href) ? ' dash-navbar__nav-link--active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="dash-navbar__right">
          {/* Expandable search */}
          <div
            ref={searchRef}
            className={`dash-navbar__search${searchOpen ? ' dash-navbar__search--open' : ''}`}
          >
            <button
              className="dash-navbar__search-btn"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Toggle search"
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
            <input
              ref={searchInputRef}
              className="dash-navbar__search-input"
              placeholder="Search jobs, candidates…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <div ref={notificationsRef} className="dash-navbar__notifications">
            <button
              type="button"
              className={`dash-navbar__icon-btn${notificationsOpen ? ' dash-navbar__icon-btn--active' : ''}`}
              title="Notifications"
              aria-label="Open notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              onClick={() => {
                if (!isCandidate) return
                setNotificationsOpen((value) => !value)
              }}
            >
              {isCandidate && notificationsCount > 0 ? (
                <div className="dash-navbar__notif-dot" />
              ) : null}
              <Bell size={18} />
            </button>

            {isCandidate && notificationsOpen ? (
              <div
                className="dash-navbar__notifications-panel"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="dash-navbar__notifications-header">
                  <div>
                    <div className="dash-navbar__notifications-title">Notifications</div>
                    <div className="dash-navbar__notifications-subtitle">
                      {isNotificationsLoading
                        ? 'Loading recent updates...'
                        : notificationsCount > 0
                          ? `${notificationsCount} recent update${notificationsCount === 1 ? '' : 's'}`
                          : 'No new updates right now'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dash-navbar__notifications-close"
                    aria-label="Close notifications"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="dash-navbar__notifications-body">
                  {isNotificationsLoading ? (
                    <div className="activity-list activity-list--panel" aria-hidden="true">
                      <NotificationsSkeleton count={4} />
                    </div>
                  ) : notificationsCount === 0 ? (
                    <div className="dash-navbar__notifications-empty">
                      Application updates will show up here when there is something new.
                    </div>
                  ) : (
                    <div className="activity-list activity-list--panel">
                      {notifications.map((activity) => (
                        <div key={activity.id} className="activity-item activity-item--panel">
                          <div className="activity-item__dot" />
                          <div className="activity-item__body">
                            <p className="activity-item__text">{activity.text}</p>
                            <div className="activity-item__time">
                              {formatRelativeDate(activity.time)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="dash-navbar__notifications-footer">
                  <Link href="/dashboard/applications" onClick={() => setNotificationsOpen(false)}>
                    View applications
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="dash-navbar__profile">
            <button
              type="button"
              className="dash-navbar__avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={dropdownOpen}
            >
              <ChevronDown
                className={`dash-navbar__avatar-chevron${dropdownOpen ? ' dash-navbar__avatar-chevron--open' : ''}`}
                size={12}
              />
              <MediaBadge
                src={user?.avatar_url}
                alt={displayName}
                fallback={displayInitials}
                className="dash-navbar__avatar"
                sizes="36px"
              />
            </button>

            {dropdownOpen && (
              <div className="dash-navbar__dropdown">
                {/* User info block */}
                <div className="dash-navbar__dropdown-user">
                  <MediaBadge
                    src={user?.avatar_url}
                    alt={displayName}
                    fallback={displayInitials}
                    className="dash-navbar__dropdown-avatar"
                    sizes="42px"
                  />
                  <div className="dash-navbar__dropdown-info">
                    <div className="dash-navbar__dropdown-name">{displayName}</div>
                    <div className="dash-navbar__dropdown-role">{displayRole}</div>
                  </div>
                </div>

                <div className="dash-navbar__dropdown-divider" />

                <Link
                  href={role === 'candidate' ? '/dashboard/profile' : '/company/settings'}
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} />
                  View Profile
                </Link>

                <Link
                  href={role === 'candidate' ? '/dashboard' : '/company'}
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LayoutGrid size={15} />
                  Dashboard
                </Link>

                {activeRole === 'candidate' ? (
                  <Link
                    href="/dashboard/resume"
                    className="dash-navbar__dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FileText size={15} />
                    My Resume
                  </Link>
                ) : (
                  <Link
                    href="/company/settings"
                    className="dash-navbar__dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FileText size={15} />
                    Company Settings
                  </Link>
                )}

                <div className="dash-navbar__dropdown-divider" />

                <Link
                  href="/login"
                  className="dash-navbar__dropdown-item dash-navbar__dropdown-item--danger"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LogOut size={15} />
                  Log Out
                </Link>
              </div>
            )}
          </div>
          {/* /__profile */}
        </div>
        {/* /__right */}
      </div>
      {/* /__inner */}
    </nav>
  )
}
