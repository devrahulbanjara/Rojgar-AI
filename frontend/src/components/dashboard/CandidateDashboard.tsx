import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar } from './candidate/StatusBar'
import { NeedsAttention } from './candidate/NeedsAttention'
import { ApplicationFeed } from './candidate/ApplicationFeed'
import { RecommendedJobsStrip } from './candidate/RecommendedJobsStrip'

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
  ai_score?: number
  ai_feedback?: string
  job: JobSummary
  organization: OrganizationSummary
}

interface RecommendedJob {
  job_id: string
  title: string
  organization_name: string
  location_city?: string
  employment_type?: string
  match_score?: number
}

export default function CandidateDashboard() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(true)
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

  const fetchRecommendations = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/v1/jobs/recommendations?limit=4`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      // Map from job list response format
      const mapped: RecommendedJob[] = (data.jobs || []).map((j: Record<string, unknown>) => ({
        job_id: j.job_id,
        title: j.title,
        organization_name: (j.organization as Record<string, string>)?.name || '',
        location_city: j.location_city,
        employment_type: j.employment_type,
      }))
      setRecommendations(mapped)
    } catch {
      // Silently fail — recommendations are optional
    } finally {
      setRecsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
    fetchRecommendations()
  }, [fetchApplications, fetchRecommendations])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        fetchApplications()
        fetchRecommendations()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fetchApplications, fetchRecommendations])

  const hasProfile = true // TODO: wire to actual profile check
  const hasResume = true // TODO: wire to actual resume count
  const hasPendingInterview = applications.some(a => a.current_status === 'interviewing')

  if (error) {
    return <div className="text-center p-20 text-error">Failed to load applications.</div>
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-8 pb-10">
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-20 rounded-xl bg-background-muted animate-pulse border border-border-subtle"
            />
          ))}
        </div>
        {/* Skeleton feed */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 rounded-xl bg-background-muted animate-pulse border border-border-subtle"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      {/* Tier 1: Status Bar */}
      <StatusBar applications={applications} />

      {/* Tier 2: Needs Attention */}
      <NeedsAttention
        hasProfile={hasProfile}
        hasResume={hasResume}
        hasPendingInterview={hasPendingInterview}
      />

      {/* Tier 3: Application Feed */}
      <ApplicationFeed applications={applications} />

      {/* Tier 4: Recommended Jobs */}
      <RecommendedJobsStrip jobs={recommendations} loading={recsLoading} />
    </div>
  )
}
