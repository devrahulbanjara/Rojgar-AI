'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useAppSelector } from '@/store/hooks'
import { useLogoutMutation } from '@/store/services/authApi'
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/services/notificationsApi'
import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  LogOut,
  Settings,
  User,
  X,
} from 'lucide-react'

import Avatar from '@/components/common/Avatar'

// DashRole uses the canonical roles.
export type DashRole = 'candidate' | 'recruiter_admin' | 'recruiter'

type NavItem = { label: string; href: string }

type DashNavbarProps = {
  role: DashRole
  userName?: string
  userRole?: string
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

function formatNotificationTime(value: string): string {
  return Number.isNaN(new Date(value).getTime()) ? value : formatRelativeDate(value)
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
      { label: 'Dashboard', href: '/candidate' },
      { label: 'Jobs', href: '/candidate/jobs' },
      { label: 'Applications', href: '/candidate/applications' },
      { label: 'Interviews', href: '/candidate/interviews' },
      { label: 'Resumes', href: '/candidate/resume' },
      { label: 'Profile', href: '/candidate/profile' },
    ]
  }
  // "recruiter" or "recruiter_admin" — IA: Jobs · Talent · Inbox · Team(admin)
  // Dashboard reachable via logo. Screening/Interviews/Outreach fold into Jobs pipeline (Phase 5).
  const items: NavItem[] = [
    { label: 'Jobs', href: '/recruiter/jobs' },
    { label: 'Talent', href: '/recruiter/talent' },
    { label: 'Interviews', href: '/recruiter/interviews' },
    { label: 'Inbox', href: '/recruiter/inbox' },
  ]
  if (role === 'recruiter_admin') {
    items.push({ label: 'Team', href: '/recruiter/team' })
  }
  return items
}

