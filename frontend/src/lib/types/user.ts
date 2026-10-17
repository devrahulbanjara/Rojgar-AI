// Shared user and membership types. Field names mirror the API (snake_case).

export type PrimaryRole = 'candidate' | 'recruiter_admin' | 'recruiter'

export type MembershipStatus = 'active' | 'pending' | 'rejected'

export interface RecruiterMember {
  membership_id: string
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  status: MembershipStatus
  joined_at: string
}

/** Returned by /auth/me and embedded in the login response. */
export interface BaseUser {
  id: string
  full_name: string
  email: string
  primary_role: PrimaryRole
  is_email_verified: boolean
  is_onboarded: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  /** Only present for recruiter users: their CompanyMembership approval status. */
  membership_status?: MembershipStatus
}

export interface PaginationMeta {
  total: number
  page: number
  size: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface Paginated<T> {
  items: T[]
  pagination: PaginationMeta
}
