'use client'

import { motion } from 'framer-motion'
import { Brain, Star, TrendingUp, Users, Zap, Shield, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'

export function BrandSection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div className="text-left">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary tracking-tightest mb-8 leading-tight">
              Hiring is broken.
              <br />
              <span className="text-primary">We're fixing it.</span>
            </h2>

            <p className="text-lg sm:text-xl text-text-secondary mb-12 max-w-lg leading-relaxed font-sans">
              Traditional ATS systems reject qualified candidates over keywords. We actually read the resumes.
            </p>

            {/* Stats - Simple list, no fancy grids */}
            <div className="flex flex-col gap-8 mb-12">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl sm:text-5xl font-display font-bold text-text-primary">10x</span>
                <span className="text-lg text-text-secondary font-sans">Faster (really)</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl sm:text-5xl font-display font-bold text-text-primary">94%</span>
                <span className="text-lg text-text-secondary font-sans">Match accuracy</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl sm:text-5xl font-display font-bold text-text-primary">3min</span>
                <span className="text-lg text-text-secondary font-sans">Setup we timed it</span>
              </div>
            </div>

            <Link href="/signup">
              <Button size="lg" className="group">
                See it in action
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right: Visuals - Floating Cards, Uncluttered */}
          <div className="relative h-[500px] w-full hidden lg:block">
            {/* Match Score Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute top-10 right-10 bg-background-surface border border-border p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow w-64 rotate-3"
            >
              <div className="text-sm font-sans font-semibold uppercase tracking-wide mb-2 text-text-tertiary">Match Score</div>
              <div className="text-5xl font-display font-bold text-success mb-1">95%</div>
              <div className="text-sm font-sans font-medium text-text-secondary">accuracy</div>
            </motion.div>

            {/* Screened Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-40 left-10 bg-background-surface border border-border p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow w-56 -rotate-2"
            >
              <div className="text-sm font-sans font-semibold uppercase tracking-wide mb-2 text-text-tertiary">Screened</div>
              <div className="text-4xl font-display font-bold text-primary mb-1">+847</div>
              <div className="flex -space-x-2 mt-3">
                <div className="w-8 h-8 rounded-full bg-background-muted border-2 border-background-surface"></div>
                <div className="w-8 h-8 rounded-full bg-background-subtle border-2 border-background-surface"></div>
                <div className="w-8 h-8 rounded-full bg-text-tertiary border-2 border-background-surface"></div>
              </div>
            </motion.div>

            {/* AI Analysis Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute bottom-10 right-20 bg-background-surface border border-border p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow w-72 rotate-1"
            >
              <div className="text-sm font-sans font-semibold uppercase tracking-wide mb-4 text-text-tertiary">AI Analysis</div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-sans font-semibold mb-2 text-text-secondary">SKILLS</div>
                  <div className="w-full bg-background-muted rounded-full h-2">
                    <div className="bg-success rounded-full h-full w-[90%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-sans font-semibold mb-2 text-text-secondary">EXPERIENCE</div>
                  <div className="w-full bg-background-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-full w-[75%]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