export default function DashNavbar({
  role,
  userName = 'User',
  userRole = 'Member',
}: DashNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAppSelector((s) => s.auth)
  // Optional: override `role` prop with the actual authenticated primary_role if available
  const activeRole = user?.primary_role || role
  const navItems = buildNavItems(activeRole as DashRole)
  const isCandidate = activeRole === 'candidate'

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [logout] = useLogoutMutation()

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    router.push('/login')
  }

  const { data: notificationsResponse, isFetching: notificationsLoading } =
    useGetNotificationsQuery(12)
  const [markNotificationRead] = useMarkNotificationReadMutation()
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation()
  const notifications =
    notificationsResponse?.data.map((notification) => ({
      id: notification.id,
      text: notification.body ?? notification.title,
      title: notification.title,
      time: notification.created_at,
      href: notification.href ?? (isCandidate ? '/candidate/notifications' : '/recruiter/inbox'),
      isRead: notification.is_read,
    })) ?? []
  const notificationsCount = notifications.filter((notification) => !notification.isRead).length
  const notificationsLink = isCandidate ? '/candidate/notifications' : '/recruiter/inbox'

  const displayName = user?.full_name ?? userName
  const displayRole =
    user?.primary_role === 'recruiter_admin'
      ? 'Company Admin'
      : user?.primary_role === 'recruiter'
        ? 'Recruiter'
        : user?.primary_role === 'candidate'
          ? 'Candidate'
          : userRole

  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
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
    const resetUiState = window.setTimeout(() => {
      setDropdownOpen(false)
      setNotificationsOpen(false)
    }, 0)

    return () => window.clearTimeout(resetUiState)
  }, [pathname])

  function isActive(href: string) {
    if (href === '/') return pathname === href
    // exact match only for root dashboard pages
    const isRoot = href === '/candidate' || href === '/recruiter'
    if (isRoot) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="dash-navbar">
      <div className="dash-navbar__inner container container--app-shell">
        {/* Logo — links to the role's dashboard root */}
        <Link href={isCandidate ? '/candidate' : '/recruiter'} className="dash-navbar__logo">
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
          {/* Notifications */}
          <div ref={notificationsRef} className="dash-navbar__notifications">
            <button
              type="button"
              className={`dash-navbar__icon-btn${notificationsOpen ? ' dash-navbar__icon-btn--active' : ''}`}
              title="Notifications"
              aria-label="Open notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              {notificationsCount > 0 ? <div className="dash-navbar__notif-dot" /> : null}
              <Bell size={18} />
            </button>

            {notificationsOpen ? (
              <div
                className="dash-navbar__notifications-panel"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="dash-navbar__notifications-header">
                  <div>
                    <div className="dash-navbar__notifications-title">Notifications</div>
                    <div className="dash-navbar__notifications-subtitle">
                      {notificationsLoading
                        ? 'Loading recent updates...'
                        : notifications.length > 0
                          ? `${notificationsCount} unread update${notificationsCount === 1 ? '' : 's'}`
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
                  {notificationsLoading ? (
                    <div className="activity-list activity-list--panel" aria-hidden="true">
                      <NotificationsSkeleton count={4} />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="dash-navbar__notifications-empty">
                      Application updates will show up here when there is something new.
                    </div>
                  ) : (
                    <div className="activity-list activity-list--panel">
                      {notifications.map((activity) => {
                        const href = activity.href

                        const content = (
                          <>
                            <div className="activity-item__dot" />
                            <div className="activity-item__body">
                              <p className="activity-item__text">
                                <strong>{activity.title}</strong>
                              </p>
                              <p className="activity-item__text">{activity.text}</p>
                              <div className="activity-item__time">
                                {formatNotificationTime(activity.time)}
                              </div>
                            </div>
                          </>
                        )

                        return href ? (
                          <Link
                            key={activity.id}
                            href={href}
                            className="activity-item activity-item--panel activity-item--link"
                            onClick={() => {
                              void markNotificationRead(activity.id)
                              setNotificationsOpen(false)
                            }}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={activity.id} className="activity-item activity-item--panel">
                            {content}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="dash-navbar__notifications-footer">
                  <Link href={notificationsLink} onClick={() => setNotificationsOpen(false)}>
                    View all notifications
                  </Link>
                  {notificationsCount > 0 ? (
                    <button
                      type="button"
                      className="dash-navbar__mark-read-btn"
                      onClick={() => void markAllNotificationsRead()}
                    >
                      Mark all read
                    </button>
                  ) : null}
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
              <Avatar
                name={displayName}
                src={user?.avatar_url}
                seed={user?.id}
                className="dash-navbar__avatar"
                sizes="36px"
              />
            </button>

            {dropdownOpen && (
              <div className="dash-navbar__dropdown">
                {/* User info block */}
                <div className="dash-navbar__dropdown-user">
                  <Avatar
                    name={displayName}
                    src={user?.avatar_url}
                    seed={user?.id}
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
                  href={activeRole === 'candidate' ? '/candidate/profile' : '/recruiter/profile'}
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} />
                  View Profile
                </Link>

                {activeRole === 'candidate' ? (
                  <Link
                    href="/candidate/resume"
                    className="dash-navbar__dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FileText size={15} />
                    My Resume
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/recruiter/settings"
                      className="dash-navbar__dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={15} />
                      Settings
                    </Link>
                    {activeRole === 'recruiter_admin' ? (
                      <>
                        <div className="dash-navbar__dropdown-divider" />
                        <Link
                          href="/recruiter/company/settings"
                          className="dash-navbar__dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Building2 size={15} />
                          Company
                        </Link>
                        <Link
                          href="/recruiter/team?tab=audit"
                          className="dash-navbar__dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ClipboardList size={15} />
                          Audit Trail
                        </Link>
                      </>
                    ) : null}
                  </>
                )}

                <div className="dash-navbar__dropdown-divider" />

                <button
                  type="button"
                  className="dash-navbar__dropdown-item dash-navbar__dropdown-item--danger"
                  onClick={() => void handleLogout()}
                >
                  <LogOut size={15} />
                  Log Out
                </button>
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
