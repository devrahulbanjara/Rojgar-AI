import type { BaseUser } from './types/user'

// ---------------------------------------------------------------------------
// Where each person belongs. There are no global roles: what someone can open
// follows from their memberships, applications and the platform staff flag.
// ---------------------------------------------------------------------------

/** What a protected area needs from the signed-in person. */
export type Access = 'person' | 'member' | 'platform_admin'

/**
 * Home for a signed-in person: staff → /admin, business teams → /recruiter,
 * applicants → /me/applications, anyone else → /start (create a business).
 */
export function homePathFor(user: BaseUser | null | undefined): string {
  if (!user) return '/login'
  if (user.is_platform_admin) return '/admin'
  if (user.active_business) return '/recruiter'
  if (user.has_applications) return '/me/applications'
  return '/start'
}

export function hasAccess(user: BaseUser, access: Access): boolean {
  if (access === 'platform_admin') return Boolean(user.is_platform_admin)
  if (access === 'member') return Boolean(user.active_business)
  return true
}

// ---------------------------------------------------------------------------
// Post-auth redirect ("next") — survives signup, email verification (often in
// a new tab) and Google OAuth so the user lands where they started.
// ---------------------------------------------------------------------------

const POST_AUTH_NEXT_KEY = 'rojgarai:postAuthNext'

/** Allow only safe relative paths — blocks open redirect via protocol or // */
export function getSafeRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/')) return null
  // Reject backslashes and control characters: browsers normalise "/\\evil.com"
  // to "//evil.com", which is protocol-relative.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null
  if (typeof window === 'undefined') return value.startsWith('//') ? null : value
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function rememberPostAuthRedirect(value: string | null | undefined): void {
  const safe = getSafeRedirect(value)
  if (!safe) return
  try {
    window.localStorage.setItem(POST_AUTH_NEXT_KEY, safe)
  } catch {
    // Storage unavailable; the redirect is a convenience only.
  }
}

/** Returns the remembered redirect and clears it. */
export function consumePostAuthRedirect(): string | null {
  try {
    const value = getSafeRedirect(window.localStorage.getItem(POST_AUTH_NEXT_KEY))
    window.localStorage.removeItem(POST_AUTH_NEXT_KEY)
    return value
  } catch {
    return null
  }
}
