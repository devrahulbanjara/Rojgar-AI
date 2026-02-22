import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Navigation, BriefcaseBusiness, History, TrendingUp } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Card, CardContent } from '../../ui/card'

interface ApplicationData {
  application_id: string
  current_status: string
  applied_at: string
  updated_at: string
  ai_score?: number
  ai_feedback?: string
  job: {
    job_id: string
    title: string
    location_city?: string
    employment_type?: string
  }
  organization: {
    organization_id: string
    name: string
    organization_logo?: string
  }
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  applied: {
    label: 'Applied',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  interviewing: {
    label: 'Interviewing',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
  },
  outcome: {
    label: 'Outcome',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  offered: {
    label: 'Offered',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
  },
}

export function ApplicationFeedCard({ app }: { app: ApplicationData }) {
  const status = STATUS_STYLES[app.current_status] || STATUS_STYLES.applied

  return (
    <Card className="border-border-default hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Job info */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Title + Org */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {app.job.title}
              </h3>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest truncate">
                {app.organization.name}
              </p>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
              {app.job.location_city && (
                <span className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-text-muted" />
                  {app.job.location_city}
                </span>
              )}
              {app.job.employment_type && (
                <span className="flex items-center gap-1">
                  <BriefcaseBusiness className="w-3.5 h-3.5 text-text-muted" />
                  {app.job.employment_type}
                </span>
              )}
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-text-muted" />
                {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
              </span>
            </div>

            {/* AI Score bar (if available) */}
            {typeof app.ai_score === 'number' && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                <div className="flex-1 h-1.5 bg-background-muted rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(app.ai_score, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-secondary">{app.ai_score}%</span>
              </div>
            )}

            {/* AI Feedback snippet */}
            {app.ai_feedback && (
              <p className="text-xs text-text-tertiary line-clamp-2 italic">
                &ldquo;{app.ai_feedback}&rdquo;
              </p>
            )}
          </div>

          {/* Right: Status badge */}
          <Badge
            className={`${status.bg} ${status.text} border-none text-[10px] font-bold px-2 py-0.5 whitespace-nowrap`}
          >
            {status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
