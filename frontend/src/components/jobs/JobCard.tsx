import React, { memo, useCallback } from 'react'
import { MapPin, DollarSign, Clock, Bookmark } from 'lucide-react'
import { cn } from '../../lib/utils'
import { jobUtils } from '../../services/jobService'
import type { Job } from '../../types/job'
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
} from '../ui'

interface JobCardProps {
  job: Job
  isSelected?: boolean
  onSelect?: (job: Job) => void
  onApply?: (job: Job) => void
  showApplyButton?: boolean
  className?: string
}

const departmentColors: Record<
  string,
  { colorPalette: 'blue' | 'green' | 'orange' | 'cyan' | 'pink' | 'purple' | 'red' | 'gray' }
> = {
  Engineering: { colorPalette: 'blue' },
  Sales: { colorPalette: 'green' },
  Marketing: { colorPalette: 'orange' },
  Product: { colorPalette: 'cyan' },
  Design: { colorPalette: 'pink' },
  'Data Science': { colorPalette: 'purple' },
  HR: { colorPalette: 'red' },
  Default: { colorPalette: 'gray' },
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
    } catch {
      return ''
    }
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
        isSelected &&
          'border-primary ring-1 ring-primary/20 bg-primary-50/5 dark:bg-primary-950/10',
        className
      )}
    >
      <CardHeader className="p-6 pb-0 space-y-4">
        {/* Header Badges & Actions */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2 flex-wrap min-h-6">
            {job.department && (
              <Badge
                variant="subtle"
                colorPalette={deptColor.colorPalette}
                className="h-6 font-semibold"
              >
                {job.department}
              </Badge>
            )}
            <Badge variant="outline" colorPalette="gray" className="h-6 font-normal">
              {job.level || 'Mid-Level'}
            </Badge>
            {job.application_deadline && (
              <Badge variant="subtle" colorPalette="orange" className="h-6">
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
          <Badge variant="subtle" colorPalette="gray" className="font-medium">
            {job.employment_type}
          </Badge>
          <Badge variant="subtle" colorPalette="gray" className="font-medium">
            {job.location_type || 'On-site'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
})

JobCard.displayName = 'JobCard'
