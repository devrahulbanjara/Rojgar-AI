'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, Video, Trophy, FileEdit, MessageSquareText, Search, Users } from 'lucide-react'
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
    <section id="candidates" className="py-20 lg:py-28 px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">For Candidates</span>
                <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Job search that{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                respects you
              </span>
            </h2>

            <p className="text-base text-slate-600 mb-8 max-w-md">
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{feature.title}</span>
                  </motion.div>
                )
              })}
            </div>

            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 py-2.5 h-auto group">
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
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl" />
              
              {/* Application Tracker Card */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-gradient-to-b from-emerald-50/50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">Your Applications</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Track your journey</p>
                </div>

                {/* Kanban Columns */}
                <div className="p-4 bg-slate-50/50">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Applied Column */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="bg-blue-50/50 rounded-lg p-2.5 border border-blue-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          <span className="text-[10px] font-bold text-blue-900">Applied</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">3</span>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2].map((_, i) => (
                          <div key={i} className="bg-white p-2 rounded-md border border-slate-200 border-l-2 border-l-blue-500">
                            <div className="h-2.5 bg-slate-200 rounded w-16 mb-1 animate-pulse" />
                            <div className="h-2 bg-slate-100 rounded w-12 animate-pulse" />
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
                      className="bg-indigo-50/50 rounded-lg p-2.5 border border-indigo-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-900">Interview</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">2</span>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2].map((_, i) => (
                          <div key={i} className="bg-white p-2 rounded-md border border-slate-200 border-l-2 border-l-indigo-500">
                            <div className="h-2.5 bg-slate-200 rounded w-14 mb-1 animate-pulse" />
                            <div className="h-2 bg-slate-100 rounded w-10 animate-pulse" />
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
                      className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-900">Offers</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">1</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-white p-2 rounded-md border border-slate-200 border-l-2 border-l-emerald-500">
                          <div className="h-2.5 bg-slate-200 rounded w-16 mb-1 animate-pulse" />
                          <div className="h-2 bg-slate-100 rounded w-11 animate-pulse" />
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
