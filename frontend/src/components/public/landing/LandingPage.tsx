import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { Faq } from './Faq'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { Pricing } from './Pricing'
import { Promises } from './Promises'
import { RedirectSignedIn } from './RedirectSignedIn'

export function LandingPage() {
  return (
    <div className="bg-background">
      <RedirectSignedIn />
      <Hero />
      <HowItWorks />
      <Promises />
      <Pricing />
      <Faq />
      <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Your next hire is one link away.
        </h2>
        <Button asChild size="lg">
          <Link href="/signup?role=company">Start hiring free</Link>
        </Button>
      </section>
    </div>
  )
}
