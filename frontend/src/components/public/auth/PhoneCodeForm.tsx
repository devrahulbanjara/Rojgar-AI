'use client'

import { useEffect, useState } from 'react'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import {
  type LoginData,
  useRequestPhoneCodeMutation,
  useVerifyPhoneCodeMutation,
} from '@/store/services/authApi'

import { FormField } from '@/components/app/FormField'
import { AlertIcon } from '@/components/icons'
import { PhoneInput, toE164 } from '@/components/public/jobs/PhoneInput'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const RESEND_SECONDS = 30

/** E.164 for a Nepali mobile we can text (+9779[678]XXXXXXXX), else null. */
function smsNumber(raw: string): string | null {
  const phone = toE164(raw)
  return phone && /^\+9779[678]\d{8}$/.test(phone) ? phone : null
}

/**
 * Sign in or sign up with a mobile number: number → 6-digit SMS code → signed in.
 * The same two steps work for new and returning people.
 */
export function PhoneCodeForm({ onSignedIn }: { onSignedIn: (data: LoginData) => void }) {
  const t = useT()
  const [requestCode, requesting] = useRequestPhoneCodeMutation()
  const [verifyCode, verifying] = useVerifyPhoneCodeMutation()

  const [raw, setRaw] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [formError, setFormError] = useState<string | null>(null)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  async function send(number: string) {
    setFormError(null)
    try {
      await requestCode({ phone: number }).unwrap()
      setPhone(number)
      setWait(RESEND_SECONDS)
    } catch (err) {
      setFormError(parseApiError(err, {}, t.common.error).message)
    }
  }

  async function submitPhone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!raw.trim()) return setError(t.auth.phone.required)
    const number = smsNumber(raw)
    if (!number) return setError(t.auth.phone.invalid)
    await send(number)
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!phone) return
    setFormError(null)
    if (!/^\d{6}$/.test(code)) return setError(t.auth.phone.codeInvalid)
    try {
      const result = await verifyCode({ phone, code }).unwrap()
      if (result.data) onSignedIn(result.data)
    } catch (err) {
      setError(parseApiError(err, {}, t.common.error).message)
    }
  }

  const alert = formError ? (
    <Alert variant="destructive">
      <AlertIcon />
      <AlertDescription>{formError}</AlertDescription>
    </Alert>
  ) : null

  if (!phone) {
    return (
      <form onSubmit={(e) => void submitPhone(e)} noValidate className="flex flex-col gap-5">
        {alert}
        <FormField id="phone" label={t.auth.phone.label} error={error}>
          <PhoneInput
            id="phone"
            value={raw}
            invalid={!!error}
            onChange={(value) => {
              setRaw(value)
              setError(undefined)
            }}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={requesting.isLoading}>
          {t.auth.phone.send}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={(e) => void submitCode(e)} noValidate className="flex flex-col gap-5">
      {alert}
      <p className="text-sm text-foreground">
        {t.auth.phone.sentTo(phone.replace(/^\+977/, ''))}{' '}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 align-baseline"
          onClick={() => {
            setPhone(null)
            setCode('')
            setError(undefined)
          }}
        >
          {t.auth.phone.change}
        </Button>
      </p>
      <FormField id="code" label={t.auth.phone.code} error={error}>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          className="h-12 text-center font-heading text-xl tracking-[0.4em]"
          value={code}
          aria-invalid={!!error}
          aria-describedby={error ? 'code-error' : undefined}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError(undefined)
          }}
        />
      </FormField>
      <Button type="submit" size="lg" className="w-full" loading={verifying.isLoading}>
        {t.auth.phone.verify}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={wait > 0}
        loading={requesting.isLoading}
        onClick={() => void send(phone)}
      >
        {wait > 0 ? t.auth.phone.resendIn(wait) : t.auth.phone.resend}
      </Button>
    </form>
  )
}
