'use client'

import { Suspense, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { applyFieldErrors, parseApiError } from '@/lib/apiError'
import { getRoleDashboard } from '@/lib/roleRoutes'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initiateGoogleOAuth, useLoginMutation } from '@/store/services/authApi'
import { clearCredentials } from '@/store/slices/authSlice'
import { Eye, EyeOff, Mail } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface LoginFormState {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors extends Record<string, string | undefined> {
  email?: string
  password?: string
  form?: string
}

// ── Inline SVG icons ───────────────────────────────────────────────────────

function EyeIcon() {
  return <Eye aria-hidden="true" />
}

function EyeSlashIcon() {
  return <EyeOff aria-hidden="true" />
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function EnvelopeIcon() {
  return <Mail />
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateForm(values: LoginFormState): FormErrors {
  const errors: FormErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  }

  return errors
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Allow only safe relative paths — blocks open redirect via protocol or // */
function getSafeRedirect(value: string | null): string | null {
  if (!value) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return null
}

// ── Component ──────────────────────────────────────────────────────────────

function LoginPageInner() {
  const searchParams = useSearchParams()
  const nextUrl = getSafeRedirect(searchParams.get('next'))

  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const router = useRouter()

  // On mount, if storage says authenticated:
  //   • auth_present cookie exists → real session, redirect to dashboard
  //   • no cookie → stale storage (refresh_token expired/cross-domain), clear it
  useEffect(() => {
    if (!isAuthenticated) return
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('auth_present=1'))
    if (hasCookie) {
      router.replace(nextUrl ?? getRoleDashboard(user?.primary_role))
    } else {
      dispatch(clearCredentials())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [formValues, setFormValues] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [login, { isLoading }] = useLoginMutation()

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [emailUnverified, setEmailUnverified] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const validationErrors = validateForm(formValues)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const result = await login({
        email: formValues.email,
        password: formValues.password,
        remember_me: formValues.rememberMe,
      }).unwrap()

      if (result.success) {
        toast.success('Signed in! Redirecting…')
        router.push(nextUrl ?? getRoleDashboard(result.data?.user?.primary_role))
      } else {
        toast.error(result.message ?? 'Login failed. Please try again.')
      }
    } catch (err: unknown) {
      const fieldMap: Record<string, string> = {
        email: 'email',
        password: 'password',
      }
      // Check for email-not-verified error (403 or specific message)
      const rtkErr = err as { status?: number; data?: { message?: string } }
      const errMsg = rtkErr?.data?.message ?? ''
      if (rtkErr?.status === 403 || /not verified|email.*verif|verif.*email/i.test(errMsg)) {
        setEmailUnverified(true)
        return
      }
      const parsed = parseApiError(err, fieldMap, 'Invalid credentials. Please try again.')
      const hadFieldErrors = applyFieldErrors(parsed.fieldErrors, setErrors)
      if (!hadFieldErrors) {
        toast.error(parsed.message)
      }
    }
  }

  function handleSocialLogin() {
    initiateGoogleOAuth()
    return
  }

  return (
    <main className="auth">
      {/* Background decorations */}
      <Image
        src="/bg/bg-ui-v3.svg"
        alt=""
        width={700}
        height={700}
        className="auth__bg-top"
        aria-hidden="true"
        priority={false}
      />
      <Image
        src="/bg/bg-ui-v5.svg"
        alt=""
        width={650}
        height={650}
        className="auth__bg-bottom"
        aria-hidden="true"
        priority={false}
      />

      <div className="auth__inner">
        {/* Header */}
        <header className="auth__header">
          <h1 className="auth__title">Sign in to ConvexHire</h1>
          <p className="auth__subtitle">
            Access thousands of job listings and career opportunities.
          </p>
        </header>

        {/* Card */}
        <div className="auth__card">
          {/* Email not verified alert */}
          {emailUnverified && (
            <div className="auth__unverified">
              <div className="auth__success-icon">
                <EnvelopeIcon />
              </div>
              <p className="auth__success-detail">
                Your email address hasn&apos;t been verified yet. Please check{' '}
                <strong>{formValues.email || 'your inbox'}</strong> for the verification link.
              </p>
              <p className="auth__success-note">
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEmailUnverified(false)}
                >
                  Try a different account
                </button>
              </p>
            </div>
          )}

          {!emailUnverified && (
            <>
              <form className="auth__form" onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="auth__field">
                  <label htmlFor="email" className="auth__label">
                    Email address
                  </label>
                  <div className="auth__input-wrap">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formValues.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`auth__input${errors.email ? ' auth__input--error' : ''}`}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <span id="email-error" className="auth__error-msg" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="auth__field">
                  <label htmlFor="password" className="auth__label">
                    Password
                  </label>
                  <div className="auth__input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={formValues.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`auth__input auth__input--password${errors.password ? ' auth__input--error' : ''}`}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      className="btn btn--icon btn--sm"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && (
                    <span id="password-error" className="auth__error-msg" role="alert">
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Remember me + Forgot password */}
                <div className="auth__field-row">
                  <label className="auth__checkbox-field">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formValues.rememberMe}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="auth__forgot">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`btn btn--primary btn--lg btn--full${isLoading ? ' btn--loading' : ''}`}
                  aria-busy={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              {/* Divider */}
              <div className="auth__divider">
                <span>or continue with</span>
              </div>

              {/* Social login */}
              <div className="auth__social-btns">
                <button
                  type="button"
                  className="btn btn--secondary btn--full"
                  onClick={() => handleSocialLogin()}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
              </div>
            </>
          )}
        </div>

        {/* Switch to signup */}
        <p className="auth__switch">
          Don&apos;t have an account?
          <Link href="/signup">Create one for free</Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
