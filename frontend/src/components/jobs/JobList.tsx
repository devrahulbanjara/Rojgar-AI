import React, { memo, useMemo } from 'react'
import { JobCard } from './JobCard'
import { SkeletonJobCard } from '../common'
import type { Job } from '../../types/job'
import { AlertCircle, Search, Filter } from 'lucide-react'

interface JobListProps {
  jobs: Job[]
  loading?: boolean
  error?: string | null
  selectedJob?: Job | null
  onJobSelect?: (job: Job) => void
  onApply?: (job: Job) => void
}

export const JobList = memo<JobListProps>(
  ({ jobs, loading = false, error, selectedJob, onJobSelect, onApply }) => {
    const uniqueJobs = useMemo(() => {
      if (!jobs) return []
      const seen = new Set()
      return jobs.filter(job => {
        const id = job.id
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }, [jobs])

    if (loading) {
      return (
        <>
          {}
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonJobCard key={index} className="bg-card border border-border rounded-xl" />
          ))}
        </>
      )
    }

    if (error) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-error-50">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to load jobs</h3>
            <p className="text-sm text-text-secondary text-center max-w-md mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:text-primary-700 hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    if (!uniqueJobs || uniqueJobs.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-50">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-text-primary mb-2">No jobs found</h3>
            <p className="text-sm text-text-secondary text-center max-w-md mb-4">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Filter className="w-4 h-4" />
              <span>Try different filters or search terms</span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        {uniqueJobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            isSelected={selectedJob?.id === job.id}
            onSelect={onJobSelect}
            onApply={onApply}
            showApplyButton={false}
          />
        ))}
      </>
    )
  }
)

JobList.displayName = 'JobList'
