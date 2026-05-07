'use client'

import Link from 'next/link'

import { useReveal } from '@/hooks/useReveal'
import { useSearchJobsQuery } from '@/store/services/jobsApi'
import { Briefcase } from 'lucide-react'

import PublicJobCard from '@/components/jobs/PublicJobCard'

function CardSkeleton() {
  return <div className="featured-jobs__skeleton" />
}

export default function FeaturedJobs() {
  const { data, isLoading, isError } = useSearchJobsQuery({ size: 6 })
  const jobs = data?.data?.items ?? []

  // Re-run observer after async cards render
  useReveal()

  if (isError || (!isLoading && jobs.length === 0)) return null

  return (
    <section className="featured-jobs">
      <div className="container">
        <div className="featured-jobs__header">
          <p className="featured-jobs__label" data-reveal>
            Browse Opportunities
          </p>
          <h2
            className="featured-jobs__heading"
            data-reveal
            style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}
          >
            Latest Job Openings
          </h2>
          <p
            className="featured-jobs__subheading"
            data-reveal
            style={{ '--reveal-delay': '0.2s' } as React.CSSProperties}
          >
            Explore active roles from companies hiring right now. Sign in to apply and track your
            progress.
          </p>
        </div>

        {isLoading ? (
          <div className="featured-jobs__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="featured-jobs__grid">
            {jobs.map((job, i) => (
              <div
                key={job.id}
                className="featured-jobs__card-enter"
                style={{ '--stagger': `${i * 0.08}s` } as React.CSSProperties}
              >
                <PublicJobCard job={job} />
              </div>
            ))}
          </div>
        )}

        <div
          className="featured-jobs__cta-wrap"
          data-reveal
          style={{ '--reveal-delay': '0.3s' } as React.CSSProperties}
        >
          <Link href="/jobs" className="btn btn--primary">
            View All Jobs
          </Link>
        </div>

        {/* Empty state - only if loaded but no jobs */}
        {!isLoading && jobs.length === 0 && (
          <div className="featured-jobs__empty">
            <Briefcase style={{ width: 40, height: 40, opacity: 0.3 }} />
            <p>No jobs available right now. Check back soon.</p>
          </div>
        )}
      </div>
    </section>
  )
}
