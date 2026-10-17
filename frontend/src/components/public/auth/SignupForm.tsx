'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { apiErrorStatus } from '@/lib/apiErrorCode'
import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { getSafeRedirect, rememberPostAuthRedirect } from '@/lib/roleRoutes'
import { useGoogleRegisterMutation, useSignupMutation } from '@/store/services/authApi'
import {
  useRegisterCompanyMutation,
  useRequestJoinCompanyMutation,
} from '@/store/services/companyApi'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { PasswordRules, passwordMeetsRules } from '@/components/app/PasswordRules'
import { AlertIcon, CompanyIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard } from './AuthCard'
import { CheckEmail } from './CheckEmail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The backend still requires these; the form no longer asks for them.
// Admins fill them in later from company settings.
const UNSET = 'Not specified'

type Role = 'recruiter_admin' | 'recruiter'
type Errors = Partial<Record<'fullName' | 'email' | 'password' | 'company', string>>

export function SignupForm() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = getSafeRedirect(searchParams.get('next'))
  const isOAuth = searchParams.get('oauth') === 'true'
  const oauthToken = searchParams.get('setup_token') ?? ''
  const oauthUser = parseUserInfo(searchParams.get('user_info'))
  const invited = (searchParams.get('join') ?? '').trim().slice(0, 200)

  const [signup, signupState] = useSignupMutation()
  const [googleRegister, googleState] = useGoogleRegisterMutation()
  const [registerCompany, registerState] = useRegisterCompanyMutation()
  const [requestJoin, joinState] = useRequestJoinCompanyMutation()
  const busy =
    signupState.isLoading || googleState.isLoading || registerState.isLoading || joinState.isLoading

  const [fullName, setFullName] = useState(oauthUser.full_name ?? '')
  const [email, setEmail] = useState(oauthUser.email ?? '')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState(invited)
  const [mode, setMode] = useState<'create' | 'join'>(invited ? 'join' : 'create')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState<null | 'created' | 'join-sent'>(null)

  // Signup is stateless until the email is verified, so the setup token can be
  // reused for retries and resends instead of signing up again.
  const tokenRef = useRef<{ role: Role; token: string } | null>(null)

  useEffect(() => {
    rememberPostAuthRedirect(nextUrl)
  }, [nextUrl])

  function validate(): Errors {
    const next: Errors = {}
    if (!isOAuth) {
      if (!fullName.trim()) next.fullName = t.auth.nameRequired
      if (!email.trim()) next.email = t.auth.signup.workEmailRequired
      else if (!EMAIL_RE.test(email.trim())) next.email = t.auth.emailInvalid
      if (!passwordMeetsRules(password)) next.password = t.auth.weakPassword
    }
    if (!company.trim()) next.company = t.auth.signup.businessRequired
    return next
  }

  async function setupTokenFor(role: Role): Promise<string | null> {
    if (tokenRef.current?.role === role) return tokenRef.current.token
    const result = isOAuth
      ? await googleRegister({ signup_token: oauthToken, primary_role: role }).unwrap()
      : await signup({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          primary_role: role,
        }).unwrap()
    const data = result.data as { setup_token?: string } | null | undefined
    if (!result.success || !data?.setup_token) {
      // A Google user who already has an account is signed in directly.
      if (isOAuth && result.success) router.push('/recruiter')
      else setFormError(result.message ?? t.auth.signup.failed)
      return null
    }
    tokenRef.current = { role, token: data.setup_token }
    return data.setup_token
  }

  async function submitCreate() {
    const token = await setupTokenFor('recruiter_admin')
    if (!token) return
    await registerCompany({
      setup_token: token,
      company_name: company.trim(),
      industry: UNSET,
      company_size: UNSET,
    }).unwrap()
    setDone('created')
  }

  async function submitJoin() {
    const token = await setupTokenFor('recruiter')
    if (!token) return
    await requestJoin({ setup_token: token, company_name: company.trim() }).unwrap()
    setDone('join-sent')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      if (mode === 'create') await submitCreate()
      else await submitJoin()
    } catch (err) {
      // The company is already on the platform: offer to join it instead.
      if (mode === 'create' && apiErrorStatus(err) === 409) {
        setMode('join')
        return
      }
      const parsed = parseApiError(err, {
        full_name: 'fullName',
        email: 'email',
        password: 'password',
        company_name: 'company',
      })
      if (Object.keys(parsed.fieldErrors).length) setErrors(parsed.fieldErrors as Errors)
      else setFormError(parsed.message)
    }
  }

  async function resend() {
    try {
      if (done === 'created') await submitCreate()
      else await submitJoin()
    } catch {
      // Resend failures are rare and harmless; the button simply re-enables.
    }
  }

  if (done) {
    return (
      <CheckEmail
        email={isOAuth ? (oauthUser.email ?? '') : email.trim()}
        title={done === 'created' ? t.auth.checkEmail : t.auth.signup.requestSent}
        line={
          done === 'join-sent'
            ? t.auth.signup.approveLine(company.trim())
            : undefined
        }
        onResend={resend}
        resending={busy}
        onChangeEmail={
          isOAuth
            ? undefined
            : () => {
                tokenRef.current = null
                setDone(null)
              }
        }
      />
    )
  }

  const companyLocked = !!invited
  const joining = mode === 'join'

  return (
    <AuthCard
      title={joining && companyLocked ? t.auth.signup.join(company) : t.auth.signup.title}
      footer={
        <>
          {t.auth.signup.haveAccount}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.auth.login.submit}
          </Link>
        </>
      }
      below={
        <>
          {t.auth.signup.applying}{' '}
          <Link href="/signin" className="font-medium text-foreground hover:underline">
            {t.auth.signup.noAccount}
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
        {!isOAuth ? (
          <>
            <FormField id="fullName" label={t.auth.fullName} error={errors.fullName}>
              <Input
                id="fullName"
                autoComplete="name"
                className="h-10"
                value={fullName}
                maxLength={120}
                aria-invalid={!!errors.fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>
            <FormField id="email" label={t.auth.signup.workEmail} error={errors.email}>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="h-10"
                value={email}
                maxLength={254}
                aria-invalid={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField id="password" label={t.auth.password} error={errors.password}>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                className="h-10"
                value={password}
                aria-invalid={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordRules value={password} />
            </FormField>
          </>
        ) : null}

        <FormField id="company" label={t.auth.signup.business} error={errors.company}>
          <Input
            id="company"
            autoComplete="organization"
            className="h-10"
            value={company}
            maxLength={200}
            readOnly={companyLocked}
            aria-invalid={!!errors.company}
            onChange={(e) => {
              setCompany(e.target.value)
              if (!companyLocked && mode === 'join') setMode('create')
            }}
          />
        </FormField>

        {joining && !companyLocked ? (
          <Alert>
            <CompanyIcon />
            <AlertDescription>
              {t.auth.signup.exists(company.trim())}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          <span className="truncate">
            {joining
              ? t.auth.signup.askJoin(company.trim() || t.auth.signup.theBusiness)
              : t.auth.signup.create}
          </span>
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

function parseUserInfo(raw: string | null): { email?: string; full_name?: string } {
  if (!raw) return {}
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return {}
  }
}
