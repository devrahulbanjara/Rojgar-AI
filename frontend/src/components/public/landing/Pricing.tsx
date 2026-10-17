import Link from 'next/link'

import type { Dict } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const TALK_URL = 'https://wa.me/9779866121812'
const FEATURED = 'pass'

export function Pricing({ t }: { t: Dict }) {
  const p = t.landing.pricing
  return (
    <section id="pricing" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">{p.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.plans.map((plan) => {
            const featured = plan.id === FEATURED
            const talk = plan.id === 'volume'
            const period = plan.period === 'job' ? p.perJob : plan.period === 'month' ? p.perMonth : ''
            return (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-col gap-4 rounded-2xl border bg-card p-6',
                  featured && 'border-primary ring-1 ring-primary',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{plan.name}</h3>
                  {featured ? <Badge>{p.popular}</Badge> : null}
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
                  {period ? <span className="text-sm text-muted-foreground">{period}</span> : null}
                </p>
                <p className="flex-1 text-sm text-foreground">{plan.line}</p>
                <Button asChild variant={featured ? 'primary' : 'outline'} className="w-full">
                  {talk ? (
                    <a href={TALK_URL} target="_blank" rel="noopener noreferrer">
                      {p.talk}
                    </a>
                  ) : (
                    <Link href="/signup?role=company">{plan.id === 'first' ? p.start : p.choose}</Link>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{p.payment}</p>
      </div>
    </section>
  )
}
