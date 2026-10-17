'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { getSafeRedirect, rememberPostAuthRedirect } from '@/lib/roleRoutes'
import { useSignupMutation } from '@/store/services/authApi'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { PasswordRules, passwordMeetsRules } from '@/components/app/PasswordRules'
import { AlertIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard } from './AuthCard'
import { CheckEmail } from './CheckEmail'
import { GoogleFirst } from './LoginForm'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Partial<Record<'fullName' | 'email' | 'password', string>>

export function SignupForm() {
  const t = useT()
  const searchParams = useSearchParams()
  const nextUrl = getSafeRedirect(searchParams.get('next'))

  const [signup, { isLoading }] = useSignupMutation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    rememberPostAuthRedirect(nextUrl)
  }, [nextUrl])

  function validate(): Errors {
    const next: Errors = {}
    if (!fullName.trim()) next.fullName = t.auth.nameRequired
    if (!email.trim()) next.email = t.auth.emailRequired
    else if (!EMAIL_RE.test(email.trim())) next.email = t.auth.emailInvalid
    if (!passwordMeetsRules(password)) next.password = t.auth.weakPassword
    return next
  }

  async function submitSignup() {
    await signup({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    }).unwrap()
    setDone(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      await submitSignup()
    } catch (err) {
      const parsed = parseApiError(err, {
        full_name: 'fullName',
        email: 'email',
        password: 'password',
      })
      if (Object.keys(parsed.fieldErrors).length) setErrors(parsed.fieldErrors as Errors)
      else setFormError(parsed.message)
    }
  }

  async function resend() {
    try {
      await submitSignup()
    } catch {
      // Resend failures are rare and harmless; the button simply re-enables.
    }
  }

  if (done) {
    return (
      <CheckEmail
        email={email.trim()}
        onResend={resend}
        resending={isLoading}
        onChangeEmail={() => setDone(false)}
      />
    )
  }

  return (
    <AuthCard
      title={t.auth.signup.title}
      footer={
        <>
          {t.auth.signup.haveAccount}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.auth.login.submit}
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

      <GoogleFirst />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField id="fullName" label={t.auth.fullName} error={errors.fullName}>
          <Input
            id="fullName"
            autoComplete="name"
            className="h-10"
            value={fullName}
            maxLength={120}
            aria-invalid={!!errors.fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }))
            }}
          />
        </FormField>
        <FormField id="email" label={t.auth.email} error={errors.email}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-10"
            value={email}
            maxLength={254}
            aria-invalid={!!errors.email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
          />
        </FormField>
        <FormField id="password" label={t.auth.password} error={errors.password}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-10"
            value={password}
            aria-invalid={!!errors.password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
            }}
          />
          <PasswordRules value={password} />
        </FormField>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          <span className="truncate">{t.auth.signup.create}</span>
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {t.auth.signup.agree}{' '}
        <Link href="/terms" className="underline">
          {t.nav.terms}
        </Link>{' '}
        {t.auth.signup.and}{' '}
        <Link href="/privacy" className="underline">
          {t.auth.signup.privacyPolicy}
        </Link>
        .
      </p>
    </AuthCard>
  )
}
