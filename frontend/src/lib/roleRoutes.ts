import type { PrimaryRole } from "./types/user";

// ---------------------------------------------------------------------------
// Role → dashboard path mapping
// ---------------------------------------------------------------------------

/** The "home" dashboard for each role. */
export const ROLE_DASHBOARDS: Record<PrimaryRole, string> = {
  candidate: "/dashboard",
  recruiter: "/company",
  recruiter_admin: "/company",
};

/**
 * Returns the dashboard path for the given role.
 * Falls back to `/dashboard` if the role is unknown or not provided.
 */
export function getRoleDashboard(role: PrimaryRole | undefined | null): string {
  if (!role) return "/dashboard";
  return ROLE_DASHBOARDS[role] ?? "/dashboard";
}

// ---------------------------------------------------------------------------
// Route → required role mapping (used by AuthGuard)
// ---------------------------------------------------------------------------

/**
 * Each protected route prefix and the role(s) that may access it.
 * Note: /recruiter/* is not listed here because those pages redirect → /company.
 */
export const PROTECTED_ROUTES: { prefix: string; roles: PrimaryRole[] }[] = [
  { prefix: "/dashboard", roles: ["candidate"] },
  { prefix: "/company", roles: ["recruiter_admin", "recruiter"] },
];

/**
 * Given a pathname, returns the roles required to access it,
 * or `null` if the route is not role-restricted.
 */
export function getRequiredRoles(pathname: string): PrimaryRole[] | null {
  const match = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
  return match?.roles ?? null;
}
