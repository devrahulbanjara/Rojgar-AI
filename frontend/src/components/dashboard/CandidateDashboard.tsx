import React, { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { STATUS_CONFIG, COLUMN_MAPPING } from '@/utils/statusStyles'
import { Briefcase, Video, Trophy, MapPin, CalendarClock } from 'lucide-react'
import { SkeletonDashboardColumn } from '../common/SkeletonLoader'

interface JobSummary {
  job_id: string
  title: string
  location_city?: string
  employment_type?: string
}

interface OrganizationSummary {
  organization_id: string
  name: string
  organization_logo?: string
}

interface ApplicationResponse {
  application_id: string
  current_status: string
  applied_at: string
  updated_at: string
  job: JobSummary
  organization: OrganizationSummary
}

export default function CandidateDashboard() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchApplications = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const res = await fetch(`${apiUrl}/api/v1/candidate/applications`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setApplications(data)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        fetchApplications()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [fetchApplications])

  const columns: Record<string, ApplicationResponse[]> = {
    Applied: [],
    Interviewing: [],
    Outcome: [],
  }

  applications.forEach(app => {
    const colKey = COLUMN_MAPPING[app.current_status] || 'Applied'
    if (columns[colKey]) {
      columns[colKey].push(app)
    } else {
      columns['Applied'].push(app)
    }
  })

  if (error) return <div className="text-center p-20 text-error">Failed to load applications.</div>

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Your Applications</h1>
          <p className="text-text-tertiary mt-2 text-lg">Track your job application journey</p>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <SkeletonDashboardColumn
            bgColor="bg-primary-50/50 dark:bg-primary-950/30"
            borderColor="border-primary-200/60 dark:border-primary-800/60"
            iconColor="bg-primary-200 dark:bg-primary-800"
            textColor="bg-border-default"
            badgeColor="bg-primary-100 dark:bg-primary-900/30"
          />
          <SkeletonDashboardColumn
            bgColor="bg-primary-50/50 dark:bg-primary-950/30"
            borderColor="border-primary-200/60 dark:border-primary-800/60"
            iconColor="bg-primary-200 dark:bg-primary-800"
            textColor="bg-border-default"
            badgeColor="bg-primary-100 dark:bg-primary-900/30"
          />
          <SkeletonDashboardColumn
            bgColor="bg-success-50/50 dark:bg-success-950/30"
            borderColor="border-success-200/60 dark:border-success-800/60"
            iconColor="bg-success-200 dark:bg-success-800"
            textColor="bg-border-default"
            badgeColor="bg-success-100 dark:bg-success-900/30"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {}
        <div className="bg-primary-50/50 dark:bg-primary-950/30 rounded-2xl p-6 flex flex-col gap-6 border border-primary-200/60 dark:border-primary-800/60 shadow-sm/50">
          <ColumnHeader
            title="Applied"
            count={columns.Applied.length}
            icon={<Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
            textColor="text-primary-900 dark:text-text-primary"
            badgeColor="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
          />
          <div className="flex-1 flex flex-col gap-4">
            {columns.Applied.map(app => (
              <ApplicationCard key={app.application_id} app={app} />
            ))}
            {columns.Applied.length === 0 && <EmptyState message="No active applications" />}
          </div>
        </div>

        {}
        <div className="bg-ai-50/50 dark:bg-ai-950/30 rounded-2xl p-6 flex flex-col gap-6 border border-ai-200/60 dark:border-ai-800/60 shadow-sm/50">
          <ColumnHeader
            title="Interviewing"
            count={columns.Interviewing.length}
            icon={<Video className="w-5 h-5 text-ai-600 dark:text-ai-400" />}
            textColor="text-ai-900 dark:text-text-primary"
            badgeColor="bg-ai-100 dark:bg-ai-900/30 text-ai-700 dark:text-ai-300"
          />
          <div className="flex-1 flex flex-col gap-4">
            {columns.Interviewing.map(app => (
              <ApplicationCard key={app.application_id} app={app} />
            ))}
            {columns.Interviewing.length === 0 && <EmptyState message="No interviews yet" />}
          </div>
        </div>

        {}
        <div className="bg-success-50/50 dark:bg-success-950/30 rounded-2xl p-6 flex flex-col gap-6 border border-success-200/60 dark:border-success-800/60 shadow-sm/50">
          <ColumnHeader
            title="Outcome"
            count={columns.Outcome.length}
            icon={<Trophy className="w-5 h-5 text-success-600 dark:text-success-400" />}
            textColor="text-success-900 dark:text-success-100"
            badgeColor="bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
          />
          <div className="flex-1 flex flex-col gap-4">
            {columns.Outcome.map(app => (
              <ApplicationCard key={app.application_id} app={app} />
            ))}
            {columns.Outcome.length === 0 && <EmptyState message="No outcomes yet" />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ColumnHeader({
  title,
  count,
  icon,
  textColor,
  badgeColor,
}: {
  title: string
  count: number
  icon: React.ReactNode
  textColor: string
  badgeColor: string
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background-surface/80 flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
      </div>
      <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${badgeColor}`}>
        {count}
      </span>
    </div>
  )
}

function ApplicationCard({ app }: { app: ApplicationResponse }) {
  const statusStyle = STATUS_CONFIG[app.current_status] || STATUS_CONFIG.applied

  const getBorderColorClass = (statusStr: string) => {
    if (statusStr === 'interviewing') return 'border-l-ai-500'
    if (statusStr === 'outcome') return 'border-l-success-500'
    return 'border-l-primary-500'
  }

  const getHoverBorderClass = (statusStr: string) => {
    if (statusStr === 'interviewing') return 'hover:border-ai-200 dark:hover:border-ai-800'
    if (statusStr === 'outcome') return 'hover:border-success-200 dark:hover:border-success-800'
    return 'hover:border-primary-200 dark:hover:border-primary-800'
  }

  return (
    <div
      className={`bg-background-surface p-5 rounded-xl shadow-sm border border-border-default border-l-[4px] ${getBorderColorClass(app.current_status)} ${getHoverBorderClass(app.current_status)} hover:shadow-md transition-all duration-200 cursor-default group`}
    >
      {}
      <div className="mb-4">
        <h4 className="font-bold text-text-primary text-base leading-tight mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {app.job.title}
        </h4>
        <p className="text-sm font-medium text-text-secondary">{app.organization.name}</p>
      </div>

      {}
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mb-4">
        {app.job.location_city && (
          <div className="flex items-center gap-1.5 bg-background-subtle px-2.5 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-medium">{app.job.location_city}</span>
          </div>
        )}
        {app.job.employment_type && (
          <div className="flex items-center gap-1.5 bg-background-subtle px-2.5 py-1 rounded-lg">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="font-medium">{app.job.employment_type}</span>
          </div>
        )}
      </div>

      {}
      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
          <CalendarClock className="w-3.5 h-3.5" />
          {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
        </div>

        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusStyle.color.replace('border', '')} border shadow-sm`}
        >
          {statusStyle.label}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-36 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border-default rounded-xl bg-background-surface/50">
      <div className="w-10 h-10 rounded-full bg-background-subtle flex items-center justify-center mb-3">
        <Briefcase className="w-5 h-5 text-text-muted" />
      </div>
      <div className="text-sm font-medium">{message}</div>
    </div>
  )
}
