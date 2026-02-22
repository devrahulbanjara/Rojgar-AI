'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { BriefcaseBusiness, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'

interface PipelineJob {
  job_id: string
  title: string
  department?: string
  status: string
  application_count?: number
  shortlist_status?: string
  updated_at?: string
}

export function JobsPipelineTable() {
  const [jobs, setJobs] = useState<PipelineJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/v1/recruiter/jobs?status=active&limit=10`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-text-tertiary uppercase tracking-wider">
            Active Jobs Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-background-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <BriefcaseBusiness className="w-4 h-4" />
            Active Jobs Pipeline
          </CardTitle>
          <a
            href="/recruiter/jobs"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {jobs.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">No active jobs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                    Job
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                    Applicants
                  </th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-2 px-2" />
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr
                    key={job.job_id}
                    className="border-b border-border-subtle last:border-0 hover:bg-background-subtle/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate max-w-[200px]">
                          {job.title}
                        </p>
                        {job.department && (
                          <p className="text-xs text-text-muted">{job.department}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-text-muted" />
                        <span className="font-semibold text-text-secondary">
                          {job.application_count ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 capitalize">
                        {job.shortlist_status?.replace('_', ' ') || job.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <a
                        href={`/recruiter/jobs?id=${job.job_id}`}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
