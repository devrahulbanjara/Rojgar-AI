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
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100/30 dark:bg-primary-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Mockup Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-ai/10 rounded-3xl blur-2xl" />

              {/* Main Card */}
              <div className="relative bg-background-surface rounded-2xl shadow-xl border border-border-default overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-gradient-to-b from-primary-50/50 dark:from-primary-950/50 to-background-surface border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-display font-bold text-text-primary tracking-tight">
                      AI Shortlisting
                    </h3>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Smart candidate evaluation</p>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="space-y-4">
                    {/* Candidate 1 - High Match */}
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-success-50/50 dark:bg-success-950/20 border border-success-100 dark:border-success-900/30">
                      <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/50 flex items-center justify-center flex-shrink-0">
                        <ThumbsUp className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-text-primary truncate">Senior Frontend Engineer</h4>
                          <span className="text-xs font-bold text-success bg-success-100 dark:bg-success-900/50 px-2 py-0.5 rounded-full">
                            98% Match
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          Strong React & TypeScript experience. Previously led a team of 5 at a fintech startup.
                        </p>
                      </div>
                    </div>

                    {/* Candidate 2 - Low Match */}
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-background-subtle border border-border-subtle opacity-75">
                      <div className="w-10 h-10 rounded-full bg-text-tertiary/10 flex items-center justify-center flex-shrink-0">
                        <ThumbsDown className="w-5 h-5 text-text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-text-secondary truncate">Digital Marketer</h4>
                          <span className="text-xs font-medium text-text-tertiary bg-text-tertiary/10 px-2 py-0.5 rounded-full">
                            15% Match
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary line-clamp-1">
                          Missing required technical skills. Background primarily in content creation.
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex-1 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 text-center">
                        <div className="text-lg font-bold text-primary">24h</div>
                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Saved</div>
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">10x</div>
                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Faster</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-text-primary tracking-tightest mb-6">
              Stop losing candidates
              <br />
              <span className="text-text-secondary">to keyword filters.</span>
            </h2>

            <p className="text-lg text-text-secondary mb-8 max-w-md leading-relaxed font-sans">
              Your current ATS rejected qualified engineers because they wrote "Node" instead of "Node.js". Ours reads resumes like you would.
            </p>

            {/* Keep feature grid but update text */}
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
                Try it free
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
