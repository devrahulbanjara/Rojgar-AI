'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { useForgotPasswordMutation } from '@/store/services/authApi'

import { FormField } from '@/components/app/FormField'
import { AlertIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard } from './AuthCard'
import { CheckEmail } from './CheckEmail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordForm() {
  const t = useT()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  async function send() {
    await forgotPassword({ email: email.trim().toLowerCase() }).unwrap()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    if (!EMAIL_RE.test(email.trim())) {
      setError(t.auth.emailInvalid)
      return
    }
    try {
      await send()
      setSent(true)
    } catch (err) {
      const parsed = parseApiError(err, { email: 'email' })
      if (parsed.fieldErrors.email) setError(parsed.fieldErrors.email)
      else setFormError(parsed.message)
    }
  }

  if (sent) {
    return (
      <CheckEmail
        email={email.trim()}
        onResend={() => send().catch(() => undefined)}
        resending={isLoading}
        onChangeEmail={() => setSent(false)}
      />
    )
  }

  return (
    <AuthCard
      title={t.auth.forgot.title}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.auth.backToLogin}
        </Link>
      }
    >
      {formError ? (
        <Alert variant="destructive">
          <AlertIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField id="email" label={t.auth.email} error={error}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-10"
            value={email}
            maxLength={254}
            aria-invalid={!!error}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(undefined)
            }}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {t.auth.forgot.submit}
        </Button>
      </form>
    </AuthCard>
  )
}
