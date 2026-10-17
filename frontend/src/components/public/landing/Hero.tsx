import Link from 'next/link'

import type { Dict } from '@/lib/i18n'

import { Button } from '@/components/ui/button'

import { ApplicantsPreview } from './ApplicantsPreview'

export function Hero({ t }: { t: Dict }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <div className="flex flex-col items-start gap-6">
        <h1 className="font-heading text-4xl leading-[1.15] font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.25rem]">
          {t.landing.headline}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">{t.landing.sub}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup?role=company">{t.landing.cta}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how">{t.landing.ctaSecondary}</Link>
          </Button>
        </div>
      </div>

      <ApplicantsPreview t={t} />
    </section>
  )
}
