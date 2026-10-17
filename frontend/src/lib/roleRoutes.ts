import type { PrimaryRole } from './types/user'

// ---------------------------------------------------------------------------
// Role → dashboard path mapping
// ---------------------------------------------------------------------------

/** The "home" dashboard for each role. */
export const ROLE_DASHBOARDS: Record<PrimaryRole, string> = {
  candidate: '/candidate',
  recruiter: '/recruiter',
  recruiter_admin: '/recruiter',
}

/**
 * Returns the dashboard path for the given role.
 * Falls back to `/` if the role is unknown or not provided.
 */
export function getRoleDashboard(role: PrimaryRole | undefined | null): string {
  if (!role) return '/'
  return ROLE_DASHBOARDS[role] ?? '/'
}

// ---------------------------------------------------------------------------
// Route → required role mapping (used by AuthGuard)
// ---------------------------------------------------------------------------

/**
 * Each protected route prefix and the role(s) that may access it.
 */
export const PROTECTED_ROUTES: { prefix: string; roles: PrimaryRole[] }[] = [
  { prefix: '/candidate', roles: ['candidate'] },
  { prefix: '/recruiter', roles: ['recruiter_admin', 'recruiter'] },
]

/**
 * Given a pathname, returns the roles required to access it,
 * or `null` if the route is not role-restricted.
 */
export function getRequiredRoles(pathname: string): PrimaryRole[] | null {
  const match = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix))
  return match?.roles ?? null
}

// ---------------------------------------------------------------------------
// Post-auth redirect ("next") — survives signup, email verification (often in
// a new tab), onboarding and Google OAuth so the user lands where they started.
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
