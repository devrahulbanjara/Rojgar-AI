'use client'

import { Suspense, useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { useVerifyEmailMutation } from '@/store/services/authApi'
import { CheckCircle, XCircle } from 'lucide-react'

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return <CheckCircle size={56} aria-hidden="true" />
}

function XCircleIcon() {
  return <XCircle size={56} aria-hidden="true" />
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={56}
      height={56}
      aria-hidden="true"
      className="auth__spinner-icon"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Inner component (uses useSearchParams) ─────────────────────────────────

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [verifyEmail] = useVerifyEmailMutation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>(
    'The verification link is invalid or has already been used.',
  )

  // Guard against React StrictMode double-invoke in dev
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage('No verification token found. Please use the link sent to your email.')

      setStatus('error')
      return
    }

    verifyEmail({ token })
      .unwrap()
      .then(() => {
        setStatus('success')
      })
      .catch((err: unknown) => {
        const { message } = parseApiError(
          err,
          {},
          'The verification link is invalid or has already been used.',
        )
        setErrorMessage(message)
        setStatus('error')
      })
  }, [token, verifyEmail])

  return (
    <div className="auth__inner">
      <div className="auth__card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="auth__status-icon auth__status-icon--loading" aria-label="Verifying">
              <SpinnerIcon />
            </div>
            <h1 className="auth__title" style={{ marginTop: '1.25rem' }}>
              Verifying your email…
            </h1>
            <p className="auth__subtitle">Please wait while we confirm your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="auth__status-icon auth__status-icon--success" aria-label="Success">
              <CheckCircleIcon />
            </div>
            <h1 className="auth__title" style={{ marginTop: '1.25rem' }}>
              Email verified!
            </h1>
            <p className="auth__subtitle">
              Your account is now active. You can sign in and start using Rojgar AI.
            </p>
            <Link href="/login" className="btn btn--ghost btn--sm" style={{ marginTop: '1.5rem' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth__status-icon auth__status-icon--error" aria-label="Error">
              <XCircleIcon />
            </div>
            <h1 className="auth__title" style={{ marginTop: '1.25rem' }}>
              Verification failed
            </h1>
            <p className="auth__subtitle">{errorMessage}</p>
            <Link href="/signup" className="btn btn--ghost btn--sm" style={{ marginTop: '1.5rem' }}>
              Back to Sign Up
            </Link>
          </>
        )}
      </div>

      <p className="auth__switch">
        Need help? <a href="mailto:support@rojgarai.app">Contact support</a>
      </p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VerifyEmailPage() {
  return (
    <main className="auth">
      <Image
        src="/bg/bg-ui-v3.webp"
        alt=""
        width={700}
        height={700}
        className="auth__bg-top"
        aria-hidden="true"
        priority={false}
      />
      <Image
        src="/bg/bg-ui-v5.webp"
        alt=""
        width={650}
        height={650}
        className="auth__bg-bottom"
        aria-hidden="true"
        priority={false}
      />

      <Suspense
        fallback={
          <div className="auth__inner">
            <div className="auth__card" style={{ textAlign: 'center' }}>
              <p className="auth__subtitle">Loading…</p>
            </div>
          </div>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </main>
  )
}
