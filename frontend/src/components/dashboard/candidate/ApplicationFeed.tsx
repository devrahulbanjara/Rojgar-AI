import React from 'react'
import { Inbox, ArrowRight } from 'lucide-react'
import { ApplicationFeedCard } from './ApplicationFeedCard'

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

interface ApplicationFeedProps {
  applications: ApplicationData[]
  maxVisible?: number
}

export function ApplicationFeed({ applications, maxVisible = 8 }: ApplicationFeedProps) {
  // Sort by most recently updated first
  const sorted = [...applications].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  const visible = sorted.slice(0, maxVisible)
  const remaining = sorted.length - maxVisible

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="p-5 bg-background-surface rounded-full border-2 border-dashed border-border-default text-text-muted">
          <Inbox className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-text-secondary">No applications yet</p>
          <p className="text-sm text-text-tertiary">
            Start exploring jobs and submit your first application!
          </p>
        </div>
        <a
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Browse Jobs <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">
          Your Applications
        </h2>
        <span className="text-xs font-semibold text-text-muted">{applications.length} total</span>
      </div>
      <div className="space-y-3">
        {visible.map(app => (
          <ApplicationFeedCard key={app.application_id} app={app} />
        ))}
      </div>
      {remaining > 0 && (
        <div className="text-center pt-2">
          <a
            href="/candidate/dashboard"
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            View {remaining} more →
          </a>
        </div>
      )}
    </div>
  )
}
