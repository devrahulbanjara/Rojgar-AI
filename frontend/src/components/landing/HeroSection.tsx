'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section
      className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center px-6 lg:px-8 py-8 sm:py-16 lg:py-20"
      style={{
        background: 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)',
      }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="px-2 sm:px-4 xl:px-0 text-center xl:text-left"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[76px] leading-[1.1] font-bold text-[#0F172A] mb-3 sm:mb-4 lg:mb-6 tracking-tight">
              Use AI to Recruit <span className="text-brand-blue">Humans</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#475569] mb-6 sm:mb-8 lg:mb-10 leading-relaxed max-w-2xl mx-auto xl:mx-0 break-words">
              Smarter hiring. Better matches. Happier candidates.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center xl:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-brand-blue hover:bg-[#2B3CF5] text-white text-sm sm:text-base font-medium rounded-xl px-6 sm:px-8 py-4 sm:py-6 h-auto transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  Start for Free
                </Button>
              </Link>
              <a href="#platform">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-[#475569] hover:text-brand-blue text-sm sm:text-base font-medium rounded-xl px-6 sm:px-8 py-4 sm:py-6 h-auto group w-full sm:w-auto"
                >
                  Explore Platform
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Visual - Placeholder for Dashboard Mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative px-2 sm:px-4 xl:px-0 order-first xl:order-last"
          >
            <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-[#E5E7EB] max-w-sm sm:max-w-md lg:max-w-none mx-auto">
              {/* Mock Dashboard */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#0F172A]">
                      Recruiter Dashboard
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569]">Smart candidate matching</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-blue" />
                  </div>
                </div>

                {/* Candidate Cards */}
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-brand-blue to-[#2B3CF5]" />
                    <div className="flex-1">
                      <div className="h-2 sm:h-3 bg-[#E5E7EB] rounded w-24 sm:w-32 mb-1 sm:mb-2" />
                      <div className="h-1.5 sm:h-2 bg-[#E5E7EB] rounded w-16 sm:w-20" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-brand-blue">
                      {95 - i * 5}%
                    </div>
                  </motion.div>
                ))}

                {/* Animated Connection Lines */}
                <motion.div
                  className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
