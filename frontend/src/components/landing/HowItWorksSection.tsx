'use client'

import { motion } from 'framer-motion'
import { FileText, Brain, Users, MessageSquare, CheckCircle } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Create Job Posting',
    description:
      'Describe your ideal candidate. AI generates a professional, bias-free job description instantly.',
    color: 'from-primary to-primary-600',
    bgColor: 'bg-primary-50 dark:bg-primary-950/50',
    iconColor: 'text-primary',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Screens Resumes',
    description:
      'Our semantic AI analyzes every application, understanding skills by meaning, not just keywords.',
    color: 'from-ai to-ai-600',
    bgColor: 'bg-ai-50 dark:bg-ai-950/50',
    iconColor: 'text-ai',
  },
  {
    number: '03',
    icon: Users,
    title: 'Review Shortlist',
    description:
      'Get a ranked list of candidates with detailed score breakdowns. You stay in control of every decision.',
    color: 'from-success to-success-600',
    bgColor: 'bg-success-50 dark:bg-success-950/50',
    iconColor: 'text-success',
  },
  {
    number: '04',
    icon: MessageSquare,
    title: 'Schedule Interviews',
    description:
      'AI drafts personalized emails and coordinates schedules. You approve, it handles logistics.',
    color: 'from-warning to-warning-600',
    bgColor: 'bg-warning-50 dark:bg-warning-950/50',
    iconColor: 'text-warning-600',
  },
  {
    number: '05',
    icon: CheckCircle,
    title: 'Hire with Confidence',
    description:
      'Every decision is explainable. Candidates get feedback. Your team builds a transparent hiring reputation.',
    color: 'from-error to-error-600',
    bgColor: 'bg-error-50 dark:bg-error-950/50',
    iconColor: 'text-error',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-gradient-to-b from-background-subtle to-background-surface relative overflow-hidden"
    >
      {}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-subtle text-text-secondary text-sm font-medium mb-6">
            Simple Process
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary tracking-tightest mb-6">
            How ConvexHire works
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-sans">
            From job posting to hiring, our AI streamlines every step while keeping you in control.
          </p>
        </motion.div>

        {}
        <div className="relative">
          {}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary-200 via-ai-200 via-success-200 via-warning-200 to-error-200 -translate-x-1/2" />

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
                  {}
                  <div
                    className={`${isEven ? 'lg:text-right lg:pr-16' : 'lg:col-start-2 lg:pl-16'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${step.iconColor}`} />
                      </div>
                      <span
                        className={`text-5xl font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-50 dark:opacity-60`}
                      >
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-text-primary tracking-tight mt-4 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed max-w-md mx-auto lg:mx-0">
                      {step.description}
                    </p>
                  </div>

                  {}
                  <div className="hidden lg:flex absolute left-1/2 top-6 -translate-x-1/2 items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-br ${step.color} ring-4 ring-background-surface shadow-lg`}
                    />
                  </div>

                  {}
                  <div
                    className={`hidden lg:block ${isEven ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-1'}`}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
