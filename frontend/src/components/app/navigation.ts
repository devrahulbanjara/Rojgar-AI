import {
  Briefcase,
  CalendarDays,
  type LucideIcon,
  Settings,
  Sun,
  Users,
  UsersRound,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  adminOnly?: boolean
}

/** Recruiter/admin sidebar. Settings is pinned to the bottom separately. */
export const RECRUITER_NAV: NavItem[] = [
  { label: 'Today', href: '/recruiter', icon: Sun, exact: true },
  { label: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
  { label: 'Candidates', href: '/recruiter/talent', icon: Users },
  { label: 'Interviews', href: '/recruiter/interviews', icon: CalendarDays },
  { label: 'Team', href: '/recruiter/team', icon: UsersRound, adminOnly: true },
]

export const RECRUITER_SETTINGS: NavItem = {
  label: 'Settings',
  href: '/recruiter/settings',
  icon: Settings,
}

export function isActivePath(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}
