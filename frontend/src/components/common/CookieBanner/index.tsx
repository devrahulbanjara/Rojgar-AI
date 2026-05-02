'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import gsap from 'gsap'

const STORAGE_KEY = 'cookie-consent'

export default function CookieBanner() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  // ── On mount: check stored preference ─────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
    }
  }, [])

  const dismiss = (choice: 'accepted' | 'rejected') => {
    const card = cardRef.current
    if (!card) return

    localStorage.setItem(STORAGE_KEY, choice)

    gsap.to(card, {
      y: 12,
      opacity: 0,
      duration: 0.24,
      ease: 'power3.in',
      onComplete: () => setVisible(false),
    })
  }

  if (!visible) return null

  return (
    <div
      ref={cardRef}
      className="cookie-banner"
      aria-live="polite"
      role="dialog"
      aria-label="Cookie preferences"
    >
      {/* Close button */}
      <button
        className="btn btn--icon btn--sm cookie-banner__close"
        onClick={() => dismiss('rejected')}
        aria-label="Close"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Title */}
      <h2 className="cookie-banner__title">Cookie preferences</h2>

      {/* Description */}
      <p className="cookie-banner__desc">
        We use cookies to improve your experience and analyse site traffic.{' '}
        <Link href="/privacy" className="cookie-banner__link">
          Privacy policy
        </Link>
      </p>

      {/* Actions */}
      <div className="cookie-banner__actions">
        <button className="btn btn--secondary btn--sm" onClick={() => dismiss('rejected')}>
          Decline
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => dismiss('accepted')}>
          Accept all
        </button>
      </div>
    </div>
  )
}
