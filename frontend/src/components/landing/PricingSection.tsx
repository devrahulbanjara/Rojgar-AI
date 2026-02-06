'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Check, Crown, Rocket, Building2, Zap } from 'lucide-react'
import Link from 'next/link'

const tiers = [
  {
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 'Free',
    period: '',
    icon: Rocket,
    iconColor: 'text-success',
    iconBg: 'bg-success-50 dark:bg-success-950/50',
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
    iconColor: 'text-primary',
    iconBg: 'bg-primary-50 dark:bg-primary-950/50',
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
    iconColor: 'text-ai',
    iconBg: 'bg-ai-50 dark:bg-ai-950/50',
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
    <section
      id="pricing"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-background-surface relative overflow-hidden"
    >
      {/* Subtle Background */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-subtle text-text-secondary text-sm font-medium mb-6">
            Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary tracking-tightest mb-6">
            Start free, scale as you grow
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto leading-relaxed font-sans">
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
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                      <Crown className="w-3 h-3" />
                      Popular
                    </div>
                  </div>
                )}

                <div
                  className={`h-full rounded-2xl p-8 ${
                    tier.highlighted
                      ? 'bg-background-surface border-2 border-primary-200 shadow-lg'
                      : 'bg-background-surface border border-border-default hover:border-border-strong shadow-sm hover:shadow-lg hover:-translate-y-1'
                  } transition-all duration-300`}
                >
                  {/* Icon & Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className={`w-10 h-10 ${tier.iconBg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${tier.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-text-primary tracking-tight">{tier.name}</h3>
                      <p className="text-sm text-text-tertiary">{tier.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl font-display font-bold text-text-primary tracking-tight">{tier.price}</span>
                    {tier.period && (
                      <span className="text-text-tertiary text-sm">{tier.period}</span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link href="/signup" className="block mb-8">
                    <Button
                      className={`w-full rounded-xl py-2.5 h-auto font-medium text-sm transition-all duration-200 ${
                        tier.highlighted
                          ? 'btn-primary-gradient'
                          : 'bg-background-subtle hover:bg-background-muted text-text-primary'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>

                  {/* Features */}
                  <div className="space-y-4">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            tier.highlighted ? 'text-primary' : 'text-success'
                          }`}
                        />
                        <span className="text-sm text-text-secondary">{feature}</span>
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
          className="text-center text-sm text-text-tertiary mt-14"
        >
          14-day free trial • No credit card required • Cancel anytime
        </motion.p>
      </div>
    </section>
  )
}
