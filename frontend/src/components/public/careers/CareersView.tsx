import Link from 'next/link'

import { jobFacts } from '@/lib/jobFormat'
import { getT } from '@/lib/i18n/server'
import type { CareersPage } from '@/lib/publicApi'

import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { PhoneIcon, QrIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

import { VerifiedBadge } from '../shared/BusinessName'
import { ShareButton } from '../shared/ShareButton'

/** A business's open jobs. Doubles as the whole web presence of a business with no website. */
export async function CareersView({ page }: { page: CareersPage }) {
  const t = await getT()
  const { company, jobs } = page
  const facts = [company.location, company.industry].filter(Boolean).join(' · ')

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 lg:pt-14">
        <header className="flex items-start gap-4">
          <EntityAvatar
            name={company.name}
            src={company.logo_url}
            kind="company"
            className="size-14"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {company.name}
              </h1>
              {company.verified ? <VerifiedBadge t={t} /> : null}
            </div>
            {facts ? <p className="text-sm text-muted-foreground">{facts}</p> : null}
            {company.phone ? (
              <a
                href={`tel:${company.phone}`}
                className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <PhoneIcon className="size-4" aria-hidden="true" />
                {company.phone}
              </a>
            ) : null}
          </div>
        </header>

        {company.description ? (
          <p className="mt-6 text-[0.95rem] leading-relaxed whitespace-pre-line text-foreground">
            {company.description}
          </p>
        ) : null}

        <h2 className="mt-10 font-heading text-lg font-semibold text-foreground">
          {t.careers.openJobs(jobs.length)}
        </h2>

        {jobs.length ? (
          <ul className="mt-4 flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.slug} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
                <Link href={`/jobs/${job.slug}`} className="group flex flex-col gap-1">
                  <span className="line-clamp-2 font-heading text-base font-semibold text-foreground group-hover:underline">
                    {job.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {jobFacts(job, t).join(' · ')}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={`/jobs/${job.slug}`}>{t.common.apply}</Link>
                  </Button>
                  <ShareButton
                    path={`/jobs/${job.slug}?src=direct`}
                    text={t.careers.shareText(job.title, company.name)}
                  />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/jobs/${job.slug}/poster`}>
                      <QrIcon />
                      {t.common.poster}
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              action={
                company.website_url ? (
                  <Button asChild variant="outline">
                    <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                      {t.careers.website}
                    </a>
                  </Button>
                ) : undefined
              }
            >
              {t.careers.noJobs}
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}
