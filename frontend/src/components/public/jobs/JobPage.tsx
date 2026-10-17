import Link from 'next/link'

import { jobFacts } from '@/lib/jobFormat'
import { getT } from '@/lib/i18n/server'
import type { ApplySource, PublicJob } from '@/lib/publicApi'

import { Button } from '@/components/ui/button'

import { BusinessName } from '../shared/BusinessName'
import { ApplyForm } from './ApplyForm'

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-2 pl-5 text-[0.95rem] leading-relaxed text-foreground [list-style:disc]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export async function JobPage({
  job,
  source,
  refToken,
}: {
  job: PublicJob
  source: ApplySource
  refToken?: string
}) {
  const t = await getT()
  const suggestHref = `/jobs/${job.slug}/suggest${refToken ? `?ref=${encodeURIComponent(refToken)}` : ''}`

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:pt-14">
        <header className="flex flex-col gap-4">
          <BusinessName company={job.company} t={t} />
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            {job.title}
          </h1>
          <p className="text-sm text-muted-foreground">{jobFacts(job, t).join(' · ')}</p>
          <Button asChild size="lg" className="w-full sm:w-fit lg:hidden">
            <a href="#apply">{t.common.apply}</a>
          </Button>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <article className="flex flex-col gap-8">
            {job.overview ? (
              <p className="text-[0.95rem] leading-relaxed whitespace-pre-line text-foreground">
                {job.overview}
              </p>
            ) : null}
            <List title={t.job.whatYouDo} items={job.responsibilities} />
            <List title={t.job.whatYouNeed} items={job.requirements} />
            <List title={t.job.niceToHave} items={job.preferred_qualifications} />
            <List title={t.job.benefits} items={job.benefits} />

            <section className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-5">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t.job.knowSomeone}
              </h2>
              <Button asChild variant="outline">
                <Link href={suggestHref}>{t.job.suggest}</Link>
              </Button>
            </section>
            <Link
              href={`/c/${job.company.slug}`}
              className="w-fit text-sm font-medium text-primary hover:underline"
            >
              {t.job.moreJobs(job.company.name)}
            </Link>
          </article>

          <aside
            id="apply"
            className="scroll-mt-24 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24"
          >
            <ApplyForm
              slug={job.slug}
              companyName={job.company.name}
              questions={job.screening_questions.slice(0, 3)}
              source={source}
              refToken={refToken}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

/** schema.org JobPosting so the post can show up in Google for Jobs. */
export function JobPostingJsonLd({ job, url }: { job: PublicJob; url: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: [job.overview, ...job.responsibilities, ...job.requirements]
      .filter(Boolean)
      .join('\n'),
    datePosted: job.posted_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.website_url ?? undefined,
      logo: job.company.logo_url ?? undefined,
    },
    jobLocationType: job.location_type === 'remote' ? 'TELECOMMUTE' : undefined,
    jobLocation: job.location
      ? {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'NP' },
        }
      : undefined,
    baseSalary:
      job.salary_min || job.salary_max
        ? {
            '@type': 'MonetaryAmount',
            currency: job.currency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salary_min ?? undefined,
              maxValue: job.salary_max ?? undefined,
              unitText: 'MONTH',
            },
          }
        : undefined,
    url,
  }
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; content is our own JSON with "<" escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
