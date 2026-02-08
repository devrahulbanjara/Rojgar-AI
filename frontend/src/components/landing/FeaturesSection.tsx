'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  FileText,
  Users,
  MessageSquare,
  Shield,
  FileSearch,
  Search,
  LucideIcon,
} from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconColor: string
  bgColor: string
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'Semantic Understanding',
    description:
      'We know "FastAPI" and "Django" are both Python frameworks. Your ATS doesn\'t. (Yes, actually semantic.)',
    iconColor: 'text-primary',
    bgColor: 'bg-primary-50 dark:bg-primary-950/50',
  },
  {
    icon: FileText,
    title: 'Smart JD Generator',
    description:
      "Describe your role like you're texting a friend. We'll write the formal version. Takes 3 minutes, we timed it.",
    iconColor: 'text-primary',
    bgColor: 'bg-primary-50 dark:bg-primary-950/50',
  },
  {
    icon: Users,
    title: 'Multi-Agent System',
    description:
      'Specialized AI agents work together - one screens resumes, another handles interviews, another delivers insights.',
    iconColor: 'text-success',
    bgColor: 'bg-success-50 dark:bg-success-950/50',
  },
  {
    icon: MessageSquare,
    title: 'Real Candidate Feedback',
    description:
      "Every candidate gets a real explanation, not just a score. We're serious about the feedback thing.",
    iconColor: 'text-warning-600',
    bgColor: 'bg-warning-50 dark:bg-warning-950/50',
  },
  {
    icon: Search,
    title: 'Talent Pool RAG',
    description:
      '"Find AWS engineers with startup experience" - like Sampada Poudel, who built the entire infrastructure for a 50-person fintech.',
    iconColor: 'text-info',
    bgColor: 'bg-info-50 dark:bg-info-950/50',
  },
  {
    icon: Shield,
    title: 'Bias-Free Screening',
    description:
      "We hide names, photos, and universities until you've scored the work. Every decision has an audit trail.",
    iconColor: 'text-text-secondary',
    bgColor: 'bg-background-subtle',
  },
  {
    icon: FileSearch,
    title: 'Explainable Scores',
    description:
      'Detailed breakdowns of skills, experience, and education. Every rejection gets a real explanation.',
    iconColor: 'text-ai',
    bgColor: 'bg-ai-50 dark:bg-ai-950/50',
  },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-background-surface relative overflow-hidden"
    >
      {}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Left-aligned header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-left mb-16 lg:mb-20 max-w-2xl"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary tracking-tightest mb-6">
            Everything you need.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
              Nothing you don't.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary leading-relaxed font-sans">
            We built what recruiters actually asked for.
          </p>
        </motion.div>

        {/* Asymmetric grid - first 2 features larger, varied offsets */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon
            // First 2 features span 2 columns on xl
            const isLarge = index < 2
            // Stagger vertical offset for visual interest
            const offsetY = [0, -16, 8, -8, 12, -4, 0][index] || 0
            // Vary padding and border-radius
            const padding = ['p-8', 'p-9', 'p-7', 'p-8', 'p-9', 'p-7', 'p-8'][index]
            const borderRadius = [
              'rounded-2xl',
              'rounded-xl',
              'rounded-3xl',
              'rounded-2xl',
              'rounded-xl',
              'rounded-2xl',
              'rounded-3xl',
            ][index]
            // Remove border from some cards
            const hasBorder = index !== 2 && index !== 5

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                className={`group relative ${isLarge ? 'xl:col-span-2' : ''}`}
                style={{ transform: `translateY(${offsetY}px)` }}
              >
                <div
                  className={`flex flex-col h-full min-h-[220px] ${padding} ${borderRadius} bg-background-surface ${hasBorder ? 'border border-border-default' : ''} hover:border-border-strong transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                >
                  {/* Icon with varied styling */}
                  <div
                    className={`w-12 h-12 ${feature.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    style={{
                      borderRadius: `${8 + index * 2}px`,
                      transform: `rotate(${index % 2 === 0 ? 0 : 3}deg)`,
                    }}
                  >
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-display font-semibold text-text-primary tracking-tight mb-3">
                    {feature.title}
                  </h3>

                  {/* Description - removed line-clamp for larger cards */}
                  <p
                    className={`text-sm text-text-secondary leading-relaxed ${isLarge ? '' : 'line-clamp-4'}`}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
