'use client';

import { motion } from 'framer-motion';
import { Linkedin, Twitter, Github } from 'lucide-react';
import { LogoLink } from '../common/Logo';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 lg:px-8 bg-white border-t border-[#E5E7EB]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Logo & Copyright */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="mb-3 sm:mb-4">
              <LogoLink variant="full" size="sm" className="sm:hidden" />
              <LogoLink variant="full" size="md" className="hidden sm:block" />
            </div>
            <p className="text-xs sm:text-sm text-[#94A3B8]">
              © 2025 ConvexHire. All rights reserved.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
          >
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-xs sm:text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
            >
              Contact
            </Link>
          </motion.div>

          {/* Social Icons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 sm:gap-4"
          >
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Github className="h-4 w-4 sm:h-5 sm:w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

