import {
  BusinessIcon,
  CandidatesIcon,
  FlagIcon,
  type IconComponent,
  InsightsIcon,
  InterviewsIcon,
  JobsIcon,
  PaymentsIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TeamIcon,
  TodayIcon,
} from '@/components/icons'

export type NavItem = {
  label: string
  href: string
  icon: IconComponent
  exact?: boolean
  adminOnly?: boolean
}

/** Recruiter/admin sidebar. SettingsIcon is pinned to the bottom separately. */
export const RECRUITER_NAV: NavItem[] = [
  { label: 'Today', href: '/recruiter', icon: TodayIcon, exact: true },
  { label: 'Jobs', href: '/recruiter/jobs', icon: JobsIcon },
  { label: 'Applicants', href: '/recruiter/candidates', icon: CandidatesIcon },
  { label: 'Interviews', href: '/recruiter/interviews', icon: InterviewsIcon },
  { label: 'Team', href: '/recruiter/team', icon: TeamIcon, adminOnly: true },
]

/** Bottom group, above Settings. */
export const RECRUITER_INSIGHTS: NavItem = {
  label: 'Insights',
  href: '/recruiter/insights',
  icon: InsightsIcon,
}

export const RECRUITER_SETTINGS: NavItem = {
  label: 'Settings',
  href: '/recruiter/settings',
  icon: SettingsIcon,
}

/** Rojgar AI staff (/admin). */
export const ADMIN_NAV: NavItem[] = [
  { label: 'Approvals', href: '/admin', icon: ShieldCheckIcon, exact: true },
  { label: 'Businesses', href: '/admin/businesses', icon: BusinessIcon },
  { label: 'Reports', href: '/admin/reports', icon: FlagIcon },
  { label: 'Payments', href: '/admin/payments', icon: PaymentsIcon },
]

export function isActivePath(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}
