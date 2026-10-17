// =============================================================================
// People and businesses, as returned by /auth/me and the login endpoints.
// Field names mirror the API (snake_case).
// =============================================================================

/** A person's role inside one business. There are no global roles. */
export type BusinessRole = 'owner' | 'manager' | 'interviewer'

/** pending → active (verified) · rejected · suspended, set by Rojgar AI staff. */
export type BusinessStatus = 'pending' | 'active' | 'suspended' | 'rejected'

export interface Membership {
  membership_id: string
  business_id: string
  business_name: string
  business_status: BusinessStatus
  /** Staff message: what to add, or why it was rejected or suspended. */
  status_reason: string | null
  role: BusinessRole
  /** The business the person is working in now. */
  active: boolean
}

export interface BaseUser {
  id: string
  /** Empty right after a phone sign-up, until the person adds it. */
  full_name: string
  email: string | null
  phone: string | null
  is_email_verified: boolean
  is_onboarded: boolean
  avatar_url: string | null
  created_at: string
  is_platform_admin: boolean
  memberships: Membership[]
  active_business: Membership | null
  has_applications: boolean
}

// ---------------------------------------------------------------------------
// Pagination wrapper
// ---------------------------------------------------------------------------

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
