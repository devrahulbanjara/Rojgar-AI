import React from 'react'
import { User, Calendar, FileText, CheckCircle2, Clock, Briefcase } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useRecentActivity, type ActivityItem } from '../../hooks/useRecentActivity'
import { LoadingSpinner } from '../common/LoadingSpinner'

const formatTimestamp = (timestamp: string): { date: string; time: string } => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  let dateStr: string
  if (diffInHours < 24) {
    dateStr = 'Today'
  } else if (diffInHours < 48) {
    dateStr = 'Yesterday'
  } else {
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    dateStr = `${day} ${month}`
  }

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return { date: dateStr, time: timeStr }
}

const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
  switch (type) {
    case 'application':
      return <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
    case 'interview':
      return <Calendar className="w-5 h-5 text-info-600 dark:text-info-400" />
    case 'offer':
      return <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
    case 'job_post':
      return <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
    case 'status_change':
      return <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
    default:
      return <User className="w-5 h-5 text-text-tertiary" />
  }
}

const ActivityColor = ({ type }: { type: ActivityItem['type'] }) => {
  switch (type) {
    case 'application':
      return 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
    case 'interview':
      return 'bg-info-50 dark:bg-info-950/30 border-info-200 dark:border-info-800'
    case 'offer':
      return 'bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800'
    case 'job_post':
      return 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
    case 'status_change':
      return 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800'
    default:
      return 'bg-background-subtle border-border-subtle'
  }
}

export function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity()

  if (isLoading) {
    return (
      <div className="bg-background-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center border border-primary-100 dark:border-primary-900">
              <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
              <p className="text-sm text-text-tertiary">
                Latest updates from your recruitment pipeline
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-surface rounded-2xl border border-border-default shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center border border-primary-100 dark:border-primary-900">
            <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
            <p className="text-sm text-text-tertiary">Latest updates from your recruitment pipeline</p>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-text-tertiary">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {activities.map((activity, index) => {
            const { date, time } = formatTimestamp(activity.timestamp)
            return (
              <div
                key={activity.id}
                className="group p-4 hover:bg-background-subtle transition-colors duration-200 flex items-start gap-4"
              >
                {}
                <div className="flex-shrink-0 w-16 text-right pt-1">
                  <div className="text-sm font-semibold text-text-primary">{date}</div>
                  <div className="text-xs text-text-tertiary">{time}</div>
                </div>

                {}
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm z-10 transition-transform duration-200 group-hover:scale-110',
                      ActivityColor({ type: activity.type })
                    )}
                  >
                    <ActivityIcon type={activity.type} />
                  </div>
                  {}
                  {index < activities.length - 1 && (
                    <div className="absolute top-10 bottom-[-24px] w-px bg-border-default" />
                  )}
                </div>

                {}
                <div className="flex-1 pt-1">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">{activity.user}</span>{' '}
                    <span className="text-text-tertiary">{activity.action}</span>{' '}
                    <span className="font-medium text-primary-600 dark:text-primary-400">
                      {activity.target}
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="p-4 border-t border-border-subtle text-center">
        <button className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/30">
          View All Activity
        </button>
      </div>
    </div>
  )
}
