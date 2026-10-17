import {
  CandidatesIcon,
  type IconComponent,
  InterviewsIcon,
  JobsIcon,
  SettingsIcon,
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
  { label: 'Candidates', href: '/recruiter/talent', icon: CandidatesIcon },
  { label: 'Interviews', href: '/recruiter/interviews', icon: InterviewsIcon },
  { label: 'Team', href: '/recruiter/team', icon: TeamIcon, adminOnly: true },
]

export const RECRUITER_SETTINGS: NavItem = {
  label: 'Settings',
  href: '/recruiter/settings',
  icon: SettingsIcon,
}

export function isActivePath(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}
