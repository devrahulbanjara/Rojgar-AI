import React from 'react'
import type { Application, ApplicationStatus } from '../../types/application'
import { formatDistanceToNow } from 'date-fns'
import { Clock, Eye, Gift } from 'lucide-react'

interface ApplicationTrackingCardProps {
  application: Application
}

export const ApplicationTrackingCard: React.FC<ApplicationTrackingCardProps> = ({
  application,
}) => {
  const formattedDate = `Applied ${formatDistanceToNow(new Date(application.applied_date), { addSuffix: true }).replace('about ', '').replace(' ago', '')} ago`

  const getStatusInfo = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return {
          icon: Clock,
          label: 'Applied',
          bgClass: 'bg-info-50',
          textClass: 'text-info-600',
        }
      case 'interviewing':
        return {
          icon: Eye,
          label: 'Interviewing',
          bgClass: 'bg-info-50',
          textClass: 'text-info-600',
        }
      case 'outcome':
        return {
          icon: Gift,
          label: 'Outcome',
          bgClass: 'bg-success-50',
          textClass: 'text-success-600',
        }
      default:
        return {
          icon: Clock,
          label: 'Applied',
          bgClass: 'bg-info-50',
          textClass: 'text-info-600',
        }
    }
  }

  const statusInfo = getStatusInfo(application.status)
  const StatusIcon = statusInfo.icon

  return (
    <article className="bg-background-surface rounded-xl border border-border-default p-5 transition-all duration-200 hover:border-border-strong cursor-pointer group hover:shadow-md hover:-translate-y-0.5">
      {/* Job Title */}
      <h4 className="font-semibold text-base text-text-primary mb-2 leading-tight group-hover:text-primary transition-colors">
        {application.job_title}
      </h4>

      {/* Company Name */}
      <p className="text-sm text-text-secondary mb-4">{application.company_name}</p>

      {/* Status Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-4 ${statusInfo.bgClass} ${statusInfo.textClass}`}
        role="status"
        aria-label={`Application status: ${statusInfo.label}`}
      >
        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{statusInfo.label}</span>
      </div>

      {/* Timestamp - Footer with border */}
      <div className="pt-3 mt-3 border-t border-border-subtle">
        <time
          className="text-xs text-text-muted"
          dateTime={application.applied_date}
          title={`Applied on ${new Date(application.applied_date).toLocaleDateString()}`}
        >
          {formattedDate}
        </time>
      </div>
    </article>
  )
}

ApplicationTrackingCard.displayName = 'ApplicationTrackingCard'
