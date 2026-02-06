'use client'

import { motion } from 'framer-motion'
import { FileText, Brain, Users, MessageSquare, CheckCircle } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Create Job Posting',
    description: 'Describe your ideal candidate. AI generates a professional, bias-free job description instantly.',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Screens Resumes',
    description: 'Our semantic AI analyzes every application, understanding skills by meaning, not just keywords.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    number: '03',
    icon: Users,
    title: 'Review Shortlist',
    description: 'Get a ranked list of candidates with detailed score breakdowns. You stay in control of every decision.',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    number: '04',
    icon: MessageSquare,
    title: 'Schedule Interviews',
    description: 'AI drafts personalized emails and coordinates schedules. You approve, it handles logistics.',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    number: '05',
    icon: CheckCircle,
    title: 'Hire with Confidence',
    description: 'Every decision is explainable. Candidates get feedback. Your team builds a transparent hiring reputation.',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
            Simple Process
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            How ConvexHire works
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            From job posting to hiring, our AI streamlines every step while keeping you in control.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-purple-200 via-emerald-200 via-orange-200 to-rose-200 -translate-x-1/2" />

          <div className="space-y-8 lg:space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative lg:grid lg:grid-cols-2 lg:gap-16 ${index > 0 ? 'lg:mt-8' : ''}`}
                >
                  {/* Content - alternates sides on desktop */}
                  <div className={`${isEven ? 'lg:text-right lg:pr-16' : 'lg:col-start-2 lg:pl-16'}`}>
                    <div className={`inline-flex items-center gap-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                      <div className={`w-14 h-14 rounded-2xl ${step.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${step.iconColor}`} />
                      </div>
                      <span className={`text-6xl font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30`}>
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 max-w-md mx-auto lg:mx-0">
                      {step.description}
                    </p>
                  </div>

                  {/* Center Dot on Timeline */}
                  <div className="hidden lg:flex absolute left-1/2 top-6 -translate-x-1/2 items-center justify-center">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${step.color} ring-4 ring-white shadow-lg`} />
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className={`hidden lg:block ${isEven ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-1'}`} />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
