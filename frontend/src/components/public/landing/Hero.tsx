import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { ApplicantsPreview } from './ApplicantsPreview'

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <div className="flex flex-col items-start gap-6">
        <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.5rem]">
          Share one link. Meet the best applicants first.
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Post it on LinkedIn, Facebook or Merojob. We read every CV and rank them. You decide.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup?role=company">Start hiring free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how">See how it works</Link>
          </Button>
        </div>
      </div>

      <ApplicantsPreview />
    </section>
  )
}
