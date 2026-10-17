'use client'

import { useEffect } from 'react'

import { usePathname } from 'next/navigation'

import gsap from 'gsap'
import Lenis from 'lenis'

import { isAppPath } from '@/components/app/SiteLayout'

/**
 * LenisProvider
 *
 * Initialises Lenis smooth-scroll and ties it to GSAP's ticker so both
 * libraries stay in sync. Skipped for users who prefer reduced motion and on
 * the app dashboards (dense, scroll-heavy work screens). Cleans up on unmount.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = isAppPath(pathname)

  useEffect(() => {
    if (isDashboard) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      prevent: (node) =>
        node instanceof HTMLElement && node.closest('[data-lenis-prevent]') !== null,
    })

    // Keep a reference: ticker.remove needs the same function that was added,
    // otherwise the callback leaks and keeps driving a destroyed instance.
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)

    // Disable GSAP's built-in lag smoothing so Lenis controls the frame
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [isDashboard])

  return <>{children}</>
}
