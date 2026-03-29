'use client'
import Image from 'next/image'
import Link from 'next/link'

import { Check, Lock } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingTier {
  id: string
  badge: string
  planName: string
  currency: string
  amount: string
  period: string
  features: PricingFeature[]
  cta: string
  ctaHref: string
  ctaExternal?: boolean
  ctaVariant: 'outline' | 'filled'
  featured: boolean
}

// ── Data ───────────────────────────────────────────────────────────────────

const TIERS: PricingTier[] = [
  {
    id: 'free',
    badge: 'Candidates & Employers',
    planName: 'Free',
    currency: 'NPR',
    amount: '0',
    period: 'forever',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Get Started',
    ctaHref: '/signup',
    features: [
      { text: 'Browse & apply to all job listings', included: true },
      { text: 'Create a company profile & post jobs', included: true },
      { text: 'Interview scheduling for candidates', included: true },
      { text: 'AI screening suggestions', included: true },
      { text: 'AI screening engine', included: false },
      { text: 'Auto email sender', included: false },
      { text: 'AI resume builder', included: false },
    ],
  },
  {
    id: 'recruiter',
    badge: 'HR & Recruiters',
    planName: 'Recruiter',
    currency: 'NPR',
    amount: '499',
    period: '/ month',
    featured: true,
    ctaVariant: 'filled',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'AI screening engine', included: true },
      { text: 'Candidate ranking & scoring', included: true },
      { text: 'Advanced search & filters', included: true },
      { text: 'Priority job placement', included: true },
      { text: 'Auto email sender', included: false },
      { text: 'AI resume builder', included: false },
    ],
  },
  {
    id: 'business',
    badge: 'Growing Companies',
    planName: 'Business',
    currency: 'NPR',
    amount: '1,499',
    period: '/ month',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Contact Sales',
    ctaHref: 'https://wa.me/9779823527078',
    ctaExternal: true,
    features: [
      { text: 'Everything in Recruiter', included: true },
      { text: 'Auto email sender', included: true },
      { text: 'AI resume builder', included: true },
      { text: 'AI screening with shortlisting actions', included: true },
      { text: 'Interview scheduling & reminders', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations & API access', included: true },
    ],
  },
]

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return <Check className={className} aria-hidden="true" />
}

function LockIcon({ className }: { className?: string }) {
  return <Lock className={className} aria-hidden="true" />
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Pricing() {
  return (
    <section className="pricing">
      {/* Background SVG — bottom right */}
      <Image
        src="/bg/bg-ui-v5.svg"
        alt=""
        width={680}
        height={680}
        className="pricing__bg"
        aria-hidden="true"
        priority={false}
      />

      <div className="container">
        {/* Section header */}
        <header className="pricing__header">
          <h2 className="pricing__title">Simple, Transparent Pricing</h2>
          <p className="pricing__subtitle">
            Free for everyone to get started — upgrade when your team is ready to hire smarter with
            AI.
          </p>
        </header>

        {/* Cards */}
        <div className="pricing__grid">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`pricing__card-wrap${tier.featured ? ' pricing__card-wrap--featured' : ''}`}
            >
              {tier.featured && (
                <span className="pricing__ribbon" aria-label="Most popular plan">
                  Most Popular
                </span>
              )}

              <div className="pricing__card">
                {/* Head */}
                <div className="pricing__card-head">
                  <span
                    className={`pricing__badge${tier.featured ? ' pricing__badge--featured' : ''}`}
                  >
                    {tier.badge}
                  </span>
                  <h3 className="pricing__plan-name">{tier.planName}</h3>
                  <div className="pricing__price-row">
                    <span className="pricing__currency">{tier.currency}</span>
                    <span className="pricing__amount">{tier.amount}</span>
                    <span className="pricing__period">{tier.period}</span>
                  </div>
                </div>

                <hr className="pricing__divider" />

                {/* Features */}
                <ul className="pricing__features" aria-label={`${tier.planName} plan features`}>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="pricing__feature">
                      {feature.included ? (
                        <CheckIcon className="pricing__feature-icon pricing__feature-icon--check" />
                      ) : (
                        <LockIcon className="pricing__feature-icon pricing__feature-icon--lock" />
                      )}
                      <span
                        className={`pricing__feature-text${!feature.included ? ' pricing__feature-text--muted' : ''}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className={`pricing__cta pricing__cta--${tier.ctaVariant}`}
                  {...(tier.ctaExternal && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
