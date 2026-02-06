import React from 'react'
import { ApplicationTrackingCard } from './ApplicationTrackingCard'
import { Inbox } from 'lucide-react'
import type { Application } from '../../types/application'

interface ApplicationTrackingColumnProps {
  title: string
  description: string
  applications: Application[]
  columnType: 'applied' | 'interviewing' | 'outcome'
}

export const ApplicationTrackingColumn: React.FC<ApplicationTrackingColumnProps> = ({
  title,
  description,
  applications,
  columnType,
}) => {
  const getEmptyStateMessage = () => {
    switch (columnType) {
      case 'applied':
        return 'No applications yet'
      case 'interviewing':
        return 'No interviews scheduled'
      case 'outcome':
        return 'No outcomes yet'
      default:
        return 'No applications'
    }
  }

  const getBorderColor = () => {
    switch (columnType) {
      case 'applied':
        return 'border-info-400'
      case 'interviewing':
        return 'border-primary'
      case 'outcome':
        return 'border-success'
      default:
        return 'border-info-400'
    }
  }

  const getTextColor = () => {
    switch (columnType) {
      case 'applied':
        return 'text-info-600'
      case 'interviewing':
        return 'text-primary'
      case 'outcome':
        return 'text-success'
      default:
        return 'text-info-600'
    }
  }

  const borderColor = getBorderColor()
  const textColor = getTextColor()

  return (
    <section className="flex flex-col">
      {/* Column Header - No background, just border-bottom */}
      <header className={`pb-4 mb-5 border-b-2 ${borderColor}`}>
        <h3 className={`font-semibold text-lg ${textColor} mb-1`}>{title}</h3>
        <p className="text-[13px] text-text-muted">{description}</p>
      </header>

      {/* Column Content */}
      <div className="flex-1 space-y-4 min-h-[200px]">
        {applications.length === 0 ? (
          <div className="bg-background-subtle border border-dashed border-border-default rounded-xl p-8 text-center">
            <Inbox className="h-8 w-8 text-border-strong mx-auto mb-3" />
            <p className="text-sm font-medium text-text-muted">{getEmptyStateMessage()}</p>
          </div>
        ) : (
          applications.map(application => (
            <ApplicationTrackingCard key={application.id} application={application} />
          ))
        )}
      </div>

      {/* Column Footer - Application Count */}
      {applications.length > 0 && (
        <footer className="mt-4 px-4 py-3 bg-background-subtle rounded-lg">
          <p className={`text-[13px] font-semibold ${textColor} text-center`}>
            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
          </p>
        </footer>
      )}
    </section>
  )
}
