'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Activity, User, BriefcaseBusiness, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'

interface ActivityEvent {
  id: string
  type: 'application' | 'status_change' | 'job_post' | 'interview_scheduled'
  user: string
  action: string
  target: string
  timestamp: string
  metadata?: Record<string, string>
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/v1/recruiter/stats/recent-activity?limit=10`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setActivities(data || [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [fetchActivities])

  const iconMap: Record<string, React.ReactNode> = {
    application: <User className="w-3.5 h-3.5 text-blue-500" />,
    status_change: <Activity className="w-3.5 h-3.5 text-violet-500" />,
    job_post: <BriefcaseBusiness className="w-3.5 h-3.5 text-emerald-500" />,
    interview_scheduled: <Calendar className="w-3.5 h-3.5 text-amber-500" />,
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-text-tertiary uppercase tracking-wider">
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-background-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {activities.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-3 py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {iconMap[event.type] || <Activity className="w-3.5 h-3.5 text-text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-secondary leading-snug">
                    <span className="font-semibold text-text-primary">{event.user}</span>{' '}
                    {event.action}{' '}
                    <span className="font-semibold text-text-primary">{event.target}</span>
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
