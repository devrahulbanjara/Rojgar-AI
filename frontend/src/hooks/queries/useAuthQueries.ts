'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { LoginCredentials, SignupData, User, AuthResponse } from '../../types'
import { authService } from '../../services/authService'
import { queryKeys, clearQueryCache } from '../../lib/queryClient'
import { ROUTES } from '../../config/constants'
import { getDashboardRoute } from '../../lib/utils'

export const useCurrentUser = () => {
  const queryClient = useQueryClient()

  // Don't restore cached data automatically - let the API call fetch fresh data
  // This prevents showing stale user data after logout/login

  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      try {
        // Get any existing cached user data for comparison
        const cachedUser = queryClient.getQueryData<User | null>(queryKeys.auth.user)

        const user = await authService.getCurrentUser()
        console.warn('getCurrentUser response:', user)

        if (user) {
          const processedUser = {
            ...user,
            id: (user.id || user.user_id).toString(),
            userType: user.role,
          }

          // If we have cached user data and it's different from the fetched user, clear cache
          if (cachedUser) {
            // Handle both id and user_id properties safely
            const cachedUserRecord = cachedUser as Record<string, unknown>
            const cachedId = (cachedUser.id || cachedUserRecord.user_id)?.toString()
            const fetchedId = processedUser.id

            if (cachedId && fetchedId && cachedId !== fetchedId) {
              console.warn(
                'User mismatch detected! Clearing cache. Cached:',
                cachedId,
                'Fetched:',
                fetchedId
              )
              clearQueryCache()
              queryClient.clear()
            }
          }

          console.warn('Processed user:', processedUser)
          return processedUser
        }

        // If API returns null but we have cached data, clear it
        if (cachedUser) {
          console.warn('API returned null user but cache has data. Clearing cache.')
          clearQueryCache()
          queryClient.setQueryData(queryKeys.auth.user, null)
        }

        return null
      } catch (error) {
        console.error('getCurrentUser error:', error)
        // On error, clear any cached data to prevent showing stale user
        const cachedUser = queryClient.getQueryData<User | null>(queryKeys.auth.user)
        if (cachedUser) {
          console.warn('Error fetching user, clearing cached data')
          clearQueryCache()
          queryClient.setQueryData(queryKeys.auth.user, null)
        }
        return null
      }
    },
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })
}

export const useLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      // Clear any old cached data before logging in
      clearQueryCache()
      queryClient.clear()
      return await authService.login(credentials)
    },
    onSuccess: data => {
      // Set new user data and invalidate to ensure fresh data is fetched
      queryClient.setQueryData(queryKeys.auth.user, data.user)
      // Invalidate to trigger a refetch and ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user })

      const userType = data.user.userType || data.user.role
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType)
        router.push(dashboardRoute)
      }
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.user, null)
      clearQueryCache()
    },
  })
}

export const useSignup = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignupData): Promise<AuthResponse> => {
      // Clear any old cached data before signing up
      clearQueryCache()
      queryClient.clear()
      return await authService.signup(data)
    },
    onSuccess: data => {
      // Set new user data and invalidate to ensure fresh data is fetched
      queryClient.setQueryData(queryKeys.auth.user, data.user)
      // Invalidate to trigger a refetch and ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user })

      const userType = data.user.userType || data.user.role
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType)
        router.push(dashboardRoute)
      }
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.user, null)
      clearQueryCache()
    },
  })
}

export const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await authService.logout()
    },
    onSuccess: () => {
      // Clear both query cache and localStorage
      clearQueryCache()
      queryClient.clear()
      router.push(ROUTES.HOME)
    },
    onError: () => {
      // Clear both query cache and localStorage even on error
      clearQueryCache()
      queryClient.clear()
      router.push(ROUTES.HOME)
    },
  })
}

export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useCurrentUser()
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  }
}
