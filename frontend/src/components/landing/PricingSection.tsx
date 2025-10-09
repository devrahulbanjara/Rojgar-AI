'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Rocket, Zap, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    icon: Rocket,
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 active job postings',
      'AI Job Description Generator',
      'Basic AI Resume Screening and Scoring',
      'Candidate portal with Resume Builder',
      'Transparent, automated feedback for candidates',
      'Community and Email support',
    ],
  },
  {
    icon: Zap,
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Everything in Starter, plus:',
      'Unlimited job postings',
      'Automated Interview Scheduling Agent',
      'Offer Letter Automation and Management',
      'Candidate Dashboard with explainable AI scores',
    ],
    highlighted: true,
  },
  {
    icon: ShieldCheck,
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro, plus:',
      'RAG-based search to query past candidate data',
      'Interview evaluation using Speech-to-Text analysis',
      'Custom fairness and bias reporting',
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#F9FAFB]">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-semibold text-[#0F172A] mb-6 tracking-tight max-lg:text-4xl">
            Pricing
          </h2>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Card
                  className={`h-full rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    tier.highlighted
                      ? 'bg-white border-2 border-brand-blue shadow-xl'
                      : 'bg-white border border-[#E5E7EB] shadow-lg'
                  }`}
                >
                  <CardContent className="p-10">
                    {tier.highlighted && (
                      <div className="inline-block mb-4 px-4 py-1 bg-brand-blue/10 text-brand-blue text-sm font-semibold rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-6">
                      <Icon className="h-8 w-8 text-brand-blue" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#0F172A] mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-base text-[#475569] mb-6">
                      {tier.description}
                    </p>
                    <div className="mb-8">
                      <span className="text-5xl font-bold text-[#0F172A]">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-[#475569] text-lg">
                          {tier.period}
                        </span>
                      )}
                    </div>
                    <Link href="/signup">
                      <Button
                        className={`w-full rounded-xl py-6 text-base font-medium transition-all duration-200 ${
                          tier.highlighted
                            ? 'bg-brand-blue hover:bg-[#2B3CF5] text-white shadow-lg hover:shadow-xl hover:scale-105'
                            : 'bg-[#F9FAFB] hover:bg-brand-blue text-[#0F172A] hover:text-white'
                        }`}
                      >
                        Get Started
                      </Button>
                    </Link>
                    <ul className="mt-8 space-y-4">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-[#475569]"
                        >
                          <Check className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" />
                          <span className="text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
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

