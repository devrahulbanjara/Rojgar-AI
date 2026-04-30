'use client'
import { useState } from 'react'

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
  isCredits?: boolean
}

type ViewMode = 'candidates' | 'companies'

// ── Data ───────────────────────────────────────────────────────────────────

const CANDIDATE_TIERS: PricingTier[] = [
  {
    id: 'candidate-free',
    badge: 'For Everyone',
    planName: 'Free',
    currency: 'NPR',
    amount: '0',
    period: '',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Get Started',
    ctaHref: '/signup',
    features: [
      { text: 'Create profile + AI resume import (1 time)', included: true },
      { text: 'Up to 2 resumes, PDF download', included: true },
      { text: 'Browse all jobs', included: true },
      { text: 'Up to 5 active applications', included: true },
      { text: 'Basic application tracking + see AI score & feedback', included: true },
    ],
  },
  {
    id: 'candidate-pro',
    badge: 'Pay once, not monthly',
    planName: 'Pro',
    currency: 'NPR',
    amount: '199',
    period: 'one-time',
    featured: true,
    ctaVariant: 'filled',
    cta: 'Buy Pro',
    ctaHref: '/signup',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited applications', included: true },
      { text: 'AI resume import (3 uses)', included: true },
      { text: 'Up to 5 resumes', included: true },
      { text: 'Resume Gap Analysis (5 uses)', included: true },
      { text: 'Resume AI patch suggestions (3 uses)', included: true },
    ],
  },
  {
    id: 'candidate-credits',
    badge: 'Top-up Credits',
    planName: 'À la carte',
    currency: '',
    amount: '',
    period: '',
    featured: false,
    ctaVariant: 'outline',
    cta: 'Buy Credits',
    ctaHref: '/signup',
    isCredits: true,
    features: [
      { text: 'Gap Analysis — NPR 49/use', included: true },
      { text: 'Resume AI Patch — NPR 69/use', included: true },
      { text: 'AI Resume Import — NPR 49/use', included: true },
    ],
  },
]

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
    ctaHref: '/signup',
    features: [
      { text: '1 admin, up to 2 recruiters', included: true },
      { text: '2 active jobs', included: true },
      { text: 'Manual pipeline management', included: true },
      { text: 'AI job draft assistant (3/month)', included: true },
      { text: 'Outreach email drafting (10/month)', included: true },
    ],
  },
  {
    id: 'company-growth',
    badge: 'Most Popular',
    planName: 'Growth',
    currency: 'NPR',
    amount: '3,999',
    period: '/ month',
    featured: true,
    ctaVariant: 'filled',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    features: [
      { text: 'Up to 5 recruiters', included: true },
      { text: 'Up to 8 active jobs', included: true },
      { text: 'AI screening on all applications (auto-score)', included: true },
      { text: 'Unlimited job draft assistant', included: true },
      { text: 'Unlimited outreach email drafting', included: true },
      {
        text: 'Recruiter AI Chat (candidate search, salary research, job lookup, job edits)',
        included: true,
      },
      { text: 'Full team management', included: true },
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
      { text: 'Bulk shortlisting suggestions', included: true },
      { text: 'Custom branding on candidate emails', included: true },
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
  const [viewMode, setViewMode] = useState<ViewMode>('companies')
  const activeTiers = viewMode === 'candidates' ? CANDIDATE_TIERS : COMPANY_TIERS

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

          {/* View toggle */}
          <div
            className="pricing__toggle"
            data-reveal
            style={{ '--reveal-delay': '0.15s' } as React.CSSProperties}
          >
            <button
              type="button"
              className={`pricing__toggle-btn${viewMode === 'candidates' ? ' pricing__toggle-btn--active' : ''}`}
              onClick={() => setViewMode('candidates')}
              aria-pressed={viewMode === 'candidates'}
            >
              For Candidates
            </button>
            <button
              type="button"
              className={`pricing__toggle-btn${viewMode === 'companies' ? ' pricing__toggle-btn--active' : ''}`}
              onClick={() => setViewMode('companies')}
              aria-pressed={viewMode === 'companies'}
            >
              For Companies
            </button>
          </div>
        </header>

        {/* Cards — staggered scale-fade */}
        <div className="pricing__grid">
          {activeTiers.map((tier) => (
            <div
              key={tier.id}
              className={`pricing__card-wrap${tier.featured ? ' pricing__card-wrap--featured' : ''}${tier.isCredits ? ' pricing__card-wrap--credits' : ''}`}
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
                  {!tier.isCredits && (
                    <div className="pricing__price-row">
                      <span className="pricing__currency">{tier.currency}</span>
                      <span className="pricing__amount">{tier.amount}</span>
                      {tier.period && <span className="pricing__period">{tier.period}</span>}
                    </div>
                  )}
                </div>

                <hr className="pricing__divider" />

                {/* Features */}
                <ul className="pricing__features" aria-label={`${tier.planName} plan features`}>
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="pricing__feature">
                      {!tier.isCredits && (
                        <>
                          {feature.included ? (
                            <CheckIcon className="pricing__feature-icon pricing__feature-icon--check" />
                          ) : (
                            <LockIcon className="pricing__feature-icon pricing__feature-icon--lock" />
                          )}
                        </>
                      )}
                      <span
                        className={`pricing__feature-text${!feature.included ? ' pricing__feature-text--muted' : ''}${tier.isCredits ? ' pricing__feature-text--credits' : ''}`}
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

        {/* Candidate note */}
        {viewMode === 'candidates' && (
          <p className="pricing__note">
            No monthly lock-in. Buy Pro when you&apos;re actively hunting. Top up if you need more.
          </p>
        )}
      </div>
    </section>
  )
}
