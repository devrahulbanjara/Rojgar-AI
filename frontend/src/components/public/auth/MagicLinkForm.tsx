'use client'

import { useState } from 'react'

import Link from 'next/link'

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
      setError('Enter a valid email.')
      return
    }
    try {
      await send()
      setSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
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
      title="See your applications"
      below={
        <>
          Hiring?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in here
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
        <FormField id="email" label="Email you applied with" error={error}>
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
          Email me a sign-in link
        </Button>
      </form>
    </AuthCard>
  )
}
