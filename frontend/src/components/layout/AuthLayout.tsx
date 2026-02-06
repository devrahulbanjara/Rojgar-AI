'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Brain, Users, FileSearch, Zap, Shield, BarChart3 } from 'lucide-react'
import { LogoLink } from '../common/Logo'
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-background-subtle relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-ai/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-success/5 rounded-full blur-3xl" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 xl:px-20">
          <div className="absolute top-[15%] left-[10%] opacity-20">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute top-[25%] right-[15%] opacity-15">
            <Shield className="w-6 h-6 text-success" />
          </div>
          <div className="absolute bottom-[30%] left-[15%] opacity-20">
            <BarChart3 className="w-7 h-7 text-ai" />
          </div>
          <div className="absolute bottom-[20%] right-[10%] opacity-15">
            <FileSearch className="w-8 h-8 text-primary" />
          </div>

          <div className="w-full max-w-lg">
            <motion.div
              className="relative w-64 h-64 mx-auto mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-border-default opacity-30" />

              <div className="absolute inset-8 rounded-full border-2 border-border-default opacity-40 bg-background-surface/20" />

              <div className="absolute inset-16 rounded-full bg-background-surface shadow-xl border border-border-default flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                    transition={{ duration: 0.4 }}
                    className={`w-16 h-16 rounded-2xl ${carouselSlides[currentSlide].bgColor} flex items-center justify-center`}
                  >
                    <CurrentIcon className={`w-8 h-8 ${carouselSlides[currentSlide].color}`} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.div
                className="absolute -top-4 -right-4 bg-background-surface rounded-xl p-3 shadow-lg border border-border-default"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">10x Faster</div>
                    <div className="text-[10px] text-text-tertiary">Screening</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-background-surface rounded-xl p-3 shadow-lg border border-border-default"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">AI Powered</div>
                    <div className="text-[10px] text-text-tertiary">Intelligence</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl xl:text-3xl font-display font-bold text-text-primary tracking-tight mb-3">
                    {carouselSlides[currentSlide].title}
                  </h2>
                  <p className="text-text-secondary leading-relaxed max-w-md mx-auto">
                    {carouselSlides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2 mt-8">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-border-strong hover:bg-text-muted'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col min-h-screen bg-background-surface">
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[400px]"
          >
            <div className="flex justify-center mb-8">
              <LogoLink variant="full" size="lg" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-tight mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <div>{children}</div>
          </motion.div>
        </div>

        <div className="px-6 sm:px-12 lg:px-16 xl:px-20 py-6 border-t border-border-subtle">
          <div className="max-w-[400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-700 transition-colors"
            >
              Back to home
              <ArrowRight className="h-3 w-3" />
            </Link>
            <div className="flex items-center gap-4">
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
    </div>
  )
}
