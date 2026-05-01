'use client'

import { useEffect } from 'react'

import gsap from 'gsap'
import Lenis from 'lenis'

/**
 * LenisProvider
 *
 * Initialises Lenis smooth-scroll once on mount and ties it to GSAP's
 * ticker so both libraries stay perfectly in sync.
 * Cleans up on unmount (SPA navigation, HMR).
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      prevent: (node) =>
        node instanceof HTMLElement && node.closest('[data-lenis-prevent]') !== null,
    })

    // Sync Lenis with GSAP ticker for consistent 60/120 fps behaviour
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    // Disable GSAP's built-in lag smoothing so Lenis controls the frame
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000)
      })
    }
  }, [])

  return <>{children}</>
}
