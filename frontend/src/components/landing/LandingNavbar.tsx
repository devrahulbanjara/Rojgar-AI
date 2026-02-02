'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { LogoLink } from '../common/Logo'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm' : 'bg-white/60 backdrop-blur-xl'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <LogoLink variant="full" size="sm" className="sm:hidden" />
              <LogoLink variant="full" size="md" className="hidden sm:block" />
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              className="hidden xl:flex items-center gap-6 lg:gap-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <a
                href="#platform"
                className="text-sm font-medium text-[#475569] hover:text-brand-blue transition-colors"
              >
                Platform
              </a>
              <a
                href="#candidates"
                className="text-sm font-medium text-[#475569] hover:text-brand-blue transition-colors"
              >
                Candidates
              </a>
              <a
                href="#insights"
                className="text-sm font-medium text-[#475569] hover:text-brand-blue transition-colors hidden md:block"
              >
                Insights
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-[#475569] hover:text-brand-blue transition-colors"
              >
                Pricing
              </a>
            </motion.div>

            {/* Desktop CTA Buttons */}
            <motion.div
              className="hidden xl:flex items-center gap-3 lg:gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-[#475569] hover:text-brand-blue px-4"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-brand-blue hover:bg-[#2B3CF5] text-white text-sm font-medium rounded-xl px-4 lg:px-6 transition-all duration-200 hover:scale-105">
                  Start Free
                </Button>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={toggleMobileMenu}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[#475569]" />
              ) : (
                <Menu className="h-5 w-5 text-[#475569]" />
              )}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 xl:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <LogoLink variant="full" size="sm" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-[#475569]" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="px-6 py-8">
                  <div className="flex flex-col space-y-6">
                    <a
                      href="#platform"
                      className="text-lg font-medium text-[#475569] hover:text-brand-blue transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Platform
                    </a>
                    <a
                      href="#candidates"
                      className="text-lg font-medium text-[#475569] hover:text-brand-blue transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Candidates
                    </a>
                    <a
                      href="#pricing"
                      className="text-lg font-medium text-[#475569] hover:text-brand-blue transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </a>

                    {/* CTA Buttons - moved here after pricing */}
                    <div className="pt-6 space-y-3">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full text-base font-medium text-[#475569] hover:text-brand-blue justify-start py-3"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-brand-blue hover:bg-[#2B3CF5] text-white text-base font-medium rounded-xl py-3 transition-all duration-200">
                          Start Free
                        </Button>
                      </Link>
                    </div>
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
