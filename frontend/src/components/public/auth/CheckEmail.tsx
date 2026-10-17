'use client'

import { useEffect, useState } from 'react'

import { useT } from '@/lib/i18n/client'

import { Button } from '@/components/ui/button'

import { AuthCard } from './AuthCard'

const COOLDOWN_SECONDS = 60

/** "Check {email} for a link" with Resend (cooldown) and Change email. */
export function CheckEmail({
  email,
  title,
  line,
  onResend,
  resending,
  onChangeEmail,
}: {
  email: string
  title?: string
  line?: string
  onResend?: () => void | Promise<void>
  resending?: boolean
  onChangeEmail?: () => void
}) {
  const t = useT()
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  return (
    <AuthCard title={title ?? t.auth.checkEmail}>
      <p className="text-sm text-foreground">
        {line ? (
          <>
            {line}
            <br />
          </>
        ) : null}
        {t.auth.sentLink(email)}
      </p>
      <div className="flex flex-col gap-2">
        {onResend ? (
          <Button
            variant="outline"
            className="w-full"
            loading={resending}
            disabled={cooldown > 0}
            onClick={async () => {
              await onResend()
              setCooldown(COOLDOWN_SECONDS)
            }}
          >
            {cooldown > 0 ? t.auth.resendIn(cooldown) : t.auth.resend}
          </Button>
        ) : null}
        {onChangeEmail ? (
          <Button variant="ghost" className="w-full" onClick={onChangeEmail}>
            {t.auth.changeEmail}
          </Button>
        ) : null}
      </div>
    </AuthCard>
  )
}
