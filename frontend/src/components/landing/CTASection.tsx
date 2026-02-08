'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden">
      {}
      <div className="absolute inset-0 bg-gradient-primary" />

      {}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      {}
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
          className="text-left lg:text-center"
        >
          {/* Opinionated headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tightest mb-6">
            Stop rejecting
            <br />
            good candidates.
          </h2>

          {/* Specific subheadline */}
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed font-sans">
            Your next great hire is probably in your reject pile right now. Let's fix that.
          </p>

          {/* CTA with specific text */}
          <div className="flex justify-start lg:justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-background-surface hover:bg-background-subtle text-primary text-base font-semibold rounded-xl px-10 py-6 h-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl group"
              >
                Show me the demo
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {}
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
