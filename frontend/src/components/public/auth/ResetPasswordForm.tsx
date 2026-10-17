'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { useResetPasswordMutation } from '@/store/services/authApi'

import { FormField } from '@/components/app/FormField'
import { PasswordInput } from '@/components/app/PasswordInput'
import { PasswordRules, passwordMeetsRules } from '@/components/app/PasswordRules'
import { AlertIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { AuthCard } from './AuthCard'

export function ResetPasswordForm() {
  const t = useT()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(
    token ? null : t.auth.reset.incomplete,
  )
  const [done, setDone] = useState(false)
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!passwordMeetsRules(password)) {
      setError(t.auth.weakPassword)
      return
    }
    try {
      await resetPassword({ token, new_password: password }).unwrap()
      setDone(true)
      setTimeout(() => router.push('/login'), 1500)
    } catch (err) {
      const parsed = parseApiError(err, { new_password: 'password', token: 'token' })
      if (parsed.fieldErrors.password) setError(parsed.fieldErrors.password)
      else setFormError(parsed.fieldErrors.token ? t.auth.reset.expired : parsed.message)
    }
  }

  if (done) {
    return (
      <AuthCard title={t.auth.reset.done}>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">{t.auth.login.submit}</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={t.auth.reset.title}
      footer={
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          {t.auth.reset.newLink}
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
        <FormField id="password" label={t.auth.reset.newPassword} error={error}>
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
          {t.auth.reset.submit}
        </Button>
      </form>
    </AuthCard>
  )
}
