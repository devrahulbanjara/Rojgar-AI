import Link from 'next/link'

import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { CheckIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

type Plan = {
  name: string
  price: string
  period?: string
  features: string[]
  cta: { label: string; href: string; external?: boolean }
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: 'NPR 0',
    features: [
      'Up to 2 open jobs',
      '1 admin and 2 recruiters',
      'Apply link and applicant tracking',
      '10 candidate emails a month',
    ],
    cta: { label: 'Start free', href: '/signup?role=company' },
  },
  {
    name: 'Growth',
    price: 'NPR 3,999',
    period: '/ month',
    featured: true,
    features: [
      'Up to 8 open jobs',
      'Up to 5 recruiters',
      'Every CV read and ranked',
      'Unlimited candidate emails',
      'Interview booking',
    ],
    cta: { label: 'Choose Growth', href: '/signup?role=company' },
  },
  {
    name: 'Scale',
    price: 'NPR 9,999',
    period: '/ month',
    features: [
      'Unlimited open jobs',
      'Up to 15 recruiters',
      'Everything in Growth',
      'Search past applicants',
      'Priority support',
    ],
    cta: { label: 'Talk to us', href: 'https://wa.me/9779866121812', external: true },
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">Pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col gap-6 rounded-2xl border bg-card p-6',
                plan.featured && 'border-primary ring-1 ring-primary',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold text-foreground">{plan.name}</h3>
                {plan.featured ? <Badge>Most teams</Badge> : null}
              </div>
              <p className="flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period ? (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                ) : null}
              </p>
              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.featured ? 'primary' : 'outline'} className="w-full">
                {plan.cta.external ? (
                  <a href={plan.cta.href} target="_blank" rel="noopener noreferrer">
                    {plan.cta.label}
                  </a>
                ) : (
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
