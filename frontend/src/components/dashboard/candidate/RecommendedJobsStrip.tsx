import React from 'react'
import { Navigation, Zap, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'

interface RecommendedJob {
  job_id: string
  title: string
  organization_name: string
  location_city?: string
  employment_type?: string
  match_score?: number
}

interface RecommendedJobsStripProps {
  jobs: RecommendedJob[]
  loading?: boolean
}

export function RecommendedJobsStrip({ jobs, loading }: RecommendedJobsStripProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider px-1">
          Recommended For You
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] h-[140px] rounded-xl bg-background-muted animate-pulse border border-border-subtle"
            />
          ))}
        </div>
      </div>
    )
  }

  if (jobs.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">
          Recommended For You
        </h2>
        <a
          href="/candidate/jobs"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {jobs.slice(0, 4).map(job => (
          <a
            key={job.job_id}
            href={`/candidate/jobs/${job.job_id}`}
            className="flex-shrink-0 w-[280px] group"
          >
            <Card className="border-border-default hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 h-full">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-text-primary leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest truncate">
                    {job.organization_name}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  {job.location_city && (
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-text-muted" />
                      {job.location_city}
                    </span>
                  )}
                  {job.employment_type && (
                    <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0">
                      {job.employment_type}
                    </Badge>
                  )}
                </div>

                {typeof job.match_score === 'number' && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <div className="flex-1 h-1 bg-background-muted rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(job.match_score, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-text-secondary">
                      {job.match_score}% match
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
