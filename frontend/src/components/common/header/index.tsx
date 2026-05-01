'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import gsap from 'gsap'

const NAV_LINKS = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
]

export default function Header() {
  const headerRef = useRef<HTMLElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ── Entrance: CSS animation handles first-load slide-down.
  //    For returning visitors this session, skip the animation immediately.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const STORAGE_KEY = 'ch_header_animated'
    if (sessionStorage.getItem(STORAGE_KEY)) {
      header.classList.add('header--entered')
    } else {
      sessionStorage.setItem(STORAGE_KEY, '1')
    }
  }, [])

  // ── Scroll: floating pill → full-width sticky ──────────────
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const tl = gsap.timeline({ paused: true }).to(header, {
      top: 0,
      duration: 0.45,
      ease: 'power2.out',
    })

    const onScroll = () => {
      const past = window.scrollY > 80
      if (past) {
        tl.play()
        header.classList.add('header--scrolled')
      } else {
        tl.reverse()
        header.classList.remove('header--scrolled')
      }
    }

    // Initialise immediately in case browser restores scroll position
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Drawer: initialise off-screen ─────────────────────────
  useEffect(() => {
    if (drawerRef.current) {
      gsap.set(drawerRef.current, { x: '100%' })
    }
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0, display: 'none' })
    }
  }, [])

  // ── Drawer: open / close ──────────────────────────────────
  const openMenu = () => {
    setIsMenuOpen(true)
    document.body.style.overflow = 'hidden'

    const drawer = drawerRef.current
    const overlay = overlayRef.current
    if (!drawer || !overlay) return

    gsap.set(overlay, { display: 'block' })
    gsap.to(overlay, { opacity: 1, duration: 0.3, ease: 'none' })
    gsap.to(drawer, {
      x: '0%',
      duration: 0.42,
      ease: 'power3.out',
      overwrite: true,
    })

    // Stagger nav items in
    gsap.fromTo(
      drawer.querySelectorAll('.header__drawer-nav-item'),
      { x: 24, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.35,
        stagger: 0.07,
        ease: 'power2.out',
        delay: 0.18,
      },
    )
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    document.body.style.overflow = ''

    const drawer = drawerRef.current
    const overlay = overlayRef.current
    if (!drawer || !overlay) return

    gsap.to(drawer, {
      x: '100%',
      duration: 0.36,
      ease: 'power3.in',
      overwrite: true,
    })
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'none',
      onComplete: () => {
        gsap.set(overlay, { display: 'none' })
      },
    })
  }

  return (
    <>
      <nav className="header" ref={headerRef}>
        <div className="container header__inner">
          {/* Logo */}
          <Link href="/" className="header__logo">
            <Image
              src="/logo/logo.png"
              alt="ConvexHire Logo"
              width={120}
              height={26}
              className="header__logo-image"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="header__nav" aria-label="Main navigation">
            <ul className="header__nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="header__nav-item">
                  <Link href={link.href} className="header__nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Actions */}
          <div className="header__actions">
            <Link href="/login" className="btn btn--secondary">
              Login
            </Link>
            <Link href="/signup" className="btn btn--primary">
              Sign Up
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="btn btn--icon header__hamburger"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={isMenuOpen ? closeMenu : openMenu}
          >
            <span className={`hamburger${isMenuOpen ? ' hamburger--open' : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      <div ref={overlayRef} className="header__overlay" onClick={closeMenu} aria-hidden="true" />

      {/* Mobile Drawer */}
      <div ref={drawerRef} className="header__drawer" aria-hidden={!isMenuOpen}>
        {/* Drawer top */}
        <div className="header__drawer-top">
          <Link href="/" className="header__drawer-logo" onClick={closeMenu}>
            <Image src="/logo/logo.png" alt="ConvexHire Logo" width={110} height={24} />
          </Link>
          <button className="btn btn--icon" onClick={closeMenu} aria-label="Close menu">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="header__drawer-nav" aria-label="Mobile navigation">
          <ul className="header__drawer-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="header__drawer-nav-item">
                <Link href={link.href} className="header__drawer-nav-link" onClick={closeMenu}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer actions */}
        <div className="header__drawer-actions">
          <Link href="/login" className="btn btn--secondary" onClick={closeMenu}>
            Login
          </Link>
          <Link href="/signup" className="btn btn--primary" onClick={closeMenu}>
            Sign Up
          </Link>
        </div>
      </div>
    </>
  )
}
