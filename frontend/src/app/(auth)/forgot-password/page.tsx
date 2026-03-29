'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Image from 'next/image'
import Link from 'next/link'

import { parseApiError } from '@/lib/apiError'
import { useForgotPasswordMutation } from '@/store/services/authApi'

import ButtonSpinner from '@/components/common/ButtonSpinner'

// ── Validation ─────────────────────────────────────────────────────────────

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email address is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  return undefined
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) {
      setEmailError(err)
      return
    }
    try {
      const result = await forgotPassword({ email }).unwrap()
      if (result.success) {
        setSent(true)
      } else {
        toast.error(result.message ?? 'Failed to send reset link. Please try again.')
      }
    } catch (err: unknown) {
      const { message } = parseApiError(
        err,
        { email: 'email' },
        'Failed to send reset link. Please try again.',
      )
      toast.error(message)
    }
  }

  return (
    <main className="auth">
      {/* Background decorations */}
      <Image
        src="/bg/bg-ui-v3.svg"
        alt=""
        width={700}
        height={700}
        className="auth__bg-top"
        aria-hidden="true"
        priority={false}
      />
      <Image
        src="/bg/bg-ui-v5.svg"
        alt=""
        width={650}
        height={650}
        className="auth__bg-bottom"
        aria-hidden="true"
        priority={false}
      />

      <div className="auth__inner">
        {/* Header */}
        <header className="auth__header">
          <span className="auth__label">{sent ? 'Check your email' : 'Forgot password'}</span>
          <h1 className="auth__title">{sent ? 'Reset link sent!' : 'Reset your password'}</h1>
          <p className="auth__subtitle">
            {sent
              ? `We've sent a password reset link to ${email}. Click the link in the email to choose a new password. It expires in 1 hour.`
              : "Enter your account email and we'll send you a reset link."}
          </p>
        </header>

        {/* Card */}
        <div className="auth__card">
          {sent ? (
            /* ── Success state ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <p className="auth__subtitle" style={{ color: 'var(--color-muted)' }}>
                Didn&apos;t receive it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary, #e11d48)',
                    textDecoration: 'underline',
                    font: 'inherit',
                    padding: 0,
                  }}
                >
                  try a different email
                </button>
                .
              </p>
            </div>
          ) : (
            /* ── Email form ── */
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              <div className="auth__field">
                <label htmlFor="fp-email" className="auth__label">
                  Email address
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="fp-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(undefined)
                    }}
                    disabled={isLoading}
                    className={`auth__input${emailError ? ' auth__input--error' : ''}`}
                    aria-describedby={emailError ? 'fp-email-error' : undefined}
                  />
                </div>
                {emailError && (
                  <span id="fp-email-error" className="auth__error-msg" role="alert">
                    {emailError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`auth__submit${isLoading ? ' auth__submit--loading' : ''}`}
                aria-busy={isLoading}
              >
                {isLoading ? <ButtonSpinner label="Sending link..." /> : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="auth__switch">
          Remembered your password? <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  )
}
