'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { LoginCredentials, SignupData, User, AuthResponse } from '../../types'
import { authService } from '../../services/authService'
import { queryKeys, getCachedUserData } from '../../lib/queryClient'
import { ROUTES } from '../../config/constants'
import { getDashboardRoute } from '../../lib/utils'

export const useCurrentUser = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const cachedUser = getCachedUserData()
    if (cachedUser) {
      queryClient.setQueryData(queryKeys.auth.user, cachedUser)
    }
  }, [queryClient])

  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      try {
        const user = await authService.getCurrentUser()
        console.warn('getCurrentUser response:', user)

        if (user) {
          const processedUser = {
            ...user,
            id: (user.id || user.user_id).toString(),
            userType: user.role,
          }
          console.warn('Processed user:', processedUser)
          return processedUser
        }
        return null
      } catch (error) {
        console.error('getCurrentUser error:', error)
        return null
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  })
}

export const useLogin = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return await authService.login(credentials)
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKeys.auth.user, data.user)

      const userType = data.user.userType || data.user.role
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType)
        router.push(dashboardRoute)
      }
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.user, null)
    },
  })
}

export const useSignup = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignupData): Promise<AuthResponse> => {
      return await authService.signup(data)
    },
    onSuccess: data => {
      queryClient.setQueryData(queryKeys.auth.user, data.user)

      const userType = data.user.userType || data.user.role
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType)
        router.push(dashboardRoute)
      }
    },
    onError: () => {
      queryClient.setQueryData(queryKeys.auth.user, null)
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
      queryClient.clear()
      router.push(ROUTES.HOME)
    },
    onError: () => {
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
