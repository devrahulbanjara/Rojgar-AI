'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAppSelector } from '@/store/hooks'
import { Bell, ChevronDown, FileText, LayoutGrid, LogOut, Search, User, X } from 'lucide-react'

// DashRole uses the three canonical roles.
export type DashRole = 'candidate' | 'recruiter_admin' | 'recruiter'

type NavItem = { label: string; href: string }

type DashNavbarProps = {
  role: DashRole
  userName?: string
  userRole?: string
  userInitials?: string
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

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
          <button className="dash-navbar__icon-btn" title="Notifications">
            <div className="dash-navbar__notif-dot" />
            <Bell size={18} />
          </button>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="dash-navbar__profile">
            <button
              className="dash-navbar__avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={dropdownOpen}
            >
              <div className="dash-navbar__avatar">{userInitials}</div>
              <ChevronDown
                className={`dash-navbar__avatar-chevron${dropdownOpen ? ' dash-navbar__avatar-chevron--open' : ''}`}
                size={12}
              />
            </button>

            {dropdownOpen && (
              <div className="dash-navbar__dropdown">
                {/* User info block */}
                <div className="dash-navbar__dropdown-user">
                  <div className="dash-navbar__dropdown-avatar">{userInitials}</div>
                  <div className="dash-navbar__dropdown-info">
                    <div className="dash-navbar__dropdown-name">{userName}</div>
                    <div className="dash-navbar__dropdown-role">{userRole}</div>
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

                <Link
                  href="/dashboard/resume"
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FileText size={15} />
                  My Resume
                </Link>

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
