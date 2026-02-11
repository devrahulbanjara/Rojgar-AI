'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SearchParamsWrapper } from '../../components/common/SearchParamsWrapper'
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { UserTypeSelector } from '../../components/forms/UserTypeSelector'
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton'
import { PageTransition } from '../../components/common/PageTransition'
import { useForm } from '../../hooks/useForm'
import { useAuth } from '../../hooks/useAuth'
import { validateEmail, validatePassword, validateName } from '../../lib/utils'
import { USER_TYPES } from '../../config/constants'
import type { UserType } from '../../types'

export default function Signup() {
  const { signup, isLoading } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formState, formActions] = useForm<{
    name: string
    email: string
    password: string
    confirmPassword: string
    userType: UserType
  }>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: USER_TYPES.CANDIDATE as UserType,
    },
    validationRules: {
      name: [validateName],
      email: [validateEmail],
      password: [validatePassword],
    },
  })

  const { values, errors } = formState
  const { handleChange, handleSubmit, setFieldError } = formActions

  useEffect(() => {
    if (values.confirmPassword) {
      if (!values.confirmPassword) {
        setFieldError('confirmPassword', 'Please confirm your password')
      } else if (values.password && values.confirmPassword !== values.password) {
        setFieldError('confirmPassword', 'Passwords do not match')
      } else {
        setFieldError('confirmPassword', '')
      }
    }
  }, [values.password, values.confirmPassword, setFieldError])

  const handleSearchParams = (searchParams: URLSearchParams) => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'candidate' || typeParam === 'recruiter') {
      handleChange('userType', typeParam as UserType)
    }

    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setAuthError('Authentication failed. Please try again.')
    }
  }

  const onSubmit = async (formValues: Record<string, string>) => {
    if (formValues.password !== formValues.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match')
      return
    }

    try {
      if (formValues.userType === 'organization') {
        const { authService } = await import('../../services/authService')
        await authService.organizationSignup({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
        })
        window.location.href = '/dashboard/organization'
      } else {
        await signup({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
          userType: formValues.userType as UserType,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.'
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
            <AuthLayout title="Create Account" subtitle="Join ConvexHire to start hiring smarter">
              {authError && (
                <div className="mb-4 sm:mb-6 p-3 bg-error-50 border border-error/20 rounded-[5px] flex items-center gap-2 text-error text-xs sm:text-sm">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              {values.userType === 'candidate' && (
                <div className="mb-4 sm:mb-6">
                  <GoogleOAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    disabled={isLoading}
                  />
                </div>
              )}

              {values.userType === 'candidate' && (
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
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-text-primary">
                    I am a
                  </label>
                  <UserTypeSelector
                    value={values.userType}
                    onChange={value => handleChange('userType', value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-medium text-text-primary"
                  >
                    {values.userType === 'organization' ? 'Organization Name' : 'Full Name'}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={
                      values.userType === 'organization' ? 'ABC Corporation' : 'Rahul Banjara'
                    }
                    value={values.name}
                    onChange={e => handleChange('name', e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-10 sm:h-12 px-3 sm:px-4 bg-background-surface border-[1.5px] rounded-[5px] text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                      errors.name
                        ? 'border-error bg-error-50 focus:border-error focus:ring-4 focus:ring-error/10'
                        : 'border-border-default focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-text-primary"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="rahulbanjara@gmail.com"
                    value={values.email}
                    onChange={e => handleChange('email', e.target.value)}
                    disabled={isLoading}
                    className={`w-full h-10 sm:h-12 px-3 sm:px-4 bg-background-surface border-[1.5px] rounded-[5px] text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
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
                      placeholder="Create a password"
                      value={values.password}
                      onChange={e => handleChange('password', e.target.value)}
                      disabled={isLoading}
                      className={`w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-background-surface border-[1.5px] rounded-[5px] text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
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
                  {errors.password ? (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted">Minimum 8 characters</p>
                  )}
                </div>

                {}
                <div className="space-y-1 sm:space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-medium text-text-primary"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={values.confirmPassword}
                      onChange={e => handleChange('confirmPassword', e.target.value)}
                      disabled={isLoading}
                      className={`w-full h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-background-surface border-[1.5px] rounded-[5px] text-sm sm:text-[15px] text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                        errors.confirmPassword
                          ? 'border-error bg-error-50 focus:border-error focus:ring-4 focus:ring-error/10'
                          : 'border-border-default focus:border-primary focus:ring-4 focus:ring-primary/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-error flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 btn-primary-gradient text-white text-sm sm:text-[15px] font-semibold rounded-[5px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 mt-4 sm:mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-text-tertiary text-center leading-relaxed">
                By creating an account, you agree to our{' '}
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
                  Already have an account?{' '}
                  <Link
                    href="/signin"
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors"
                  >
                    Sign In
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
