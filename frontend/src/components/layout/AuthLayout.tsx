/**
 * Authentication Layout Component
 * Reusable layout for auth pages (login, signup)
 * Updated with new design system
 */

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { LogoLink } from '../common/Logo'
import { ROUTES } from '../../config/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 lg:px-8 py-6 sm:py-8 bg-background-subtle">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[440px] sm:max-w-[480px]"
      >
        {/* Logo - Above Card */}
        <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
          <LogoLink variant="full" size="lg" />
        </div>

        {/* Header - Inside would be part of card, but placing here per spec */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-text-primary mb-2 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{subtitle}</p>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-background-surface rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-border-default shadow-lg">
          {children}
        </div>

        {/* Back to home - Below Card */}
        <div className="text-center mt-4 sm:mt-6">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
