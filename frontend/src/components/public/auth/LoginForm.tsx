'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { apiErrorCode } from '@/lib/apiErrorCode'
import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { publicApi } from '@/lib/publicApi'
import {
  consumePostAuthRedirect,
  getSafeRedirect,
  homePathFor,
  rememberPostAuthRedirect,
} from '@/lib/roleRoutes'
import type { BaseUser } from '@/lib/types/user'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initiateGoogleOAuth, useAuthOptions, useLoginMutation } from '@/store/services/authApi'
import { clearCredentials } from '@/store/slices/authSlice'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { AlertIcon, GoogleIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard, AuthDivider } from './AuthCard'
import { CheckEmail } from './CheckEmail'
import { PhoneCodeForm } from './PhoneCodeForm'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = { email?: string; password?: string }
type Method = 'link' | 'password' | 'phone'

/** Where to go once signed in: the remembered page, ?next=, or the person's home. */
export function useAfterSignIn(nextUrl: string | null) {
  const router = useRouter()
  return (user: BaseUser | null | undefined) =>
    router.push(consumePostAuthRedirect() ?? nextUrl ?? homePathFor(user))
}

/** Continue with Google and the "or" line under it, while Google sign-in is on. */
export function GoogleFirst() {
  const t = useT()
  const { google } = useAuthOptions()
  if (!google) return null
  return (
    <>
      <Button variant="outline" size="lg" className="w-full" onClick={() => initiateGoogleOAuth()}>
        <GoogleIcon className="size-4" />
        {t.auth.google}
      </Button>
      <AuthDivider />
    </>
  )
}

/** A quiet text button under a form ("Use password instead"). */
function QuietLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <Button type="button" variant="link" className="h-auto self-center p-0" onClick={onClick}>
      {children}
    </Button>
  )
}

/**
 * The one sign-in page for everyone (business teams, applicants, staff):
 * Google, or an emailed sign-in link, or email + password.
 */
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
  const afterSignIn = useAfterSignIn(nextUrl)
  const { sms } = useAuthOptions()

  const [method, setMethod] = useState<Method>('link')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(
    errorParams[searchParams.get('error') ?? ''] ?? null,
  )
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [unverified, setUnverified] = useState(false)

  // Keep the destination through the emailed link, verification and Google.
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
    if (method === 'password' && !password) next.password = t.auth.passwordRequired
    return next
  }

  async function sendLink() {
    setSending(true)
    try {
      await publicApi.magicLink(email.trim().toLowerCase())
      setSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setSending(false)
    }
  }

  async function signInWithPassword() {
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
      afterSignIn(result.data?.user)
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return
    if (method === 'link') await sendLink()
    else await signInWithPassword()
  }

  if (sent) {
    return (
      <CheckEmail
        email={email.trim()}
        onResend={sendLink}
        resending={sending}
        onChangeEmail={() => setSent(false)}
      />
    )
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
            {t.auth.login.startHiring}
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

      {sms && method === 'phone' ? (
        <PhoneCodeForm onSignedIn={(data) => afterSignIn(data.user)} />
      ) : (
        <>
          <GoogleFirst />
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

            {method === 'password' ? (
              <FormField id="password" label={t.auth.password} error={errors.password}>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  className="h-10"
                  autoFocus
                  value={password}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                />
                <Link href={forgotHref} className="self-end text-sm text-primary hover:underline">
                  {t.auth.login.forgot}
                </Link>
              </FormField>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={method === 'link' ? sending : isLoading}
            >
              {method === 'link' ? t.auth.login.sendLink : t.auth.login.submit}
            </Button>
          </form>
        </>
      )}

      <QuietLink
        onClick={() => {
          setFormError(null)
          setErrors({})
          setMethod(method === 'link' ? 'password' : 'link')
        }}
      >
        {method === 'link' ? t.auth.login.usePassword : t.auth.login.useLink}
      </QuietLink>
      {sms ? (
        <QuietLink
          onClick={() => {
            setFormError(null)
            setMethod(method === 'phone' ? 'link' : 'phone')
          }}
        >
          {method === 'phone' ? t.auth.phone.useEmail : t.auth.phone.usePhone}
        </QuietLink>
      ) : null}
    </AuthCard>
  )
}
