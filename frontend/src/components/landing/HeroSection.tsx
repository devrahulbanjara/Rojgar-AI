'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  Network,
  FileSearch,
  ShieldCheck,
  BriefcaseIcon,
  Users,
  Target,
} from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-subtle via-background-surface to-primary-50 dark:to-primary-950/30" />

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/50 border border-primary-200 dark:border-primary-800 shadow-sm mb-8 backdrop-blur-sm"
          >
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-secondary tracking-wide">
              AI-Powered Recruitment Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary leading-[1.05] tracking-tight mb-8"
          >
            Hiring that{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-primary to-primary-600 bg-clip-text text-transparent">
                understands
              </span>
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-primary/30 via-primary/40 to-primary/30 -z-10 rounded-full opacity-60"
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
            className="text-lg sm:text-xl lg:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            ConvexHire uses AI agents that read resumes like humans do — matching skills by meaning,
            not just keywords.
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
                className="btn-primary-gradient text-base font-semibold rounded-xl px-10 py-6 h-auto transition-all duration-300 hover:scale-105 group"
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
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-12 pt-8 border-t border-border-subtle"
          >
            {[
              {
                icon: Network,
                label: 'Multi-Agent AI System',
                iconColor: 'text-primary',
                bgGradient: 'from-primary-100 to-primary-50',
              },
              {
                icon: FileSearch,
                label: 'Semantic Resume Analysis',
                iconColor: 'text-primary',
                bgGradient: 'from-primary-100 to-primary-50',
              },
              {
                icon: ShieldCheck,
                label: 'Explainable Decisions',
                iconColor: 'text-success',
                bgGradient: 'from-success-100 to-success-50',
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  className="relative flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-br from-background-subtle/50 dark:from-background-surface/50 to-transparent"
                >
                  <div
                    className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${item.bgGradient} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${item.iconColor} relative z-10`} />
                  </div>
                  <span className="text-sm font-medium text-text-secondary tracking-wide">
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
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/25 to-primary/20 rounded-3xl blur-2xl opacity-60" />

            {/* Dashboard Mock */}
            <div className="relative bg-background-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden">
              {/* Browser Bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-background-subtle border-b border-border-default">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full max-w-md mx-auto h-6 bg-background-surface rounded-md border border-border-default flex items-center px-3">
                    <span className="text-xs text-text-muted">convexhire.app/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 bg-gradient-to-b from-primary-50 dark:from-primary-950/50 to-background-surface min-h-[300px] lg:min-h-[400px]">
                {/* Welcome Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-text-primary mb-1">Recruiter Dashboard</h1>
                  <p className="text-sm text-text-secondary">Smart candidate matching</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      title: 'Active Jobs',
                      value: '12',
                      icon: BriefcaseIcon,
                      description: 'Jobs currently posted',
                      color: 'bg-primary-50 dark:bg-primary-950/50',
                      iconColor: 'text-primary',
                    },
                    {
                      title: 'Candidates',
                      value: '847',
                      icon: Users,
                      description: 'Active candidates',
                      color: 'bg-success-50 dark:bg-success-950/50',
                      iconColor: 'text-success',
                    },
                    {
                      title: 'AI Matches',
                      value: '156',
                      icon: Target,
                      description: 'Smart recommendations',
                      color: 'bg-ai-50 dark:bg-ai-950/50',
                      iconColor: 'text-ai',
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + i * 0.1 }}
                        className="bg-background-surface rounded-2xl p-4 border border-border-default shadow-sm hover:shadow-md transition-all duration-300 group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <div className="text-2xl font-bold text-text-primary mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm font-medium text-text-secondary">
                          {stat.description}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Top AI Matches Table */}
                <div className="bg-background-surface rounded-2xl border border-border-default overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-background-subtle to-background-surface">
                    <h3 className="text-sm font-semibold text-text-secondary">Top AI Matches</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[95, 92, 88].map((score, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + i * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-background-subtle/50 hover:bg-primary-50 transition-colors duration-200 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600" />
                        <div className="flex-1 min-w-0">
                          <div className="h-3 bg-border-default rounded w-32 mb-1" />
                          <div className="h-2 bg-border-subtle rounded w-24" />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-success">{score}%</div>
                          <div className="text-sm text-success-600">AI Match</div>
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
