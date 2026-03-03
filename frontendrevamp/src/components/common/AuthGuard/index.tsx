"use client";

/**
 * AuthGuard
 *
 * Wraps a protected route segment. Redirects:
 *  - Unauthenticated users  → /login?next=<current-path>
 *  - Wrong-role users       → their own role dashboard
 *
 * Usage:
 *   <AuthGuard requiredRole="candidate">{children}</AuthGuard>
 */

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { getRoleDashboard } from "@/lib/roleRoutes";
import type { PrimaryRole } from "@/lib/types/user";

interface AuthGuardProps {
  /** The role that is allowed to access this section. */
  requiredRole: PrimaryRole;
  children: ReactNode;
}

export default function AuthGuard({ requiredRole, children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // Still hydrating from localStorage — wait
    if (typeof window === "undefined") return;

    if (!isAuthenticated || !user) {
      // Not logged in — send to login with a return URL
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (user.primary_role !== requiredRole) {
      // Logged in but wrong role — send to their own dashboard
      router.replace(getRoleDashboard(user.primary_role));
    }
  }, [isAuthenticated, user, requiredRole, pathname, router]);

  // While redirecting, render nothing (avoids content flash)
  if (!isAuthenticated || !user || user.primary_role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
