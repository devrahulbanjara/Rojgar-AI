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

        // Clear any old cached data before authenticating
        clearQueryCache()
        queryClient.clear()
        // Remove any cached user data
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

        // After successful OAuth, invalidate user query to force fresh fetch
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.user })
        
        // Fetch user data immediately to update the cache
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

        // Redirect based on response or default to candidate dashboard
        // The backend redirects, but we handle it client-side for better control
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Failed</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.push(ROUTES.LOGIN)}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Completing Authentication</h3>
          <p className="text-sm text-gray-500">
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
