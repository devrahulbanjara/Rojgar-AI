'use client'

/**
 * AuthGuard
 *
 * Wraps a protected route segment. Redirects:
 *  - Unauthenticated users       → /login?next=<current-path>
 *  - People without the access   → their own home (homePathFor)
 *
 * Session restore (new tab / sessionStorage):
 *  If there is no access token in Redux (e.g. sessionStorage is per-tab), we POST
 *  /auth/refresh using the HttpOnly refresh cookie before deciding the user is logged out.
 *
 * Usage:
 *   <AuthGuard access="member">{children}</AuthGuard>
 */
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import { usePathname, useRouter } from 'next/navigation'

import { notify } from '@/lib/notify'
import { type Access, hasAccess, homePathFor } from '@/lib/roleRoutes'
import type { RootState } from '@/store'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery, useRefreshMutation } from '@/store/services/authApi'
import { clearCredentials, updateAccessToken } from '@/store/slices/authSlice'

let restoring: Promise<void> | null = null

interface AuthGuardProps {
  /** person: anyone signed in · member: on a business team · platform_admin: staff. */
  access: Access
  children: ReactNode
}

export default function AuthGuard({ access, children }: AuthGuardProps) {
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
  // Track whether this mount ever saw an authenticated user — intentional logout should be silent
  const wasAuthenticatedRef = useRef(false)

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

      // One restore at a time: refresh tokens rotate, so a second parallel
      // call (React dev double effects, two guards) would be refused.
      restoring ??= (async () => {
        try {
          const result = await refreshToken().unwrap()
          if (!result.success || !result.data?.access_token) return
          dispatch(updateAccessToken(result.data.access_token))
          try {
            await triggerGetMe().unwrap()
          } catch {
            dispatch(clearCredentials())
          }
        } catch {
          // No valid refresh cookie — user is logged out
        }
      })().finally(() => {
        restoring = null
      })
      await restoring
      if (!cancelled) setSessionChecked(true)
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
      if (!wasAuthenticatedRef.current) {
        notify.error('Please log in to access that page.')
      }
      const next = encodeURIComponent(`${pathname}${window.location.search}`)
      router.replace(`/login?next=${next}`)
      return
    }

    wasAuthenticatedRef.current = true

    if (!hasAccess(user, access)) {
      router.replace(homePathFor(user))
      return
    }
  }, [mounted, sessionChecked, isAuthenticated, user, access, pathname, router])

  if (!mounted || !sessionChecked) return null

  if (!isAuthenticated || !user || !hasAccess(user, access)) {
    return null
  }

  return <>{children}</>
}
