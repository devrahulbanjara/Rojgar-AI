'use client'

/**
 * AuthGuard
 *
 * Wraps a protected route segment. Redirects:
 *  - Unauthenticated users  → /login?next=<current-path>
 *  - Wrong-role users       → their own role dashboard
 *
 * Usage:
 *   <AuthGuard requiredRole="candidate">{children}</AuthGuard>
 *   <AuthGuard requiredRole={["recruiter_admin", "recruiter"]}>{children}</AuthGuard>
 */
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { usePathname, useRouter } from 'next/navigation'

import { getRoleDashboard } from '@/lib/roleRoutes'
import type { PrimaryRole } from '@/lib/types/user'
import { useAppSelector } from '@/store/hooks'

interface AuthGuardProps {
  /** One role or an array of roles allowed to access this section. */
  requiredRole: PrimaryRole | PrimaryRole[]
  children: ReactNode
}

function hasRequiredRole(role: PrimaryRole, required: PrimaryRole | PrimaryRole[]): boolean {
  return Array.isArray(required) ? required.includes(role) : role === required
}

export default function AuthGuard({ requiredRole, children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  // Ensure the initial client render matches the server (both output null)
  // before the Redux store is rehydrated from localStorage.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    // Still hydrating from localStorage — wait
    if (typeof window === 'undefined') return

    if (!isAuthenticated || !user) {
      // Not logged in — send to login with a return URL
      toast.error('Please log in to access that page.')
      const next = encodeURIComponent(pathname)
      router.replace(`/login?next=${next}`)
      return
    }

    if (!hasRequiredRole(user.primary_role, requiredRole)) {
      // Logged in but wrong role — send to their own dashboard
      toast.error("You don't have permission to access that page.")
      router.replace(getRoleDashboard(user.primary_role))
      return
    }

    // Check onboarding status for candidates
    if (user.primary_role === 'candidate') {
      if (!user.is_onboarded && !pathname.startsWith('/onboarding')) {
        toast.info('Please complete your onboarding profile first.')
        router.replace('/onboarding')
        return
      }
      if (user.is_onboarded && pathname.startsWith('/onboarding')) {
        router.replace('/candidate')
        return
      }
    }
  }, [isAuthenticated, user, requiredRole, pathname, router])

  // While redirecting, render nothing (avoids content flash)
  if (!mounted) return null

  if (!isAuthenticated || !user || !hasRequiredRole(user.primary_role, requiredRole)) {
    return null
  }

  return <>{children}</>
}
