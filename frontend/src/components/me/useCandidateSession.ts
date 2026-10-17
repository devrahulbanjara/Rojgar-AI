'use client'

import { useEffect, useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLazyGetMeQuery, useRefreshMutation } from '@/store/services/authApi'
import { updateAccessToken } from '@/store/slices/authSlice'

export type CandidateSession =
  | { status: 'checking' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; accessToken: string }

/**
 * Restores the session from the refresh cookie set by a sign-in link.
 * Unlike AuthGuard it never redirects to onboarding: applicants have no profile
 * to complete.
 */
export function useCandidateSession(): CandidateSession {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.accessToken)
  const [refresh] = useRefreshMutation()
  const [getMe] = useLazyGetMeQuery()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // A token in memory means we are signed in; only try the cookie otherwise.
    if (token) return
    let cancelled = false
    refresh()
      .unwrap()
      .then(async (result) => {
        const fresh = result.data?.access_token
        if (!fresh || cancelled) return
        dispatch(updateAccessToken(fresh))
        await getMe()
          .unwrap()
          .catch(() => undefined)
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setChecked(true))
    return () => {
      cancelled = true
    }
  }, [token, refresh, getMe, dispatch])

  if (token) return { status: 'signed-in', accessToken: token }
  return checked ? { status: 'signed-out' } : { status: 'checking' }
}
