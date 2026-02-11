'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Brain, Users, FileSearch, Zap, Shield, BarChart3 } from 'lucide-react'
import { ROUTES } from '../../config/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const carouselSlides = [
  {
    title: 'AI-Powered Resume Screening',
    description: 'Screen thousands of resumes in minutes with semantic understanding',
    icon: Brain,
    color: 'text-primary',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30',
  },
  {
    title: 'Multi-Agent Collaboration',
    description: 'Specialized AI agents work together to find the perfect candidates',
    icon: Users,
    color: 'text-success',
    bgColor: 'bg-success-100 dark:bg-success-900/30',
  },
  {
    title: 'Semantic Job Matching',
    description: 'Match candidates by skills and experience, not just keywords',
    icon: FileSearch,
    color: 'text-ai',
    bgColor: 'bg-ai-100 dark:bg-ai-900/30',
  },
  {
    title: 'Lightning Fast Results',
    description: 'Get shortlisted candidates in minutes, not days',
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
  },
]

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const CurrentIcon = carouselSlides[currentSlide].icon

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-ai/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-success/5 rounded-full blur-3xl" />
        </div>

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative icons - Issue #23 */}
        <div className="absolute top-[15%] left-[10%] opacity-40">
          <Brain className="w-9 h-9 text-primary" />
        </div>
        <div className="absolute top-[25%] right-[15%] opacity-50">
          <Shield className="w-8 h-8 text-success" />
        </div>
        <div className="absolute bottom-[30%] left-[15%] opacity-40">
          <BarChart3 className="w-9 h-9 text-ai" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-50">
          <FileSearch className="w-9 h-9 text-primary" />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 xl:px-20">
          <div className="w-full max-w-lg">
            {/* Central icon circle - Issue #3 */}
            <motion.div
              className="relative w-32 h-32 mx-auto mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border-2 border-border-default opacity-30" />
              <div className="absolute inset-4 rounded-full border-2 border-border-default opacity-40 bg-background-surface/20" />

              {/* Main circle with icon - Issue #3 */}
              <div className="absolute inset-8 rounded-full bg-background-surface shadow-[0_8px_16px_rgba(0,0,0,0.08)] border border-border-default flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                    transition={{ duration: 0.4 }}
                    className={`w-14 h-14 rounded-lg ${carouselSlides[currentSlide].bgColor} flex items-center justify-center`}
                  >
                    <CurrentIcon className={`w-7 h-7 ${carouselSlides[currentSlide].color}`} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Feature badges - Issue #4, #5 */}
              <motion.div
                className="absolute -top-3 -right-3 bg-background-surface rounded-lg p-2 shadow-lg border border-border-default"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">10x Faster</div>
                    <div className="text-[10px] text-text-tertiary">Screening</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-3 -left-3 bg-background-surface rounded-lg p-2 shadow-lg border border-border-default"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">AI Powered</div>
                    <div className="text-[10px] text-text-tertiary">Intelligence</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Carousel content - Issue #6 */}
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl xl:text-3xl font-display font-bold text-text-primary tracking-tight mb-4">
                    {carouselSlides[currentSlide].title}
                  </h2>
                  <p className="text-sm text-[#6B7280] leading-relaxed max-w-md mx-auto">
                    {carouselSlides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination dots - Issue #7 */}
            <div className="flex items-center justify-center gap-1.5 mt-8">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-[#2563EB]'
                      : 'w-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form - Issue #8, #9 */}
      <div className="w-full flex flex-col min-h-screen bg-background-surface relative">
        {/* Back to home button - Issue #21 */}
        <div className="absolute top-6 left-6">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to home
          </Link>
        </div>

        {/* Form container - Issue #8, #9 */}
        <div className="flex-1 flex items-center justify-center px-12 py-12 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[440px]"
          >
            {/* Logo - Issue #9 */}
            <div className="flex justify-center mb-12">
              <Link href={ROUTES.HOME}>
                <Image
                  src="/logo-light.svg"
                  alt="ConvexHire Logo"
                  width={180}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Heading - Issue #10 */}
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <div>{children}</div>
          </motion.div>
        </div>

        {/* Footer - Issue #22 */}
        <div className="px-12 py-8 border-t border-border-subtle">
          <div className="max-w-[440px] mx-auto flex items-center justify-center gap-6 text-xs text-[#6B7280]">
            <Link href="/privacy" className="hover:text-text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-text-secondary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
