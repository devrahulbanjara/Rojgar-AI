'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useResetPasswordMutation } from '@/store/services/authApi'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { PasswordRules, passwordMeetsRules } from '@/components/app/PasswordRules'
import { AlertIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { AuthCard } from './AuthCard'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(
    token ? null : 'This link is incomplete. Ask for a new one.',
  )
  const [done, setDone] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!passwordMeetsRules(password)) {
      setError('Use a stronger password.')
      return
    }
    try {
      await resetPassword({ token, new_password: password }).unwrap()
      setDone(true)
      setTimeout(() => router.push('/login'), 1500)
    } catch (err) {
      const parsed = parseApiError(err, { new_password: 'password', token: 'token' })
      if (parsed.fieldErrors.password) setError(parsed.fieldErrors.password)
      else setFormError(parsed.fieldErrors.token ? 'This link has expired. Ask for a new one.' : parsed.message)
    }
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Log in</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Get a new link
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
        <FormField id="password" label="New password" error={error}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-10"
            value={password}
            disabled={!token}
            aria-invalid={!!error}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(undefined)
            }}
          />
          <PasswordRules value={password} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={isLoading} disabled={!token}>
          Save password
        </Button>
      </form>
    </AuthCard>
  )
}
