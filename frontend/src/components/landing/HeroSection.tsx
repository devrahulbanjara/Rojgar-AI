'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import Link from 'next/link'
import { ArrowRight, Sparkles, Brain, Zap, Network, FileSearch, ShieldCheck, BriefcaseIcon, Users, Target } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-indigo-50/30" />
      
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 shadow-sm mb-8 backdrop-blur-sm"
          >
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-700 tracking-wide">AI-Powered Recruitment Platform</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 leading-[1.05] tracking-tight mb-8"
          >
            Hiring that{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                understands
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 -z-10 rounded-full opacity-60"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </span>
            <br />
            your candidates
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            ConvexHire uses AI agents that read resumes like humans do — 
            matching skills by meaning, not just keywords.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center mb-16"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold rounded-xl px-10 py-6 h-auto transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-12 pt-8 border-t border-slate-200/60"
          >
            {[
              {
                icon: Network,
                label: 'Multi-Agent AI System',
                iconColor: 'text-indigo-500',
                bgGradient: 'from-indigo-500/10 to-indigo-500/5',
              },
              {
                icon: FileSearch,
                label: 'Semantic Resume Analysis',
                iconColor: 'text-purple-500',
                bgGradient: 'from-purple-500/10 to-purple-500/5',
              },
              {
                icon: ShieldCheck,
                label: 'Explainable Decisions',
                iconColor: 'text-emerald-500',
                bgGradient: 'from-emerald-500/10 to-emerald-500/5',
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  className="relative flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-br from-slate-50/50 to-transparent"
                >
                  <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${item.bgGradient} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${item.iconColor} relative z-10`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 tracking-wide">
                    {item.label}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl opacity-60" />
            
            {/* Dashboard Mock */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
              {/* Browser Bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full max-w-md mx-auto h-6 bg-white rounded-md border border-slate-200 flex items-center px-3">
                    <span className="text-xs text-slate-400">convexhire.app/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 bg-gradient-to-b from-indigo-50/50 to-white min-h-[300px] lg:min-h-[400px]">
                {/* Welcome Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Recruiter Dashboard
                  </h1>
                  <p className="text-sm text-slate-600">Smart candidate matching</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { 
                      title: 'Active Jobs',
                      value: '12', 
                      icon: BriefcaseIcon,
                      description: 'Jobs currently posted',
                      color: 'bg-indigo-50',
                      iconColor: 'text-indigo-600'
                    },
                    { 
                      title: 'Candidates',
                      value: '847', 
                      icon: Users,
                      description: 'Active candidates',
                      color: 'bg-emerald-50',
                      iconColor: 'text-emerald-600'
                    },
                    { 
                      title: 'AI Matches',
                      value: '156', 
                      icon: Target,
                      description: 'Smart recommendations',
                      color: 'bg-purple-50',
                      iconColor: 'text-purple-600'
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + i * 0.1 }}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                        <div className="text-xs font-medium text-slate-600">{stat.description}</div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Top AI Matches Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <h3 className="text-sm font-semibold text-slate-700">Top AI Matches</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[95, 92, 88].map((score, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + i * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-indigo-50/50 transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                        <div className="flex-1 min-w-0">
                          <div className="h-3 bg-slate-200 rounded w-32 mb-1" />
                          <div className="h-2 bg-slate-100 rounded w-24" />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{score}%</div>
                          <div className="text-xs text-emerald-500">AI Match</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
