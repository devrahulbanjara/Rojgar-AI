/**
 * Authentication Layout Component
 * Reusable layout for auth pages (login, signup)
 * Updated with new design system
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { LogoLink } from '../common/Logo';
import { ROUTES, ANIMATIONS } from '../../config/constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F9FAFB' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[440px]"
      >
        {/* Logo - Above Card */}
        <div className="flex justify-center mb-10">
          <LogoLink variant="full" size="lg" />
        </div>

        {/* Header - Inside would be part of card, but placing here per spec */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold text-[#0F172A] mb-2 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-[#475569] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Content Card */}
        <div 
          className="bg-white rounded-3xl p-12 max-md:p-8 border border-[#E5E7EB]"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
        >
          {children}
        </div>

        {/* Back to home - Below Card */}
        <div className="text-center mt-6">
          <Link 
            href={ROUTES.HOME} 
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3056F5] hover:text-[#2B3CF5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
