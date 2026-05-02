'use client'

/**
 * AuthGuard
 *
 * Wraps a protected route segment. Redirects:
 *  - Unauthenticated users  → /login?next=<current-path>
 *  - Wrong-role users       → their own role dashboard
 *
 * Session restore (new tab / sessionStorage):
 *  If there is no access token in Redux (e.g. sessionStorage is per-tab), we POST
 *  /auth/refresh using the HttpOnly refresh cookie before deciding the user is logged out.
 *
 * Usage:
 *   <AuthGuard requiredRole="candidate">{children}</AuthGuard>
 *   <AuthGuard requiredRole={["recruiter_admin", "recruiter"]}>{children}</AuthGuard>
 */
import { type ReactNode, useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { notify } from '@/lib/notify'
import { usePathname, useRouter } from 'next/navigation'

import { getRoleDashboard } from '@/lib/roleRoutes'
import type { PrimaryRole } from '@/lib/types/user'
import type { RootState } from '@/store'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery, useRefreshMutation } from '@/store/services/authApi'
import { clearCredentials, updateAccessToken } from '@/store/slices/authSlice'

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
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  const [refreshToken] = useRefreshMutation()
  const [triggerGetMe] = useLazyGetMeQuery()

  // Client-only mount (match server render)
  const [mounted, setMounted] = useState(false)
  // After trying POST /auth/refresh when Redux has no access token (shared cookie, new tab)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    async function restoreSession() {
      const token = store.getState().auth.accessToken
      if (token) {
        if (!cancelled) setSessionChecked(true)
        return
      }

      try {
        const result = await refreshToken().unwrap()
        if (cancelled) return
        if (result.success && result.data?.access_token) {
          dispatch(updateAccessToken(result.data.access_token))
          try {
            await triggerGetMe().unwrap()
          } catch {
            dispatch(clearCredentials())
          }
        }
      } catch {
        // No valid refresh cookie — user is logged out
      } finally {
        if (!cancelled) setSessionChecked(true)
      }
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [store, dispatch, refreshToken, triggerGetMe])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mounted || !sessionChecked) return

    if (!isAuthenticated || !user) {
      notify.error('Please log in to access that page.')
      const next = encodeURIComponent(pathname)
      router.replace(`/login?next=${next}`)
      return
    }

    if (!hasRequiredRole(user.primary_role, requiredRole)) {
      notify.error("You don't have permission to access that page.")
      router.replace(getRoleDashboard(user.primary_role))
      return
    }

    if (user.primary_role === 'candidate') {
      if (!user.is_onboarded && !pathname.startsWith('/onboarding')) {
        notify.info('Please complete your onboarding profile first.')
        router.replace('/onboarding')
        return
      }
      if (user.is_onboarded && pathname.startsWith('/onboarding')) {
        router.replace('/candidate')
        return
      }
    }
  }, [mounted, sessionChecked, isAuthenticated, user, requiredRole, pathname, router])

  if (!mounted || !sessionChecked) return null

  if (!isAuthenticated || !user || !hasRequiredRole(user.primary_role, requiredRole)) {
    return null
  }

  return <>{children}</>
}
