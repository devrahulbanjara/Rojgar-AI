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

  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      try {
        const cachedUser = queryClient.getQueryData<User | null>(queryKeys.auth.user)

        const user = await authService.getCurrentUser()
        console.warn('getCurrentUser response:', user)

        if (user) {
          const processedUser = {
            ...user,
            id: (user.id || user.user_id).toString(),
            userType: user.role,
          }

          if (cachedUser) {
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

        if (cachedUser) {
          console.warn('API returned null user but cache has data. Clearing cache.')
          clearQueryCache()
          queryClient.setQueryData(queryKeys.auth.user, null)
        }

        return null
      } catch (error) {
        console.error('getCurrentUser error:', error)

        const cachedUser = queryClient.getQueryData<User | null>(queryKeys.auth.user)
        if (cachedUser) {
          console.warn('Error fetching user, clearing cached data')
          clearQueryCache()
          queryClient.setQueryData(queryKeys.auth.user, null)
        }
        return null
      }
    },
    staleTime: 0,

    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnMount: 'always',

    refetchOnWindowFocus: true,
  })
}

export const useLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      clearQueryCache()
      queryClient.clear()
      return await authService.login(credentials)
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKeys.auth.user, data.user)

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
      clearQueryCache()
      queryClient.clear()
      return await authService.signup(data)
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKeys.auth.user, data.user)

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
      clearQueryCache()
      queryClient.clear()
      router.push(ROUTES.HOME)
    },
    onError: () => {
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
