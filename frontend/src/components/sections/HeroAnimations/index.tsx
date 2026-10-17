'use client'

import { useEffect } from 'react'

import gsap from 'gsap'

/**
 * Handles entrance animations for the hero section background images.
 * Renders nothing - purely behavioural.
 */
export default function HeroAnimations() {
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    // bg-ui.webp - slides in from the left
    tl.fromTo(
      '.homepage__bg-top',
      { x: '-60vw', opacity: 0 },
      { x: '0%', opacity: 1, duration: 1.1, delay: 0.15 },
      0,
    )
      // bg-ui-v2.webp - slides in from the right
      .fromTo(
        '.homepage__bg-bottom',
        { x: '60vw', opacity: 0 },
        { x: '0%', opacity: 1, duration: 1.1, delay: 0.15 },
        0,
      )
  }, [])

  return null
}
