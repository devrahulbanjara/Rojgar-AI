import Link from 'next/link'

import { closingLabel } from '@/lib/dates'
import { placeLabel, salaryLabel } from '@/lib/jobFormat'
import type { CareersPage } from '@/lib/publicApi'

import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { ArrowRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** A company's open jobs. Companies link to it from their website. */
export function CareersView({ page }: { page: CareersPage }) {
  const { company, jobs } = page
  const facts = [company.location, company.industry].filter(Boolean).join(' · ')

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6 lg:pt-14">
        <header className="flex items-center gap-4">
          <EntityAvatar
            name={company.name}
            src={company.logo_url}
            kind="company"
            className="size-14"
          />
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {company.name}
            </h1>
            {facts ? <p className="text-sm text-muted-foreground">{facts}</p> : null}
          </div>
        </header>

        {company.description ? (
          <p className="mt-6 text-[0.95rem] leading-relaxed text-foreground">
            {company.description}
          </p>
        ) : null}

        <h2 className="mt-10 font-heading text-lg font-semibold text-foreground">
          Open jobs ({jobs.length})
        </h2>

        {jobs.length ? (
          <ul className="mt-4 flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
            {jobs.map((job) => (
              <li key={job.slug}>
                <Link
                  href={`/jobs/${job.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold text-foreground">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[placeLabel(job), salaryLabel(job), closingLabel(job.expires_at)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Link>
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
                      Visit website
                    </a>
                  </Button>
                ) : undefined
              }
            >
              No open jobs right now.
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}
