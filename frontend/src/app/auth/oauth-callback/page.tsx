'use client'

import { Suspense, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

import { useRouter, useSearchParams } from 'next/navigation'

import { getRoleDashboard } from '@/lib/roleRoutes'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import type { AuthUser } from '@/store/slices/authSlice'

function OAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const handled = useRef(false) // prevent double-fire in React Strict Mode

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function handleCallback() {
      const accessToken = searchParams.get('access_token')
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

      if (errorParam || !accessToken) {
        toast.error('Google sign-in failed. Please try again.')
        router.replace(`/login?error=${errorParam ?? 'oauth_failed'}`)
        return
      }

      try {
        localStorage.setItem('access_token', accessToken)

        const userParam = searchParams.get('user')
        let user: AuthUser | null = null
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam)) as AuthUser
          } catch {
            /* ignore malformed param, will fetch below */
          }
        }

        if (!user) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const json = await res.json()
          if (json?.success && json?.data) {
            user = json.data as AuthUser
          }
        }

        if (!user) {
          toast.error('Could not load your profile. Please try again.')
          router.replace('/login?error=oauth_failed')
          return
        }

        dispatch(setCredentials({ accessToken, user }))
        localStorage.setItem('auth_user', JSON.stringify(user))

        toast.success(`Welcome, ${user.full_name}!`)
        router.replace(getRoleDashboard(user.primary_role))
      } catch {
        toast.error('Something went wrong during sign-in. Please try again.')
        router.replace('/login?error=oauth_failed')
      }
    }

    handleCallback()
  }, [searchParams, dispatch, router])

  return (
    <main
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
    </main>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackInner />
    </Suspense>
  )
}
