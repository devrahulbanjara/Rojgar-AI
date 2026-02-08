'use client'

import { motion } from 'framer-motion'
import { Linkedin, Instagram } from 'lucide-react'
import { LogoLink } from '../common/Logo'
import Link from 'next/link'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'For Recruiters', href: '#platform' },
    { label: 'For Candidates', href: '#candidates' },
    { label: 'Pricing', href: '#pricing' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

const socialLinks = [
  {
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/convexhire/about/?viewAsMember=true',
    label: 'LinkedIn',
  },
  { icon: Instagram, href: 'https://www.instagram.com/convexhire', label: 'Instagram' },
]

export function LandingFooter() {
  return (
    <footer className="bg-background-subtle border-t border-border-default">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          { }
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-2 lg:col-span-2"
          >
            <LogoLink variant="full" size="md" className="mb-4" />
            <p className="text-text-secondary text-sm mb-6 max-w-xs leading-relaxed">
              We built this because we were tired of losing good candidates to bad processes.
              <br /><br />
              No more generic job descriptions.
              <br />
              No more keyword matching.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-background-surface border border-border-default flex items-center justify-center text-text-tertiary hover:text-primary hover:border-primary-200 hover:bg-primary-50 transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          { }
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-sm font-display font-semibold text-text-primary tracking-tight mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          { }
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-sm font-display font-semibold text-text-primary tracking-tight mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          { }
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-sm font-display font-semibold text-text-primary tracking-tight mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar with personality */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border-default"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-tertiary">
              © {new Date().getFullYear()} ConvexHire · Nepal · Still in active development
            </p>
            <p className="text-sm text-text-tertiary">
              Made by people who have actually seen a gap in this industry.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
