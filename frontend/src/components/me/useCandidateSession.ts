'use client'

import { useEffect, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery } from '@/store/services/authApi'
import { setCredentials, updateAccessToken } from '@/store/slices/authSlice'

export type CandidateSession =
  | { status: 'checking' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; accessToken: string }

// One request even when React runs the effect twice (dev) or two hooks mount.
let pending: Promise<string | null> | null = null

/** A fresh access token from the refresh cookie, or null when signed out. */
function refreshFromCookie(): Promise<string | null> {
  pending ??= fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
    .then(async (res) => {
      if (!res.ok) return null
      const body = (await res.json()) as { data?: { access_token?: string } }
      return body.data?.access_token ?? null
    })
    .catch(() => null)
    .finally(() => {
      pending = null
    })
  return pending
}

/**
 * Restores the session from the refresh cookie set by a sign-in link.
 * Unlike AuthGuard it never redirects to onboarding: applicants have no profile
 * to complete.
 */
export function useCandidateSession(): CandidateSession {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.accessToken)
  const [getMe] = useLazyGetMeQuery()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // A token in memory means we are signed in; only try the cookie otherwise.
    if (token) return
    let cancelled = false
    refreshFromCookie()
      .then(async (fresh) => {
        if (!fresh || cancelled) return
        dispatch(updateAccessToken(fresh))
        const me = await getMe()
          .unwrap()
          .catch(() => undefined)
        // Remember the session so public pages show "Open Rojgar AI" instead of "Log in".
        if (me?.data) dispatch(setCredentials({ accessToken: fresh, user: me.data }))
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setChecked(true))
    return () => {
      cancelled = true
    }
  }, [token, getMe, dispatch])

  if (token) return { status: 'signed-in', accessToken: token }
  return checked ? { status: 'signed-out' } : { status: 'checking' }
}
