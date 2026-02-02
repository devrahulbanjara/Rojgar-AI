'use client'

import { motion } from 'framer-motion'
import { FileEdit, Brain, Eye, Clock } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    icon: FileEdit,
    title: 'Adaptive Resume Builder',
    description:
      'Build job-specific resumes in just a few clicks — AI agents adapt content, suggest missing skills, and optimize keywords for every opportunity.',
  },
  {
    icon: Brain,
    title: 'Intelligent Interview Preparation',
    description:
      'Prepare smarter with AI-driven insights — tailored questions, guidance, and simulations based on job descriptions, past interviews, and your own resume.',
  },
  {
    icon: Eye,
    title: 'Transparent Hiring Process',
    description:
      'Know exactly why you were shortlisted, selected, or rejected — AI explains every decision with clear, data-backed reasoning.',
  },
  {
    icon: Clock,
    title: 'Future-fit Hiring',
    description:
      'Your past interviews fuel tomorrow’s opportunities — get automatically rediscovered by companies for future roles.',
  },
]

export function CandidatePlatformSection() {
  return (
    <section id="candidates" className="py-16 sm:py-24 lg:py-32 px-6 lg:px-8 bg-[#F9FAFB]">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 xl:order-1 px-2 xl:px-0 xl:text-left text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#0F172A] mb-4 sm:mb-6 tracking-tight">
              For Candidates
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-[#475569] mb-8 sm:mb-10 leading-relaxed">
              Tools that help you stand out and land your dream job faster
            </p>

            <div className="space-y-4 sm:space-y-6 xl:items-start items-center">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex xl:items-start items-center gap-3 sm:gap-4 xl:flex-row flex-col"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
                    </div>
                    <div className="xl:text-left text-center">
                      <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-1 sm:mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[#475569] leading-relaxed break-words">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Right: Candidate Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 xl:order-2 hidden xl:block px-4"
          >
            <div className="relative w-full max-w-[500px] mx-auto">
              <Image
                src="/illustrations/candidate.svg"
                alt="Candidate using AI-powered job search tools"
                width={500}
                height={500}
                className="w-full h-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
