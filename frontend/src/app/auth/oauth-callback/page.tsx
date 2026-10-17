'use client'

import { Suspense, useEffect, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { notify } from '@/lib/notify'
import { consumePostAuthRedirect, homePathFor } from '@/lib/roleRoutes'
import { useAppDispatch } from '@/store/hooks'
import { useLazyGetMeQuery, useRefreshMutation } from '@/store/services/authApi'
import { clearCredentials, setCredentials, updateAccessToken } from '@/store/slices/authSlice'

import { Spinner } from '@/components/app/Ai'

/**
 * Landing page after Google sign-in and after an emailed sign-in link.
 *
 * The backend sets the HttpOnly refresh cookie and redirects here. Tokens or
 * user objects in the URL are deliberately ignored: trusting them allows login
 * CSRF (an attacker's token planted in a victim's browser) and leaks tokens via
 * history and Referer. The session is established from the cookie instead.
 */
function OAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const [refreshToken] = useRefreshMutation()
  const [triggerGetMe] = useLazyGetMeQuery()
  const handled = useRef(false) // prevent double-fire in React Strict Mode

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function handleCallback() {
      const errorParam = searchParams.get('error')
      if (errorParam) {
        router.replace(`/login?error=${encodeURIComponent(errorParam)}`)
        return
      }

      try {
        const refreshed = await refreshToken().unwrap()
        const accessToken = refreshed.data?.access_token
        if (!refreshed.success || !accessToken) throw new Error('no session')
        // /auth/me needs the new token; without it the call 401s and refreshes again.
        dispatch(updateAccessToken(accessToken))

        const me = await triggerGetMe().unwrap()
        const user = me.data
        if (!me.success || !user) throw new Error('no user')

        dispatch(setCredentials({ accessToken, user }))
        notify.success(user.full_name ? `Welcome, ${user.full_name}!` : 'Welcome!')
        router.replace(consumePostAuthRedirect() ?? homePathFor(user))
      } catch {
        dispatch(clearCredentials())
        router.replace('/login?error=oauth_failed')
      }
    }

    void handleCallback()
  }, [searchParams, dispatch, router, refreshToken, triggerGetMe])

  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background"
      aria-live="polite"
      aria-label="Signing you in"
    >
      <Spinner />
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackInner />
    </Suspense>
  )
}
