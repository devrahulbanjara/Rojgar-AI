'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center px-6 py-20"
      style={{
        background: 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)',
      }}
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-[76px] leading-[1.1] font-bold text-[#0F172A] mb-6 tracking-tight max-lg:text-[42px]">
              Use AI to Recruit{' '}
              <span className="text-brand-blue">Humans</span>
            </h1>
            <p className="text-xl text-[#475569] mb-10 leading-relaxed max-w-xl">
              From job descriptions to offer letters — ConvexHire automates
              intelligently, not impersonally.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-brand-blue hover:bg-[#2B3CF5] text-white text-base font-medium rounded-xl px-8 py-6 h-auto transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start for Free
                </Button>
              </Link>
              <a href="#platform">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-[#475569] hover:text-brand-blue text-base font-medium rounded-xl px-8 py-6 h-auto group"
                >
                  Explore Platform
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Right Visual - Placeholder for Dashboard Mock */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-[#E5E7EB]">
              {/* Mock Dashboard */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A]">
                      Recruiter Dashboard
                    </h3>
                    <p className="text-sm text-[#475569]">
                      Smart candidate matching
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-brand-blue"></div>
                  </div>
                </div>

                {/* Candidate Cards */}
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-[#2B3CF5]"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-[#E5E7EB] rounded w-32 mb-2"></div>
                      <div className="h-2 bg-[#E5E7EB] rounded w-20"></div>
                    </div>
                    <div className="text-sm font-semibold text-brand-blue">
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
  );
}

