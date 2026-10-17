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

const COMPANY_TIERS: PricingTier[] = [
  {
    id: 'company-free',
    badge: 'For Startups',
    planName: 'Free',
    currency: 'NPR',
    amount: '0',
    period: '',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Get Started',
    ctaHref: '/signup?role=company',
    features: [
      { text: '1 admin, up to 2 recruiters', included: true },
      { text: '2 active jobs at a time', included: true },
      { text: 'Manual pipeline management and status tracking', included: true },
      { text: 'AI Job Draft Assistant (3/month)', included: true },
      { text: 'Outreach email drafting (10/month)', included: true },
      { text: 'Company-wide audit log and activity feed', included: true },
    ],
  },
  {
    id: 'company-growth',
    badge: 'For Growing Teams',
    planName: 'Growth',
    currency: 'NPR',
    amount: '3,999',
    period: '/ month',
    featured: true,
    ctaVariant: 'filled',
    cta: 'Get Started',
    ctaHref: '/signup?role=company',
    features: [
      { text: 'Up to 5 recruiters', included: true },
      { text: 'Up to 8 active jobs', included: true },
      { text: 'AI evaluation on all applications (auto-score on submit)', included: true },
      {
        text: 'AI shortlisting (ML scoring + multi-perspective evaluation)',
        included: true,
      },
      { text: 'Unlimited AI Job Draft Assistant with salary research', included: true },
      { text: 'Unlimited outreach drafting with approve-before-send', included: true },
      { text: 'Recruiter AI Chat (candidate search, salary research, job edits)', included: true },
      { text: 'Integrated interview booking with auto-status sync', included: true },
      { text: 'Interview recording transcription + AI evaluation', included: true },
      { text: 'Full team management with join request approval', included: true },
    ],
  },
  {
    id: 'company-scale',
    badge: 'For Scale',
    planName: 'Scale',
    currency: 'NPR',
    amount: '9,999',
    period: '/ month',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Contact Sales',
    ctaHref: 'https://wa.me/9779866121812',
    ctaExternal: true,
    features: [
      { text: 'Up to 15 recruiters', included: true },
      { text: 'Unlimited active jobs', included: true },
      { text: 'Everything in Growth', included: true },
      { text: 'Semantic search across all historical applicants', included: true },
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
  const activeTiers = COMPANY_TIERS

  return (
    <section className="pricing" id="pricing">
      {/* Background SVG - bottom right */}
      <Image
        src="/bg/bg-ui-v5.webp"
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
            Free for job seekers. Plans below are for hiring teams.
          </p>
        </header>

        {/* Cards - staggered scale-fade */}
        <div className="pricing__grid">
          {activeTiers.map((tier) => (
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
                    {tier.period && <span className="pricing__period">{tier.period}</span>}
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
                  className={`btn ${tier.ctaVariant === 'filled' ? 'btn--primary' : 'btn--secondary'} btn--full`}
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
