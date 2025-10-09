'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Award } from 'lucide-react';

const trustBadges = [
  {
    icon: ShieldCheck,
    label: 'GDPR Compliant',
  },
  {
    icon: Lock,
    label: 'SOC 2 Certified',
  },
  {
    icon: Award,
    label: 'ISO 27001',
  },
];

export function TrustSection() {
  return (
    <section className="py-20 px-6 bg-white border-t border-[#E5E7EB]">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-[#475569] uppercase tracking-wider mb-8">
            Enterprise-Grade Security & Compliance
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] flex items-center justify-center group-hover:bg-brand-blue/10 transition-colors duration-300">
                    <Icon className="h-8 w-8 text-[#475569] group-hover:text-brand-blue transition-colors duration-300" />
                  </div>
                  <span className="text-sm font-medium text-[#475569]">
                    {badge.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

