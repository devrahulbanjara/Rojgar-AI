'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { FileText, Users2, CalendarClock } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Smart Job Description',
    description:
      'AI-powered job descriptions that attract the right candidates and filter out noise.',
  },
  {
    icon: Users2,
    title: 'Candidate Dashboard',
    description:
      'Centralized view of all applicants with intelligent scoring and ranking systems.',
  },
  {
    icon: CalendarClock,
    title: 'Interview Automation',
    description:
      'Schedule, coordinate, and manage interviews seamlessly with automated workflows.',
  },
];

export function RecruiterPlatformSection() {
  return (
    <section id="platform" className="py-32 px-6 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-semibold text-[#0F172A] mb-6 tracking-tight max-lg:text-4xl">
            Recruiter Platform
          </h2>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Everything you need to find, evaluate, and hire the best talent
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Card className="h-full bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-[#E5E7EB] group">
                  <CardContent className="p-10">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-6 group-hover:bg-brand-blue transition-colors duration-300">
                      <Icon className="h-8 w-8 text-brand-blue group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#0F172A] mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-base text-[#475569] leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

