'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Video,
  Trophy,
  FileEdit,
  MessageSquareText,
  Search,
  Users,
} from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'

const features = [
  { title: 'Smart Resume Builder', icon: FileEdit },
  { title: 'Application Feedback', icon: MessageSquareText },
  { title: 'AI Job Matching', icon: Search },
  { title: 'Talent Pool Access', icon: Users },
]

export function CandidatePlatformSection() {
  return (
    <section
      id="candidates"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-background-surface relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-success-100/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-50 text-success text-sm font-medium mb-6">
              For Candidates
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-6">
              Job search that{' '}
              <span className="bg-gradient-to-r from-success to-success-600 bg-clip-text text-transparent">
                respects you
              </span>
            </h2>

            <p className="text-lg text-text-secondary mb-8 max-w-md leading-relaxed">
              Get feedback on every application and tools to stand out in your job search.
            </p>

            {/* Features Grid */}
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
                    <div className="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">{feature.title}</span>
                  </motion.div>
                )
              })}
            </div>

            <Link href="/signup">
              <Button className="bg-success hover:bg-success-600 text-white font-semibold rounded-xl px-6 py-2.5 h-auto group">
                Create Your Profile
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: Visual - Application Tracker */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-success/10 to-success-600/10 rounded-3xl blur-2xl" />

              {/* Application Tracker Card */}
              <div className="relative bg-background-surface rounded-2xl shadow-xl border border-border-default overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-gradient-to-b from-success-50/50 to-background-surface border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-success" />
                    <h3 className="text-base font-bold text-text-primary">Your Applications</h3>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Track your journey</p>
                </div>

                {/* Kanban Columns */}
                <div className="p-4 bg-background-subtle/50">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Applied Column */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="bg-info-50/50 rounded-lg p-2.5 border border-info-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-info" />
                          <span className="text-xs font-bold text-info-700">Applied</span>
                        </div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-info-100 text-info-700">
                          3
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2].map((_, i) => (
                          <div
                            key={i}
                            className="bg-background-surface p-2 rounded-md border border-border-default border-l-2 border-l-info"
                          >
                            <div className="h-2.5 bg-border-default rounded w-16 mb-1 animate-pulse" />
                            <div className="h-2 bg-border-subtle rounded w-12 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Interviewing Column */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                      className="bg-primary-50/50 rounded-lg p-2.5 border border-primary-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-primary" />
                          <span className="text-xs font-bold text-primary-700">Interview</span>
                        </div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700">
                          2
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2].map((_, i) => (
                          <div
                            key={i}
                            className="bg-background-surface p-2 rounded-md border border-border-default border-l-2 border-l-primary"
                          >
                            <div className="h-2.5 bg-border-default rounded w-14 mb-1 animate-pulse" />
                            <div className="h-2 bg-border-subtle rounded w-10 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Outcome Column */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="bg-success-50/50 rounded-lg p-2.5 border border-success-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3 text-success" />
                          <span className="text-xs font-bold text-success-700">Offers</span>
                        </div>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-success-100 text-success-700">
                          1
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-background-surface p-2 rounded-md border border-border-default border-l-2 border-l-success">
                          <div className="h-2.5 bg-border-default rounded w-16 mb-1 animate-pulse" />
                          <div className="h-2 bg-border-subtle rounded w-11 animate-pulse" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
