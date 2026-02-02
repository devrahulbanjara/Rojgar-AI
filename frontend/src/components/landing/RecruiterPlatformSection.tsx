'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { FileText, Users2, CalendarClock } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    icon: FileText,
    title: 'Smart Job Description',
    description:
      'AI agents craft job descriptions that understand roles, market trends, and tone — attracting the perfect talent with zero manual tweaking.',
  },
  {
    icon: CalendarClock,
    title: 'Interview Automation',
    description:
      'Autonomous scheduling agents coordinate interviews end-to-end — no reminders, no emails, just effortless precision.',
  },
  {
    icon: Users2,
    title: 'Intelligent Scoring',
    description:
      'AI-powered evaluators analyze responses, voice cues, and context to score candidates with unmatched accuracy — decisions made smarter, not slower.',
  },
]

export function RecruiterPlatformSection() {
  return (
    <section id="platform" className="py-16 sm:py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20 px-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#0F172A] mb-4 sm:mb-6 tracking-tight">
            For Recruiters
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-[#475569] max-w-3xl mx-auto leading-relaxed">
            Everything you need to find, evaluate, and hire the best talent
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left: Recruiter Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden xl:block px-4"
          >
            <div className="relative w-full max-w-[500px] mx-auto">
              <Image
                src="/illustrations/recruiter.svg"
                alt="Recruiter using AI-powered hiring platform"
                width={500}
                height={500}
                className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
                priority
              />
            </div>
          </motion.div>

          {/* Right: Feature Cards */}
          <div className="space-y-6 sm:space-y-8 px-2 xl:px-0 xl:text-left text-center">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <Card className="h-full bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-[#E5E7EB] group">
                    <CardContent className="p-6 sm:p-8">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-brand-blue transition-colors duration-300">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-brand-blue group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0F172A] mb-3 sm:mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#475569] leading-relaxed break-words">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
