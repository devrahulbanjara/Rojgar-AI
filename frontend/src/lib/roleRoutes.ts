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
