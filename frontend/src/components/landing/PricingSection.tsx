'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Check, Crown, Rocket, Building2, Zap, Star } from 'lucide-react'
import Link from 'next/link'

const tiers = [
  {
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 'Free',
    period: '',
    icon: Rocket,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    features: [
      'Up to 3 active job postings',
      'AI Job Description Generator',
      'Basic AI Resume Screening',
      'Candidate portal with Resume Builder',
      'Automated feedback for candidates',
      'Community & Email support',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'For growing teams who need more power',
    price: '$49',
    period: '/month',
    icon: Zap,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    features: [
      'Everything in Starter, plus:',
      'Unlimited job postings',
      'Advanced semantic screening',
      'Automated Interview Scheduling',
      'Offer letter automation',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 'Custom',
    period: '',
    icon: Building2,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    features: [
      'Everything in Pro, plus:',
      'RAG-based talent pool search',
      'Speech-to-text interview analysis',
      'Custom bias & fairness reporting',
      'Dedicated account manager',
      'SLA & custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-24 px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="mb-5">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Pricing</span>
              <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-5">
            Start free, scale as you grow
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            No hidden fees. Choose the plan that fits your needs.
          </p>
        </motion.div>

        {/* Compact Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Popular Badge */}
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                      <Crown className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}

                <div className={`h-full rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'bg-white border-2 border-indigo-200 shadow-lg'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                } transition-all duration-200`}>
                  
                  {/* Icon & Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-10 h-10 ${tier.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                      <p className="text-xs text-slate-500">{tier.description}</p>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl font-bold text-slate-900">{tier.price}</span>
                    {tier.period && (
                      <span className="text-slate-500 text-sm">{tier.period}</span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link href="/signup" className="block mb-8">
                    <Button
                      className={`w-full rounded-lg py-2.5 h-auto font-medium text-sm transition-all duration-200 ${
                        tier.highlighted
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>

                  {/* Features */}
                  <div className="space-y-4">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          tier.highlighted ? 'text-indigo-600' : 'text-emerald-500'
                        }`} />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 mt-14"
        >
          14-day free trial • No credit card required • Cancel anytime
        </motion.p>
      </div>
    </section>
  )
}
