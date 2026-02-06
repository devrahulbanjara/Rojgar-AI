'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Brain, ThumbsUp, ThumbsDown, Users, ListChecks, FileText, Calendar, Database, Target } from 'lucide-react'
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
    <section id="platform" className="py-20 lg:py-28 px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
              
              {/* AI Shortlisting Dashboard */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-gradient-to-b from-indigo-50/50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">AI Shortlisting</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Smart candidate evaluation</p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 bg-slate-50/30">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Candidates', value: '24', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'AI Scored', value: '24', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { label: 'Shortlisted', value: '8', icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((stat, i) => {
                      const Icon = stat.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm"
                        >
                          <div className={`w-6 h-6 ${stat.bg} rounded-md flex items-center justify-center mb-1.5`}>
                            <Icon className={`w-3 h-3 ${stat.color}`} />
                          </div>
                          <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                          <div className="text-[10px] text-slate-500">{stat.label}</div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Candidate Cards */}
                  <div className="space-y-2">
                    {[
                      { score: 92, color: 'border-l-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700' },
                      { score: 78, color: 'border-l-amber-500', badgeColor: 'bg-amber-50 text-amber-700' },
                    ].map((candidate, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`bg-white p-3 rounded-lg border border-slate-200 border-l-[3px] ${candidate.color}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="h-3 bg-slate-200 rounded w-24 mb-1 animate-pulse" />
                            <div className="h-2 bg-slate-100 rounded w-16 animate-pulse" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">{candidate.score}</div>
                            <div className="text-[9px] text-slate-500">AI Score</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${candidate.badgeColor}`}>
                            {candidate.score >= 85 ? 'Recommended' : 'Review'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                              <ThumbsUp className="w-3 h-3 text-emerald-600" />
                            </button>
                            <button className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
                              <ThumbsDown className="w-3 h-3 text-red-500" />
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

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <div className="mb-4">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">For Recruiters</span>
                <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Hire faster with{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI automation
              </span>
            </h2>

            <p className="text-base text-slate-600 mb-8 max-w-md">
              AI agents handle screening, scheduling, and matching while you stay in control.
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
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{feature.title}</span>
                  </motion.div>
                )
              })}
            </div>

            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-2.5 h-auto group">
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
