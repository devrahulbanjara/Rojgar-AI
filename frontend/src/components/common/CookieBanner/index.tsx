'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'

import gsap from 'gsap'

const STORAGE_KEY = 'cookie-consent'

export default function CookieBanner() {
  const bannerRef = useRef<HTMLDivElement>(null)
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
    const banner = bannerRef.current
    if (!banner) return

    localStorage.setItem(STORAGE_KEY, choice)

    gsap.to(banner, {
      y: '120%',
      opacity: 0,
      duration: 0.38,
      ease: 'power3.in',
      onComplete: () => setVisible(false),
    })
  }

  if (!visible) return null

  return (
    <div
      ref={bannerRef}
      className="cookie-banner"
      aria-live="polite"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="cookie-banner__inner">
        {/* Icon */}
        <span className="cookie-banner__icon" aria-hidden="true">
          🍪
        </span>

        {/* Text */}
        <div className="cookie-banner__content">
          <p className="cookie-banner__title">We use cookies</p>
          <p className="cookie-banner__desc">
            We use cookies to improve your experience, analyse traffic, and personalise content. You
            can choose to accept or decline.{' '}
            <Link href="/privacy" className="cookie-banner__link">
              Learn more
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="cookie-banner__actions">
          <button
            className="btn cookie-banner__btn cookie-banner__btn--reject"
            onClick={() => dismiss('rejected')}
          >
            Decline
          </button>
          <button
            className="btn btn--primary cookie-banner__btn cookie-banner__btn--accept"
            onClick={() => dismiss('accepted')}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
