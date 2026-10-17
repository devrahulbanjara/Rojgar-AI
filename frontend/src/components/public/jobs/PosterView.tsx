import Link from 'next/link'

import { getT } from '@/lib/i18n/server'
import { salaryLabel } from '@/lib/jobFormat'
import type { PublicJob } from '@/lib/publicApi'

import { Logo } from '@/components/app/Logo'
import { CheckCircleIcon, PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

import { PosterQr, PrintButton } from './PosterParts'

// A4 with no browser margins; the sheet sets its own padding. The legacy
// `.page` min-height would otherwise push a blank second page.
const PRINT_CSS = `@page { size: A4; margin: 0 }
@media print { main.page { min-height: 0 } body { background: #fff } }`

/** Printable A4 poster: business, job, three needs, salary, a big QR and a phone number. */
export async function PosterView({ job, applyUrl }: { job: PublicJob; applyUrl: string }) {
  const t = await getT()
  const salary = job.salary_min || job.salary_max ? salaryLabel(job, t) : null
  const needs = job.must_haves.slice(0, 3)
  const shortUrl = applyUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-background px-4 py-6 print:block print:min-h-0 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/jobs/${job.slug}`}>{t.poster.back}</Link>
        </Button>
        <PrintButton />
      </div>

      <article className="flex w-full max-w-[210mm] flex-col gap-6 rounded-2xl border-2 border-foreground bg-white p-6 text-black sm:gap-8 sm:p-12 print:h-[297mm] print:w-[210mm] print:max-w-none print:gap-8 print:rounded-none print:border-0 print:p-[16mm]">
        <header className="flex flex-col gap-2 border-b-2 border-black pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-heading text-2xl font-bold sm:text-3xl print:text-3xl">
              {job.company.name}
            </p>
            {job.company.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-black px-2.5 py-0.5 text-sm font-semibold">
                <CheckCircleIcon className="size-4" weight="fill" aria-hidden="true" />
                {t.common.verified}
              </span>
            ) : null}
          </div>
          <h1 className="font-heading text-4xl leading-tight font-bold text-balance sm:text-6xl print:text-6xl">
            {job.title}
          </h1>
          {job.location ? <p className="text-lg sm:text-xl">{job.location}</p> : null}
        </header>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start print:grid-cols-1 print:items-start">
          <div className="flex flex-col gap-5">
            {needs.length ? (
              <section>
                <h2 className="text-sm font-semibold tracking-wide uppercase">
                  {t.poster.requirements}
                </h2>
                <ul className="mt-2 flex flex-col gap-2 text-lg leading-snug sm:text-xl print:text-xl">
                  {needs.map((need) => (
                    <li key={need} className="flex gap-2">
                      <span aria-hidden="true">✓</span>
                      <span>{need}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {salary ? (
              <section>
                <h2 className="text-sm font-semibold tracking-wide uppercase">{t.poster.salary}</h2>
                <p className="mt-1 font-heading text-2xl font-bold">{salary}</p>
              </section>
            ) : null}
            {job.company.phone ? (
              <p className="flex items-center gap-2 text-xl font-semibold">
                <PhoneIcon className="size-6" aria-hidden="true" />
                {t.poster.call}: {job.company.phone}
              </p>
            ) : null}
          </div>

          <div className="mx-auto flex w-full max-w-[75mm] flex-col items-center gap-3 text-center sm:w-[75mm] print:mx-0 print:w-full print:max-w-none print:flex-row print:gap-8 print:text-left">
            <div className="w-full rounded-xl border-2 border-black p-2 print:w-[85mm] print:shrink-0">
              <PosterQr url={applyUrl} />
            </div>
            <div className="flex flex-col gap-3 print:gap-6">
            <p className="font-heading text-xl leading-tight font-bold print:text-3xl" lang="ne">
              {t.poster.scanNe}
              <span className="block text-base font-semibold print:text-xl">{t.poster.noAccountNe}</span>
            </p>
            <p className="font-heading text-xl leading-tight font-bold print:text-3xl" lang="en">
              {t.poster.scanEn}
              <span className="block text-base font-semibold print:text-xl">{t.poster.noAccountEn}</span>
            </p>
            </div>
          </div>
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4 text-sm">
          <span className="break-all">
            {t.poster.orVisit}: <strong>{shortUrl}</strong>
          </span>
          <Logo tone="mono" className="h-6" />
        </footer>
      </article>
    </div>
  )
}
