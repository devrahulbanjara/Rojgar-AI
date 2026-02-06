'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '../../../config/constants'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { clearQueryCache, queryKeys } from '../../../lib/queryClient'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')

        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`)
          return
        }

        if (!code) {
          setError('No authorization code received')
          return
        }

        clearQueryCache()
        queryClient.clear()

        queryClient.setQueryData(queryKeys.auth.user, null)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.statusText}`)
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.auth.user })

        try {
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/me`,
            {
              credentials: 'include',
            }
          )

          if (userResponse.ok) {
            const userData = await userResponse.json()
            const processedUser = {
              ...userData,
              id: (userData.id || userData.user_id).toString(),
              userType: userData.role,
            }
            queryClient.setQueryData(queryKeys.auth.user, processedUser)
          }
        } catch (err) {
          console.error('Failed to fetch user after OAuth:', err)
        }

        const redirectUrl = ROUTES.CANDIDATE_DASHBOARD
        router.push(redirectUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [searchParams, queryClient, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-subtle">
        <div className="max-w-md w-full bg-background-surface shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100 mb-4">
              <svg
                className="h-6 w-6 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Authentication Failed</h3>
            <p className="text-sm text-text-tertiary mb-4">{error}</p>
            <button
              onClick={() => router.push(ROUTES.LOGIN)}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-subtle">
      <div className="max-w-md w-full bg-background-surface shadow-lg rounded-lg p-6">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Completing Authentication</h3>
          <p className="text-sm text-text-tertiary">
            Please wait while we complete your Google sign-in...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-subtle">
          <div className="max-w-md w-full bg-background-surface shadow-lg rounded-lg p-6">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading...</h3>
              <p className="text-sm text-text-tertiary">Please wait...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
