'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { LogoLink } from '../common/Logo';
import { useEffect, useState } from 'react';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm'
          : 'bg-white/60 backdrop-blur-xl'
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LogoLink variant="full" size="md" />
          </motion.div>

          <motion.div
            className="hidden md:flex items-center gap-8"
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
              className="text-sm font-medium text-[#475569] hover:text-brand-blue transition-colors"
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

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-sm font-medium text-[#475569] hover:text-brand-blue"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                className="bg-brand-blue hover:bg-[#2B3CF5] text-white text-sm font-medium rounded-xl px-6 transition-all duration-200 hover:scale-105"
              >
                Start Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </nav>
  );
}

