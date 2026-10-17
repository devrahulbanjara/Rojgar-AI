'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { consumePostAuthRedirect } from '@/lib/roleRoutes'
import { useVerifyEmailMutation } from '@/store/services/authApi'

import { Button } from '@/components/ui/button'

import { AuthCard } from './AuthCard'

export function VerifyEmailView() {
  const token = useSearchParams().get('token')
  const [verifyEmail] = useVerifyEmailMutation()
  const [state, setState] = useState<'loading' | 'done' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? '' : 'This link is incomplete.')
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
        setMessage(parseApiError(err, {}, 'This link has expired.').message)
        setState('error')
      })
  }, [token, verifyEmail])

  if (state === 'loading') {
    return (
      <AuthCard title="Verifying…">
        <p className="text-sm text-muted-foreground">One moment.</p>
      </AuthCard>
    )
  }

  if (state === 'error') {
    return (
      <AuthCard title="Link not valid">
        <p className="text-sm text-foreground">{message}</p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Email verified">
      <Button asChild size="lg" className="w-full">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Log in</Link>
      </Button>
    </AuthCard>
  )
}
