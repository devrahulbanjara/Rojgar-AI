'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { apiErrorCode } from '@/lib/apiErrorCode'
import { parseApiError } from '@/lib/apiError'
import { BRAND } from '@/lib/brand'
import {
  consumePostAuthRedirect,
  getRoleDashboard,
  getSafeRedirect,
  rememberPostAuthRedirect,
} from '@/lib/roleRoutes'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initiateGoogleOAuth, useLoginMutation } from '@/store/services/authApi'
import { clearCredentials } from '@/store/slices/authSlice'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { AlertIcon, GoogleIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard, AuthDivider } from './AuthCard'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = { email?: string; password?: string }

/** Messages for ?error= values that other flows redirect here with. */
const ERROR_PARAM_MESSAGES: Record<string, string> = {
  oauth_failed: 'Google sign-in did not finish. Try again.',
  link_invalid: 'That sign-in link has expired. Ask for a new one.',
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const nextUrl = getSafeRedirect(searchParams.get('next'))
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(
    ERROR_PARAM_MESSAGES[searchParams.get('error') ?? ''] ?? null,
  )
  const [unverified, setUnverified] = useState(false)

  // Keep the destination through signup, verification and OAuth.
  useEffect(() => {
    rememberPostAuthRedirect(nextUrl)
  }, [nextUrl])

  // Stored session with a live cookie → go straight in; stale storage → clear it.
  useEffect(() => {
    if (!isAuthenticated) return
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('auth_present=1'))
    if (hasCookie) {
      router.replace(consumePostAuthRedirect() ?? nextUrl ?? getRoleDashboard(user?.primary_role))
    } else {
      dispatch(clearCredentials())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): Errors {
    const next: Errors = {}
    if (!email.trim()) next.email = 'Enter your email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email.'
    if (!password) next.password = 'Enter your password.'
    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
        remember_me: true,
      }).unwrap()
      if (!result.success) {
        setFormError(result.message ?? 'Could not log in. Try again.')
        return
      }
      router.push(
        consumePostAuthRedirect() ?? nextUrl ?? getRoleDashboard(result.data?.user?.primary_role),
      )
    } catch (err) {
      const code = apiErrorCode(err)
      if (code === 'email_not_verified') {
        setUnverified(true)
        return
      }
      if (code === 'account_deleted') {
        setFormError('This account was deleted.')
        return
      }
      const parsed = parseApiError(err, { email: 'email', password: 'password' }, '')
      if (parsed.fieldErrors.email || parsed.fieldErrors.password) {
        setErrors(parsed.fieldErrors as Errors)
      } else {
        setFormError(
          parsed.status === 401 || !parsed.message ? 'Wrong email or password.' : parsed.message,
        )
      }
    }
  }

  if (unverified) {
    return (
      <AuthCard title="Verify your email">
        <p className="text-sm text-foreground">
          Open the link we sent to <strong>{email.trim()}</strong>, then log in.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setUnverified(false)}>
          Back to log in
        </Button>
      </AuthCard>
    )
  }

  const forgotHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : '/forgot-password'

  return (
    <AuthCard
      title="Log in"
      footer={
        <>
          New to {BRAND.name}?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create a company account
          </Link>
        </>
      }
      below={
        <>
          Applied for a job?{' '}
          <Link href="/signin" className="font-medium text-foreground hover:underline">
            Get a sign-in link
          </Link>
        </>
      }
    >
      {formError ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="h-10"
            value={email}
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password}
          aside={
            <Link href={forgotHref} className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="h-10"
            value={password}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
            }}
          />
        </FormField>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Log in
        </Button>
      </form>

      <AuthDivider />

      <Button variant="outline" size="lg" className="w-full" onClick={() => initiateGoogleOAuth()}>
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>
    </AuthCard>
  )
}
