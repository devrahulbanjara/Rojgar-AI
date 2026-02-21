import React, { useEffect, useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { STATUS_CONFIG, COLUMN_MAPPING } from '@/utils/statusStyles'
import { Briefcase, Video, Trophy, MapPin, Building2, Clock } from 'lucide-react'
import { SkeletonDashboardColumn } from '../common/SkeletonLoader'
import { Badge } from '../ui/badge'

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <BoardColumn
          title="Applied"
          count={columns.Applied.length}
          icon={<Briefcase className="w-4 h-4" />}
        >
          <div className="space-y-4">
            {columns.Applied.map(app => (
              <ApplicationCard key={app.application_id} app={app} color="primary" />
            ))}
            {columns.Applied.length === 0 && (
              <EmptyState message="No active applications" icon={<Briefcase />} />
            )}
          </div>
        </BoardColumn>

        <BoardColumn
          title="Interviewing"
          count={columns.Interviewing.length}
          icon={<Video className="w-4 h-4" />}
        >
          <div className="space-y-4">
            {columns.Interviewing.map(app => (
              <ApplicationCard key={app.application_id} app={app} color="purple" />
            ))}
            {columns.Interviewing.length === 0 && (
              <EmptyState message="No interviews yet" icon={<Video />} />
            )}
          </div>
        </BoardColumn>

        <BoardColumn
          title="Outcome"
          count={columns.Outcome.length}
          icon={<Trophy className="w-4 h-4" />}
        >
          <div className="space-y-4">
            {columns.Outcome.map(app => (
              <ApplicationCard key={app.application_id} app={app} color="emerald" />
            ))}
            {columns.Outcome.length === 0 && (
              <EmptyState message="No outcomes yet" icon={<Trophy />} />
            )}
          </div>
        </BoardColumn>
      </div>
    </div>
  )
}

function BoardColumn({
  title,
  count,
  icon,
  children,
}: {
  title: string
  count: number
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-background-surface border shadow-sm text-text-muted">
            {icon}
          </div>
          <h2 className="text-[13px] font-bold text-text-tertiary uppercase tracking-widest">
            {title}
          </h2>
        </div>
        <Badge
          variant="secondary"
          className="bg-background-muted dark:bg-background-subtle text-text-secondary font-bold h-5 px-2"
        >
          {count}
        </Badge>
      </div>

      <div className="flex-1 rounded-xl bg-background-subtle/50 dark:bg-background-muted/30 border-2 border-dashed border-border-default p-3">
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  )
}

function ApplicationCard({
  app,
  color,
}: {
  app: ApplicationResponse
  color: 'primary' | 'purple' | 'emerald'
}) {
  const statusStyle = STATUS_CONFIG[app.current_status] || STATUS_CONFIG.applied

  const borderColorMap = {
    primary: 'border-l-primary-600',
    purple: 'border-l-purple-600',
    emerald: 'border-l-emerald-600',
  }

  return (
    <div
      className={`bg-background-surface border border-border-default/60 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer overflow-hidden relative p-5 rounded-xl border-l-[3px] ${borderColorMap[color]} group`}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-primary leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {app.job.title}
          </h3>
          <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
            {app.organization.name}
          </p>
        </div>

        <div className="space-y-2">
          {app.job.location_city && (
            <div className="flex items-center gap-2 text-[13px] text-text-secondary font-medium">
              <MapPin className="w-4 h-4 text-text-muted" /> {app.job.location_city}
            </div>
          )}
          {app.job.employment_type && (
            <div className="flex items-center gap-2 text-[13px] text-text-secondary font-medium">
              <Building2 className="w-4 h-4 text-text-muted" /> {app.job.employment_type}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-tertiary uppercase tracking-tighter">
            <Clock className="w-3.5 h-3.5" />{' '}
            {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
          </div>
          <Badge
            className={`${statusStyle.color.replace('border', 'bg').replace('500', '50')} ${statusStyle.color.replace('border', 'text').replace('500', '600')} dark:${statusStyle.color.replace('border', 'bg').replace('500', '950/30')} dark:${statusStyle.color.replace('border', 'text').replace('500', '400')} border-none text-[10px] font-bold px-2 py-0`}
          >
            {statusStyle.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
      <div className="p-4 bg-background-surface rounded-full border border-dashed border-border-default text-text-muted">
        {icon && <div className="scale-125">{icon}</div>}
      </div>
      <p className="text-sm font-medium text-text-tertiary">{message}</p>
    </div>
  )
}
