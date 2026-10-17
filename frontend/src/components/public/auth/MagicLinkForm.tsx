'use client'

import { useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { publicApi } from '@/lib/publicApi'

import { FormField } from '@/components/app/FormField'
import { AlertIcon } from '@/components/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { AuthCard } from './AuthCard'
import { CheckEmail } from './CheckEmail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Candidates sign in with an emailed one-time link; no password. */
export function MagicLinkForm() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function send() {
    setSending(true)
    try {
      await publicApi.magicLink(email.trim().toLowerCase())
    } finally {
      setSending(false)
    }
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
      setFormError(err instanceof Error ? err.message : t.common.error)
    }
  }

  if (sent) {
    return (
      <CheckEmail
        email={email.trim()}
        onResend={() => send().catch(() => undefined)}
        resending={sending}
        onChangeEmail={() => setSent(false)}
      />
    )
  }

  return (
    <AuthCard
      title={t.auth.magic.title}
      below={
        <>
          {t.auth.magic.hiring}{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            {t.auth.magic.logInHere}
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
        <FormField id="email" label={t.auth.magic.email} error={error}>
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
        <Button type="submit" size="lg" className="w-full" loading={sending}>
          {t.auth.magic.submit}
        </Button>
      </form>
    </AuthCard>
  )
}
