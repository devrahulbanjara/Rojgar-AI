'use client'

import { motion } from 'framer-motion'
import { Megaphone, Brain, Star, TrendingUp, Users, Zap, Shield, ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'

export function BrandSection() {
  return (
    <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden bg-gradient-primary">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-[10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-[5%] w-80 h-80 bg-primary-700/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl" />
        </div>
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v1H0V0zm20 20h1v1h-1v-1z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90 tracking-wide">Why Choose Us</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
              Hiring is broken.
              <br />
              <span className="bg-gradient-to-r from-white/90 via-white to-white/90 bg-clip-text text-transparent">
                We&apos;re fixing it.
              </span>
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">
              Traditional ATS systems reject qualified candidates over keywords. ConvexHire uses AI
              that reads resumes like a human recruiter would.
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-8 mb-10 pb-10 border-b border-white/10">
              {[
                { value: '10x', label: 'Faster' },
                { value: '94%', label: 'Accurate' },
                { value: '3min', label: 'Setup' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <Link href="/signup">
              <Button className="bg-background-surface hover:bg-background-subtle text-primary font-semibold rounded-xl px-8 py-3 h-auto group transition-all duration-200 hover:scale-105 shadow-xl shadow-black/20">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Abstract Visual Composition */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full h-[420px]">
              {/* Large Decorative Circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/5 border border-white/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full bg-white/5 border border-white/10" />

              {/* Central Megaphone Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl"
              >
                <Megaphone className="w-10 h-10 text-white" />
              </motion.div>

              {/* Floating Card: AI Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                animate={{ y: [0, -8, 0] }}
                className="absolute top-4 right-8 bg-background-surface rounded-xl p-3 shadow-xl border border-border-default w-44"
                style={{ animation: 'float 4s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-success-100 dark:bg-success-900/50 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">Match Score</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-success">95%</span>
                  <span className="text-xs text-text-tertiary">accuracy</span>
                </div>
              </motion.div>

              {/* Floating Card: Candidates */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute top-16 left-0 bg-background-surface rounded-xl p-3 shadow-xl border border-border-default w-40"
                style={{ animation: 'float 5s ease-in-out infinite 1s' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    <Users className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">Screened</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-600 border-2 border-background-surface"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-text-tertiary">+847</span>
                </div>
              </motion.div>

              {/* Floating Card: AI Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-16 right-0 bg-background-surface rounded-xl p-3 shadow-xl border border-border-default w-48"
                style={{ animation: 'float 4.5s ease-in-out infinite 0.5s' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-ai-100 dark:bg-ai-900/50 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-ai" />
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">AI Analysis</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">Skills</span>
                    <div className="w-20 h-1.5 rounded-full bg-background-subtle overflow-hidden">
                      <div className="w-[90%] h-full bg-success rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">Experience</span>
                    <div className="w-20 h-1.5 rounded-full bg-background-subtle overflow-hidden">
                      <div className="w-[75%] h-full bg-primary rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge: Fast */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-8 left-10 bg-background-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border-default"
                style={{ animation: 'float 3.5s ease-in-out infinite 2s' }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-semibold text-text-secondary">Instant Results</span>
                </div>
              </motion.div>

              {/* Floating Badge: Secure */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="absolute top-1 left-1/2 -translate-x-1/2 bg-background-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border-default"
                style={{ animation: 'float 4s ease-in-out infinite 1.5s' }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-text-secondary">Bias-Free</span>
                </div>
              </motion.div>

              {/* Star Decorations */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9 }}
                className="absolute top-12 right-1/3"
              >
                <Star className="w-4 h-4 text-warning-300/60 fill-warning-300/60" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
                className="absolute bottom-24 left-1/3"
              >
                <Star className="w-3 h-3 text-warning-300/40 fill-warning-300/40" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  )
}
