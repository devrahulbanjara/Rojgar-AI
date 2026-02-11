'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Container from './Container'
import Button from './Button'
import { NavigationContent } from '../../../content/landing-page'

interface NavigationProps {
  content: NavigationContent
}

export default function Navigation({ content }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  return (
    <nav
      className="sticky top-0 bg-[var(--color-white)] border-b border-[var(--color-gray-200)] py-4 z-[1020]"
      role="banner"
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={content.logo.src}
              alt={content.logo.alt}
              width={180}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {content.links.map(link => (
              <button
                key={link.text}
                onClick={() => handleLinkClick(link.href)}
                className="text-base font-medium text-[var(--color-gray-900)] hover:text-[var(--color-primary-purple)] transition-colors duration-200 cursor-pointer bg-transparent border-none"
              >
                {link.text}
              </button>
            ))}
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="secondary" size="medium" href={content.cta.signIn.href}>
              {content.cta.signIn.text}
            </Button>
            <Button variant="primary" size="medium" href={content.cta.demo.href}>
              {content.cta.demo.text}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2 bg-transparent border-none cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-[var(--color-primary-black)] transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 bg-[var(--color-primary-black)] transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 bg-[var(--color-primary-black)] transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed top-0 right-0 w-[280px] h-screen bg-[var(--color-white)] shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: 1030 }}
        >
          <div className="flex flex-col gap-4 p-16 pt-24">
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 p-2 bg-transparent border-none cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile menu"
            >
              <span className="block w-6 h-0.5 bg-[var(--color-primary-black)] rotate-45 translate-y-0.5" />
              <span className="block w-6 h-0.5 bg-[var(--color-primary-black)] -rotate-45 -translate-y-0.5" />
            </button>

            {content.links.map(link => (
              <button
                key={link.text}
                onClick={() => handleLinkClick(link.href)}
                className="text-base font-medium text-[var(--color-gray-900)] hover:text-[var(--color-primary-purple)] transition-colors duration-200 text-left bg-transparent border-none cursor-pointer"
              >
                {link.text}
              </button>
            ))}

            <div className="flex flex-col gap-4 mt-6">
              <Button variant="secondary" size="medium" href={content.cta.signIn.href}>
                {content.cta.signIn.text}
              </Button>
              <Button variant="primary" size="medium" href={content.cta.demo.href}>
                {content.cta.demo.text}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[1025]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </Container>
    </nav>
  )
}
