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
    badge: 'Candidates & Companies',
    planName: 'Free',
    currency: 'NPR',
    amount: '0',
    period: 'forever',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Get Started',
    ctaHref: '/signup',
    features: [
      { text: 'Build profile & multiple resumes', included: true },
      { text: 'Browse & apply to all active jobs', included: true },
      { text: 'AI resume gap analysis on apply', included: true },
      { text: 'Live application pipeline tracking', included: true },
      { text: 'Register company & post jobs', included: true },
      { text: 'AI screening engine', included: false },
      { text: 'AI outreach email drafting', included: false },
    ],
  },
  {
    id: 'company',
    badge: 'For Companies',
    planName: 'Company',
    currency: 'NPR',
    amount: '499',
    period: '/ mo · per company',
    featured: true,
    ctaVariant: 'filled',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    features: [
      { text: 'Everything in Free — for your whole team', included: true },
      { text: 'AI screening engine (auto or batch)', included: true },
      { text: 'Candidate scoring, ranking & AI feedback', included: true },
      { text: 'AI-assisted bulk shortlisting with threshold', included: true },
      { text: 'Cal.com interview scheduling for all recruiters', included: true },
      { text: 'AI outreach email drafting', included: false },
      { text: 'Recruiter AI Chat', included: false },
    ],
  },
  {
    id: 'business',
    badge: 'For Growing Teams',
    planName: 'Business',
    currency: 'NPR',
    amount: '1,499',
    period: '/ mo · per company',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Contact Sales',
    ctaHref: 'https://wa.me/9779823527078',
    ctaExternal: true,
    features: [
      { text: 'Everything in Company — for your whole team', included: true },
      { text: 'AI outreach email drafting & review pipeline', included: true },
      { text: 'Recruiter AI Chat (candidate search, salary research)', included: true },
      { text: 'AI job creation assistant', included: true },
      { text: 'Multi-recruiter team & role management', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority support', included: true },
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
    <section className="pricing" id="pricing">
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
          <h2 className="pricing__title" data-reveal>
            Simple, Transparent Pricing
          </h2>
          <p
            className="pricing__subtitle"
            data-reveal
            style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}
          >
            Free for candidates and companies to get started. Company plans unlock AI hiring tools
            for your entire team — one subscription, every recruiter covered.
          </p>
        </header>

        {/* Cards — staggered scale-fade */}
        <div className="pricing__grid">
          {TIERS.map((tier, i) => (
            <div
              key={tier.id}
              className={`pricing__card-wrap${tier.featured ? ' pricing__card-wrap--featured' : ''}`}
              data-reveal="scale"
              style={{ '--reveal-delay': `${i * 0.12}s` } as React.CSSProperties}
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
