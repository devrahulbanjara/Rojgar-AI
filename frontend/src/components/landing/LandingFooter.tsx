'use client';

import { motion } from 'framer-motion';
import { Linkedin, Twitter, Github } from 'lucide-react';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="py-20 px-6 bg-white border-t border-[#E5E7EB]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Copyright */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-[#0F172A] tracking-tight">
                ConvexHire
              </span>
            </Link>
            <p className="text-sm text-[#94A3B8]">
              © 2025 ConvexHire. All rights reserved.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center gap-8"
          >
            <Link
              href="/privacy"
              className="text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-[#94A3B8] hover:text-brand-blue transition-colors"
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
            className="flex items-center gap-4"
          >
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Linkedin className="h-5 w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Twitter className="h-5 w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center hover:bg-brand-blue group transition-colors duration-200"
            >
              <Github className="h-5 w-5 text-[#475569] group-hover:text-white transition-colors duration-200" />
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

