'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAppSelector } from '@/store/hooks'
import { LogOut } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

export type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

export type NavGroup = {
  groupLabel?: string
  items: NavItem[]
}

type DashSidebarProps = {
  role: 'candidate' | 'recruiter_admin' | 'recruiter'
  navGroups: NavGroup[]
  userName?: string
  userRole?: string
  userInitials?: string
  companySlug?: string
}

export default function DashSidebar({
  navGroups,
  userName = 'User',
  userRole = 'Member',
}: DashSidebarProps) {
  const pathname = usePathname()
  const { user } = useAppSelector((s) => s.auth)
  const displayName = user?.full_name ?? userName

  return (
    <aside className="dash-sidebar">
      {/* Logo */}
      <Link href="/" className="dash-sidebar__logo">
        <div className="dash-sidebar__logo-icon">CH</div>
        <span className="dash-sidebar__logo-text">ConvexHire</span>
      </Link>

      {/* User info */}
      <div className="dash-sidebar__user">
        <Avatar
          name={displayName}
          src={user?.avatar_url}
          seed={user?.id}
          className="dash-sidebar__user-avatar"
          sizes="40px"
        />
        <div className="dash-sidebar__user-info">
          <div className="dash-sidebar__user-name">{displayName}</div>
          <div className="dash-sidebar__user-role">{userRole}</div>
        </div>
        <div className="dash-sidebar__user-status" />
      </div>

      {/* Nav */}
      <nav className="dash-sidebar__nav">
        {navGroups.map((group, gi) => (
          <div key={gi} className="dash-sidebar__nav-group">
            {group.groupLabel && (
              <div className="dash-sidebar__nav-group-label">{group.groupLabel}</div>
            )}
            {group.items.map((item) => {
              const active =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-sidebar__nav-item${active ? ' dash-sidebar__nav-item--active' : ''}`}
                >
                  <span className="dash-sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="dash-sidebar__nav-badge">{item.badge}</span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="dash-sidebar__footer">
        <Link href="/login" className="dash-sidebar__nav-item dash-sidebar__nav-item--danger">
          <span className="dash-sidebar__nav-icon">
            <LogOut size={18} />
          </span>
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  )
}
