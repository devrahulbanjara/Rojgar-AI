'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Users,
  ListChecks,
  FileText,
  Calendar,
  Database,
  Target,
} from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'

const features = [
  { title: 'AI Resume Screening', icon: Brain },
  { title: 'Smart JD Generator', icon: FileText },
  { title: 'Auto Scheduling', icon: Calendar },
  { title: 'Talent Pool Search', icon: Database },
]

export function RecruiterPlatformSection() {
  return (
    <section
      id="platform"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-b from-background-subtle to-background-surface relative overflow-hidden"
    >
      {}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100/30 dark:bg-primary-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-ai/10 rounded-3xl blur-2xl" />

              {}
              <div className="relative bg-background-surface rounded-2xl shadow-xl border border-border-default overflow-hidden">
                {}
                <div className="px-5 py-3.5 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/50 to-background-surface border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-display font-bold text-text-primary tracking-tight">
                      AI Shortlisting
                    </h3>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Smart candidate evaluation</p>
                </div>

                {}
                <div className="p-4 space-y-3 bg-background-subtle/30">
                  {}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: 'Candidates',
                        value: '24',
                        icon: Users,
                        color: 'text-primary',
                        bg: 'bg-primary-50 dark:bg-primary-950/50',
                      },
                      {
                        label: 'AI Scored',
                        value: '24',
                        icon: Target,
                        color: 'text-ai',
                        bg: 'bg-ai-50 dark:bg-ai-950/50',
                      },
                      {
                        label: 'Shortlisted',
                        value: '8',
                        icon: ListChecks,
                        color: 'text-success',
                        bg: 'bg-success-50 dark:bg-success-950/50',
                      },
                    ].map((stat, i) => {
                      const Icon = stat.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="bg-background-surface p-2.5 rounded-lg border border-border-subtle shadow-sm"
                        >
                          <div
                            className={`w-6 h-6 ${stat.bg} rounded-md flex items-center justify-center mb-1.5`}
                          >
                            <Icon className={`w-3 h-3 ${stat.color}`} />
                          </div>
                          <div className="text-lg font-bold text-text-primary">{stat.value}</div>
                          <div className="text-xs text-text-tertiary">{stat.label}</div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {}
                  <div className="space-y-2">
                    {[
                      {
                        score: 92,
                        color: 'border-l-success',
                        badgeColor: 'bg-success-50 text-success-700',
                      },
                      {
                        score: 78,
                        color: 'border-l-warning',
                        badgeColor: 'bg-warning-50 text-warning-700',
                      },
                    ].map((candidate, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`bg-background-surface p-3 rounded-lg border border-border-default border-l-[3px] ${candidate.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-border-default animate-pulse flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="h-3 bg-border-default rounded w-24 mb-1 animate-pulse" />
                            <div className="h-2 bg-border-subtle rounded w-16 animate-pulse" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-mono font-bold text-primary">
                              {candidate.score}
                            </div>
                            <div className="text-xs font-mono text-text-tertiary">AI Score</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${candidate.badgeColor}`}
                          >
                            {candidate.score >= 85 ? 'Recommended' : 'Review'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button className="w-6 h-6 rounded-md bg-success-50 flex items-center justify-center">
                              <ThumbsUp className="w-3 h-3 text-success" />
                            </button>
                            <button className="w-6 h-6 rounded-md bg-error-50 flex items-center justify-center">
                              <ThumbsDown className="w-3 h-3 text-error" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary text-sm font-medium mb-6">
              For Recruiters
            </div>

            <h2 className="text-4xl sm:text-5xl font-display font-bold text-text-primary tracking-tightest mb-6">
              Hire faster with{' '}
              <span className="bg-gradient-to-r from-primary to-ai bg-clip-text text-transparent">
                AI automation
              </span>
            </h2>

            <p className="text-lg text-text-secondary mb-8 max-w-md leading-relaxed font-sans">
              AI agents handle screening, scheduling, and matching while you stay in control.
            </p>

            {}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background-subtle border border-border-subtle"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{feature.title}</span>
                  </motion.div>
                )
              })}
            </div>

            <Link href="/signup">
              <Button className="btn-primary-gradient font-semibold rounded-xl px-6 py-2.5 h-auto group">
                Start Hiring Smarter
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
