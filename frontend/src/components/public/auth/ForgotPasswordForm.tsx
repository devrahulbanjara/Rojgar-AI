'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
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
      setError('Enter a valid email.')
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
      title="Reset your password"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
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
        <FormField id="email" label="Email" error={error}>
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
          Email me a reset link
        </Button>
      </form>
    </AuthCard>
  )
}
