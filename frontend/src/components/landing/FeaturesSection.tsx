'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  FileText, 
  Users, 
  MessageSquare, 
  Shield, 
  Sparkles,
  Search,
  Calendar,
  LucideIcon
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
    description: 'Our AI reads resumes like humans — understanding that "FastAPI" and "Django" are both Python frameworks, not just matching keywords.',
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: FileText,
    title: 'Smart JD Generator',
    description: 'Describe your ideal candidate in plain English. AI drafts professional, bias-free job descriptions instantly.',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Users,
    title: 'Multi-Agent System',
    description: 'Specialized AI agents work together — one screens resumes, another handles interviews, another provides insights.',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: MessageSquare,
    title: 'Candidate Feedback',
    description: 'No more black holes. Every candidate gets constructive feedback explaining why they were selected or what skills to develop.',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Search,
    title: 'Talent Pool RAG',
    description: 'Chat with your candidate database: "Find AWS engineers with startup experience from last year." Get instant, accurate matches.',
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    icon: Calendar,
    title: 'Interview Automation',
    description: 'AI drafts personalized scheduling emails and integrates with your calendar. You review and approve — it handles the rest.',
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    icon: Shield,
    title: 'Bias Reduction',
    description: 'PII redaction during screening ensures fair evaluation. Every AI decision comes with an audit trail for transparency.',
    iconColor: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    icon: Sparkles,
    title: 'Explainable Scores',
    description: 'Every candidate gets a detailed breakdown — skills, experience, education — with natural language explanations for every decision.',
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Powered by AI
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Everything you need to hire
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              smarter, not harder
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A complete AI-powered recruitment suite that transforms how you find, 
            evaluate, and hire the best talent.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group relative"
              >
                <div className="h-full p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
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
