'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { LogoLink } from '../common/Logo'
import { useEffect, useState } from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#platform', label: 'For Recruiters' },
  { href: '#candidates', label: 'For Candidates' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background-surface/80 backdrop-blur-xl shadow-sm border-b border-border-subtle'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <LogoLink variant="full" size="md" />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-xl hover:bg-background-subtle"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary px-4"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="btn-primary-gradient text-sm font-medium rounded-xl px-5 py-2.5 h-auto transition-all duration-200 hover:scale-105 shadow-sm group">
                  Get Started
                  <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-background-subtle transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-text-secondary" />
              ) : (
                <Menu className="h-5 w-5 text-text-secondary" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background-surface shadow-2xl z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                  <LogoLink variant="full" size="sm" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-background-subtle transition-colors"
                  >
                    <X className="h-5 w-5 text-text-secondary" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-6 py-8 overflow-y-auto">
                  <div className="space-y-1">
                    {navLinks.map(link => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-3 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-8 space-y-3">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button
                        variant="outline"
                        className="w-full text-base font-medium rounded-xl py-3 h-auto"
                      >
                        Log in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button className="w-full btn-primary-gradient text-base font-medium rounded-xl py-3 h-auto">
                        Get Started Free
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
