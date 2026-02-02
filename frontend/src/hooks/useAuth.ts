'use client'

import type { LoginCredentials, SignupData, UseAuthReturn } from '../types'
import {
  useCurrentUser,
  useLogin,
  useSignup,
  useLogout,
  useIsAuthenticated,
} from './queries/useAuthQueries'

export const useAuth = (): UseAuthReturn => {
  const { data: user, refetch: refetchUser } = useCurrentUser()
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated()

  const loginMutation = useLogin()
  const signupMutation = useSignup()
  const logoutMutation = useLogout()

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials)
  }

  const signup = async (data: SignupData) => {
    await signupMutation.mutateAsync(data)
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  const isLoading =
    authLoading || loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending

  return {
    user: user || null,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refetchUser,
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
    isLoginPending: loginMutation.isPending,
    isSignupPending: signupMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  }
}
