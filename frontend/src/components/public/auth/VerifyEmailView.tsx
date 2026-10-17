'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useT } from '@/lib/i18n/client'
import { consumePostAuthRedirect } from '@/lib/roleRoutes'
import { useVerifyEmailMutation } from '@/store/services/authApi'

import { Button } from '@/components/ui/button'

import { AuthCard } from './AuthCard'

export function VerifyEmailView() {
  const t = useT()
  const token = useSearchParams().get('token')
  const [verifyEmail] = useVerifyEmailMutation()
  const [state, setState] = useState<'loading' | 'done' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : t.auth.verify.incomplete)
  const called = useRef(false)
  // Read once: consuming the stored destination is a side effect.
  const [next] = useState(() => (typeof window === 'undefined' ? null : consumePostAuthRedirect()))

  useEffect(() => {
    if (!token || called.current) return
    called.current = true
    verifyEmail({ token })
      .unwrap()
      .then(() => setState('done'))
      .catch((err) => {
        setMessage(parseApiError(err, {}, t.auth.verify.expired).message)
        setState('error')
      })
  }, [token, verifyEmail, t])

  if (state === 'loading') {
    return (
      <AuthCard title={t.auth.verify.checking}>
        <p className="text-sm text-muted-foreground">{t.auth.verify.moment}</p>
      </AuthCard>
    )
  }

  if (state === 'error') {
    return (
      <AuthCard title={t.auth.verify.invalid}>
        <p className="text-sm text-foreground">{message}</p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">{t.auth.backToLogin}</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t.auth.verify.done}>
      <Button asChild size="lg" className="w-full">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>{t.auth.login.submit}</Link>
      </Button>
    </AuthCard>
  )
}
