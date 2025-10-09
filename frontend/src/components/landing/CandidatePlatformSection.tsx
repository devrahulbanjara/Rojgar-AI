'use client';

import { motion } from 'framer-motion';
import { Edit3, Search, MessageSquare, Layers } from 'lucide-react';

const features = [
  {
    icon: Edit3,
    title: 'Resume Builder',
    description: 'Create professional resumes tailored to each opportunity',
  },
  {
    icon: Search,
    title: 'Keyword Match',
    description: 'See how well your resume matches job requirements',
  },
  {
    icon: MessageSquare,
    title: 'Instant Feedback',
    description: 'Get real-time suggestions to improve your applications',
  },
  {
    icon: Layers,
    title: 'Multi-Resume',
    description: 'Manage multiple resumes for different job types',
  },
];

export function CandidatePlatformSection() {
  return (
    <section id="candidates" className="py-32 px-6 bg-[#F9FAFB]">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual Mock */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-[#E5E7EB]">
              {/* Resume Compatibility Mock */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#0F172A]">
                    Resume Compatibility
                  </h3>
                  <span className="text-3xl font-bold text-brand-blue">
                    87%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '87%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-brand-blue to-[#2B3CF5] rounded-full"
                  />
                </div>

                {/* Match Details */}
                <div className="space-y-3 pt-4">
                  {[
                    { label: 'Skills Match', value: '92%' },
                    { label: 'Experience Match', value: '85%' },
                    { label: 'Education Match', value: '95%' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB]"
                    >
                      <span className="text-sm font-medium text-[#475569]">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-brand-blue">
                        {item.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-5xl font-semibold text-[#0F172A] mb-6 tracking-tight max-lg:text-4xl">
              Candidate Platform
            </h2>
            <p className="text-xl text-[#475569] mb-10 leading-relaxed">
              Tools that help you stand out and land your dream job faster
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#0F172A] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-base text-[#475569]">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

