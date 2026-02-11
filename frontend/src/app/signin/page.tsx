'use client'

import Link from 'next/link'
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper'
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton'
import { PageTransition } from '../../components/common/PageTransition'
import { useForm } from '../../hooks/useForm'
import { useAuth } from '../../hooks/useAuth'
import { validateEmail, validatePassword } from '../../lib/utils'
import { useState } from 'react'

export default function SignIn() {
  const { login, isLoading } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formState, formActions] = useForm<{
    email: string
    password: string
    rememberMe: string
  }>({
    initialValues: { email: '', password: '', rememberMe: 'false' },
    validationRules: {
      email: [validateEmail],
      password: [validatePassword],
    },
  })

  const { values, errors } = formState
  const { handleChange, handleSubmit, setFieldError } = formActions

  const handleSearchParams = (searchParams: URLSearchParams) => {
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setAuthError('Authentication failed. Please try again.')
    }
  }

  const onSubmit = async (formValues: Record<string, string>) => {
    try {
      await login({
        email: formValues.email,
        password: formValues.password,
        rememberMe: formValues.rememberMe === 'true',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setFieldError('email', errorMessage)
    }
  }

  const handleGoogleSuccess = () => {}

  const handleGoogleError = (error: string) => {
    setAuthError(error)
  }

  return (
    <PageTransition>
      <SearchParamsWrapper>
        {searchParams => {
          handleSearchParams(searchParams)
          return (
            <AuthLayout title="Welcome Back !" subtitle="Please enter your details">
              {authError && (
                <div className="mb-4 sm:mb-6 p-3 bg-error-50 border border-error/20 rounded-xl flex items-center gap-2 text-error text-xs sm:text-sm">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <GoogleOAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  disabled={isLoading}
                />
              </div>

              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-default" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="bg-background-surface px-3 sm:px-4 text-text-muted">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-text-primary"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="rahulbanjara@gmail.com"
                    value={values.email}
                    onChange={e => handleChange('email', e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-10 sm:h-12 px-3 sm:px-4 bg-background-surface border-[1.5px] rounded-lg sm:rounded-xl text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                      errors.email
                        ? 'border-error bg-error-50 focus:border-error focus:ring-4 focus:ring-error/10'
                        : 'border-border-default focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-medium text-text-primary"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={values.password}
                      onChange={e => handleChange('password', e.target.value)}
                      disabled={isLoading}
                      className={`w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-background-surface border-[1.5px] rounded-lg sm:rounded-xl text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                        errors.password
                          ? 'border-error bg-error-50 focus:border-error focus:ring-4 focus:ring-error/10'
                          : 'border-border-default focus:border-primary focus:ring-4 focus:ring-primary/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <label
                    htmlFor="rememberMe"
                    className="flex items-center gap-2.5 py-1 cursor-pointer group"
                  >
                    <div className="relative">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        checked={values.rememberMe === 'true'}
                        onChange={e => handleChange('rememberMe', e.target.checked.toString())}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-[18px] h-[18px] rounded border-2 transition-all duration-150 ease-in-out
                          ${
                            values.rememberMe === 'true'
                              ? 'bg-primary border-primary scale-105'
                              : 'bg-background-surface border-border-strong group-hover:border-text-tertiary'
                          }
                          ${!isLoading && 'group-hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]'}
                          ${isLoading && 'opacity-60 cursor-not-allowed'}
                        `}
                      >
                        {values.rememberMe === 'true' && (
                          <svg
                            className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-text-secondary font-normal select-none">
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs sm:text-sm font-medium text-primary hover:text-primary-700 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 btn-primary-gradient text-white text-sm sm:text-[15px] font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 mt-4 sm:mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-text-tertiary text-center leading-relaxed">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>

              <div className="mt-6 text-center">
                <p className="text-sm text-text-secondary">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-semibold text-text-primary hover:underline transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </AuthLayout>
          )
        }}
      </SearchParamsWrapper>
    </PageTransition>
  )
}
