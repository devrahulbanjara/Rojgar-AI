'use client'

import { Suspense, useEffect, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { notify } from '@/lib/notify'
import { consumePostAuthRedirect, getRoleDashboard } from '@/lib/roleRoutes'
import { useAppDispatch } from '@/store/hooks'
import { useLazyGetMeQuery, useRefreshMutation } from '@/store/services/authApi'
import { clearCredentials, setCredentials } from '@/store/slices/authSlice'

/**
 * Google OAuth landing page.
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
      const actionParam = searchParams.get('action')
      const setupToken = searchParams.get('setup_token')
      const userInfoStr = searchParams.get('user_info')

      if (actionParam === 'requires_setup' && setupToken && userInfoStr) {
        const params = new URLSearchParams({
          oauth: 'true',
          setup_token: setupToken,
          user_info: userInfoStr,
        })
        router.replace(`/signup?${params.toString()}`)
        return
      }

      if (errorParam) {
        router.replace(`/login?error=${encodeURIComponent(errorParam)}`)
        return
      }

      try {
        const refreshed = await refreshToken().unwrap()
        const accessToken = refreshed.data?.access_token
        if (!refreshed.success || !accessToken) throw new Error('no session')

        const me = await triggerGetMe().unwrap()
        const user = me.data
        if (!me.success || !user) throw new Error('no user')

        dispatch(setCredentials({ accessToken, user }))
        notify.success(`Welcome, ${user.full_name}!`)
        router.replace(consumePostAuthRedirect() ?? getRoleDashboard(user.primary_role))
      } catch {
        dispatch(clearCredentials())
        router.replace('/login?error=oauth_failed')
      }
    }

    void handleCallback()
  }, [searchParams, dispatch, router, refreshToken, triggerGetMe])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: 'inherit',
      }}
      aria-live="polite"
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #e5e7eb',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
        aria-hidden="true"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Completing sign-in…</p>
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
