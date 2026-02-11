import React, { memo, useCallback } from 'react'
import { MapPin, DollarSign, Clock, Users, Eye, Bookmark } from 'lucide-react'
import { cn } from '../../lib/utils'
import { jobUtils } from '../../services/jobService'
import type { Job } from '../../types/job'
import { Card, CardContent, CardHeader, Avatar, AvatarFallback, AvatarImage, Badge, Button } from '../ui'

interface JobCardProps {
  job: Job
  isSelected?: boolean
  onSelect?: (job: Job) => void
  onApply?: (job: Job) => void
  showApplyButton?: boolean
  className?: string
}

const departmentColors: Record<string, { bg: string; text: string; border: string }> = {
  Engineering: {
    bg: 'bg-primary-50 text-primary-700 border-primary-100',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-100 dark:border-primary-900/50',
  },
  Sales: {
    bg: 'bg-success-50 text-success-700 border-success-100',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-100 dark:border-success-900/50',
  },
  Marketing: {
    bg: 'bg-warning-50 text-warning-700 border-warning-100',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-100 dark:border-warning-900/50',
  },
  Product: {
    bg: 'bg-info-50 text-info-700 border-info-100',
    text: 'text-info-700 dark:text-info-300',
    border: 'border-info-100 dark:border-info-900/50',
  },
  Design: {
    bg: 'bg-pink-50 text-pink-700 border-pink-100',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-100 dark:border-pink-900/50',
  },
  'Data Science': {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-100 dark:border-indigo-900/50',
  },
  HR: {
    bg: 'bg-rose-50 text-rose-700 border-rose-100',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-100 dark:border-rose-900/50',
  },
  Default: {
    bg: 'bg-background-muted text-text-secondary border-border-subtle',
    text: 'text-text-secondary',
    border: 'border-border-subtle',
  },
}

export const JobCard = memo<JobCardProps>(({ job, isSelected = false, onSelect, className }) => {
  const handleClick = useCallback(() => {
    onSelect?.(job)
  }, [onSelect, job])

  const deptColor = departmentColors[job.department || ''] || departmentColors.Default

  const formatDeadline = (deadline: string): string => {
    if (!deadline) return ''
    try {
      const deadlineDate = new Date(deadline)
      const now = new Date()
      const diffInMs = deadlineDate.getTime() - now.getTime()
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

      if (diffInDays < 0) return 'Expired'
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Tomorrow'
      if (diffInDays <= 7) return `${diffInDays} days`
      return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  const locationDisplay =
    job.location_city && job.location_country
      ? `${job.location_city}, ${job.location_country}`
      : job.location_city || job.location_country || job.location || 'Location not specified'

  const companyName = job.company?.name || 'Company'
  const companyLogo = job.company?.logo

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Bookmark logic
  }

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group cursor-pointer transition-all duration-300 border-border-default hover:border-primary-200 dark:hover:border-primary-800 bg-background-surface hover:shadow-md hover:-translate-y-0.5',
        isSelected && 'border-primary ring-1 ring-primary/20 bg-primary-50/5 dark:bg-primary-950/10',
        className
      )}
    >
      <CardHeader className="p-6 pb-0 space-y-4">
        {/* Header Badges & Actions */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2 flex-wrap min-h-6">
            {job.department && (
              <Badge variant="secondary" className={cn('h-6 font-semibold border-none', deptColor.bg, deptColor.text)}>
                {job.department}
              </Badge>
            )}
            <Badge variant="outline" className="h-6 font-normal text-text-tertiary">
              {job.level || 'Mid-Level'}
            </Badge>
            {job.application_deadline && (
              <Badge variant="outline" className="h-6 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-950/50">
                {formatDeadline(job.application_deadline)}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:text-primary-600 dark:hover:text-primary-400"
            onClick={handleBookmark}
          >
            <Bookmark className="w-4.5 h-4.5" />
          </Button>
        </div>

        {/* Company Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border border-border-subtle bg-background-subtle rounded-xl">
            <AvatarImage src={companyLogo} />
            <AvatarFallback className="bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-400 font-bold">
              {companyName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5 truncate">{companyName}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-5 space-y-6">
        {/* Metadata Grid */}
        <div className="grid gap-2.5 text-sm text-text-secondary">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="truncate">{locationDisplay}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{jobUtils.formatJobSalary(job)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="whitespace-nowrap">
              {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
            </span>
          </div>
        </div>

        {/* Type Badges */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium bg-background-subtle text-text-secondary border-transparent">
            {job.employment_type}
          </Badge>
          <Badge variant="secondary" className="font-medium bg-background-subtle text-text-secondary border-transparent">
            {job.location_type || 'On-site'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
})

JobCard.displayName = 'JobCard'
