'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const tiers = [
  {
    number: '01',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 'Free',
    originalPrice: null,
    period: '',
    priceDetail: "(seriously, it's free forever)",
    features: [
      { text: 'Up to **3** active job postings', highlight: false },
      { text: 'AI Job Description Generator', highlight: false },
      { text: 'Basic AI Resume Screening', highlight: false },
      { text: 'Candidate portal with Resume Builder', highlight: false },
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    number: '02',
    name: 'Pro',
    description: 'For growing teams who need more power',
    price: 'NPR 4000',
    originalPrice: 'NPR 6000',
    period: '/month',
    priceDetail: '~NPR 130/day',
    features: [
      { text: '**Unlimited** job postings', highlight: true },
      { text: 'Advanced semantic screening', highlight: true },
      { text: 'Automated Interview Scheduling', highlight: true },
      { text: 'Offer letter automation', highlight: false },
      { text: 'Priority support', highlight: false },
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    number: '03',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 'Custom',
    originalPrice: null,
    period: '',
    priceDetail: "(we'll actually talk to you)",
    features: [
      { text: 'RAG-based talent pool search', highlight: true },
      { text: 'Speech-to-text interview analysis', highlight: true },
      { text: 'Custom bias & fairness reporting', highlight: false },
      { text: 'Dedicated account manager', highlight: false },
    ],
    cta: "Let's Talk",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-24 lg:py-32 px-6 lg:px-8 bg-background-surface relative overflow-hidden"
    >
      {/* Decorative separators */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header - Asymmetric & Opinionated */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left max-w-2xl"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary tracking-tightest mb-6">
              Start free.
              <br />
              <span className="text-text-secondary">Grow when ready.</span>
            </h2>
            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed font-sans max-w-lg">
              No BS pricing. Pick a plan, start hiring.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block pb-4"
          >
            <p className="text-text-tertiary italic">
              All plans include semantic matching. <br />
              We don't gate the important stuff.
            </p>
          </motion.div>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const isPro = tier.highlighted

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative group ${isPro ? 'lg:-mt-4 lg:mb-4' : ''}`}
              >
                <div
                  className={`
                    relative h-full rounded-2xl p-8 transition-all duration-300
                    ${
                      isPro
                        ? 'bg-primary-50/30 dark:bg-primary-900/10 border-l-4 border-l-primary shadow-xl scale-[1.02]'
                        : 'bg-background-surface border border-border-default hover:border-border-strong shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  {/* Header with Hand-drawn Number */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-display font-bold text-text-primary tracking-tight">
                        {tier.name}
                      </h3>
                      <p className="text-sm text-text-tertiary mt-1">{tier.description}</p>
                    </div>
                    <div
                      className={`
                      w-12 h-12 flex items-center justify-center text-xl font-display font-bold rounded-full border-2 
                      ${isPro ? 'border-primary text-primary bg-white dark:bg-background' : 'border-border-default text-text-tertiary'}
                    `}
                      style={{ borderRadius: '55% 45% 60% 40% / 50% 60% 30% 70%' }}
                    >
                      {tier.number}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      {tier.originalPrice && (
                        <span className="text-lg text-text-muted line-through font-medium">
                          {tier.originalPrice}
                        </span>
                      )}
                      <span className="font-display font-bold text-text-primary tracking-tight text-4xl">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-text-tertiary text-sm font-medium">
                          {tier.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-tertiary mt-2 font-medium">
                      {tier.priceDetail}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className={`text-lg leading-none mt-0.5 ${feature.highlight ? 'text-primary' : 'text-text-tertiary'}`}
                        >
                          ↳
                        </span>
                        <span
                          className="text-sm text-text-secondary leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: feature.text.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="text-text-primary font-semibold">$1</strong>'
                            ),
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    {isPro ? (
                      <Link href="/signup" className="block">
                        <Button className="w-full btn-primary-gradient rounded-xl py-6 h-auto font-semibold text-base shadow-primary group">
                          {tier.cta}
                          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    ) : tier.name === 'Enterprise' ? (
                      <Link href="/contact" className="block text-center group">
                        <span className="text-text-primary font-bold border-b-2 border-primary/20 group-hover:border-primary transition-colors pb-1">
                          {tier.cta}
                        </span>
                      </Link>
                    ) : (
                      <Link href="/signup" className="block">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl py-6 h-auto font-medium text-base hover:bg-background-subtle border-border-strong text-text-primary"
                        >
                          {tier.cta}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-lg text-text-secondary mt-16 font-sans"
        >
          Try it free for 14 days. No card needed.{' '}
          <strong className="text-text-primary">Actually cancel anytime</strong> (we mean it).
        </motion.p>
      </div>
    </section>
  )
}
