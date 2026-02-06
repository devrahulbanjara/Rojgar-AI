'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-primary" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-white tracking-wide">
              Join 500+ companies hiring smarter
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Ready to transform
            <br />
            your hiring process?
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start using AI that understands your candidates. Get your first job posted in under 5
            minutes.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white hover:bg-background-subtle text-primary text-base font-semibold rounded-xl px-10 py-6 h-auto transition-all duration-300 hover:scale-105 shadow-xl group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70"
          >
            <span>No credit card required</span>
            <span className="hidden sm:inline">•</span>
            <span>14-day free trial</span>
            <span className="hidden sm:inline">•</span>
            <span>Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
