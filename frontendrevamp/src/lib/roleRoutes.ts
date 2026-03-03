import type { PrimaryRole } from "./types/user";

// ---------------------------------------------------------------------------
// Role → dashboard path mapping
// ---------------------------------------------------------------------------

/** The "home" dashboard for each role. */
export const ROLE_DASHBOARDS: Record<PrimaryRole, string> = {
  candidate: "/dashboard",
  recruiter: "/company",
  company: "/company",
  admin: "/admin",
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
export const PROTECTED_ROUTES: { prefix: string; role: PrimaryRole }[] = [
  { prefix: "/dashboard", role: "candidate" },
  { prefix: "/company", role: "company" },
  { prefix: "/admin", role: "admin" },
];

/**
 * Given a pathname, returns the role required to access it,
 * or `null` if the route is not role-restricted.
 */
export function getRequiredRole(pathname: string): PrimaryRole | null {
  const match = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
  return match?.role ?? null;
}
