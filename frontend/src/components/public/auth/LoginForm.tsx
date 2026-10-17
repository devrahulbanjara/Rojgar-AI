'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { apiErrorCode } from '@/lib/apiErrorCode'
import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import {
  consumePostAuthRedirect,
  getSafeRedirect,
  homePathFor,
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

export function LoginForm() {
  const t = useT()
  // Messages for ?error= values that other flows redirect here with.
  const errorParams: Record<string, string> = {
    oauth_failed: t.auth.login.oauthFailed,
    link_invalid: t.auth.login.linkInvalid,
  }
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
    errorParams[searchParams.get('error') ?? ''] ?? null,
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
      router.replace(consumePostAuthRedirect() ?? nextUrl ?? homePathFor(user))
    } else {
      dispatch(clearCredentials())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): Errors {
    const next: Errors = {}
    if (!email.trim()) next.email = t.auth.emailRequired
    else if (!EMAIL_RE.test(email.trim())) next.email = t.auth.emailInvalid
    if (!password) next.password = t.auth.passwordRequired
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
        setFormError(result.message ?? t.auth.login.failed)
        return
      }
      router.push(
        consumePostAuthRedirect() ?? nextUrl ?? homePathFor(result.data?.user),
      )
    } catch (err) {
      const code = apiErrorCode(err)
      if (code === 'email_not_verified') {
        setUnverified(true)
        return
      }
      if (code === 'account_deleted') {
        setFormError(t.auth.login.deleted)
        return
      }
      const parsed = parseApiError(err, { email: 'email', password: 'password' }, '')
      if (parsed.fieldErrors.email || parsed.fieldErrors.password) {
        setErrors(parsed.fieldErrors as Errors)
      } else {
        setFormError(
          parsed.status === 401 || !parsed.message ? t.auth.login.wrong : parsed.message,
        )
      }
    }
  }

  if (unverified) {
    return (
      <AuthCard title={t.auth.login.verifyTitle}>
        <p className="text-sm text-foreground">{t.auth.login.verifyLine(email.trim())}</p>
        <Button variant="outline" className="w-full" onClick={() => setUnverified(false)}>
          {t.auth.backToLogin}
        </Button>
      </AuthCard>
    )
  }

  const forgotHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : '/forgot-password'

  return (
    <AuthCard
      title={t.auth.login.title}
      footer={
        <>
          {t.auth.login.newHere}{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            {t.auth.login.createAccount}
          </Link>
        </>
      }
      below={
        <>
          {t.auth.login.applied}{' '}
          <Link href="/signin" className="font-medium text-foreground hover:underline">
            {t.auth.login.getLink}
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
        <FormField id="email" label={t.auth.email} error={errors.email}>
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
          label={t.auth.password}
          error={errors.password}
          aside={
            <Link href={forgotHref} className="text-sm text-primary hover:underline">
              {t.auth.login.forgot}
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
          {t.auth.login.submit}
        </Button>
      </form>

      <AuthDivider />

      <Button variant="outline" size="lg" className="w-full" onClick={() => initiateGoogleOAuth()}>
        <GoogleIcon className="size-4" />
        {t.auth.google}
      </Button>
    </AuthCard>
  )
}
