import React, { memo } from 'react'
import { MapPin, DollarSign, Clock, Users, Eye, BookmarkPlus, Zap, MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'
import { toast } from 'sonner'
import type { Job } from '../../types/job'
import { Card, CardContent, CardFooter, CardHeader, Avatar, AvatarFallback, AvatarImage, Badge, Button } from '../ui'

interface RecruiterJobCardProps {
  job: Job
  onClick?: () => void
  onConvertToReferenceJD?: () => void
  className?: string
}

function formatSalary(job: Job): string {
  const min = job.salary_range?.min ?? job.salary_min
  const max = job.salary_range?.max ?? job.salary_max
  const currency = job.salary_range?.currency ?? job.salary_currency ?? 'USD'

  if (!min && !max) return 'Competitive'

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${Math.round(num / 1000)}K`
    }
    return num.toString()
  }

  if (min && max) return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`
  if (min) return `${currency} From ${formatNumber(min)}`
  if (max) return `${currency} Up to ${formatNumber(max)}`
  return 'Competitive'
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Recently'
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

function formatDeadline(deadline: string): string {
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

export const RecruiterJobCard = memo<RecruiterJobCardProps>(
  ({ job, onClick, onConvertToReferenceJD, className }) => {
    const status = job.status || 'Draft'
    const displayStatus = status === 'Closed' ? 'Expired' : status
    const deptColor = departmentColors[job.department || ''] || departmentColors.Default

    const jobId = job.job_id || job.id?.toString() || null
    const {
      autoShortlist,
      isLoading: isLoadingAutoShortlist,
      toggle,
      isToggling,
    } = useAutoShortlist(jobId)

    const locationDisplay =
      job.location_city && job.location_country
        ? `${job.location_city}, ${job.location_country}`
        : job.location_city || job.location_country || job.location || 'Location not specified'

    const companyName = job.company?.name || 'Company'
    const companyLogo = job.company?.logo

    const handleAutoShortlistToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!jobId || isLoadingAutoShortlist || isToggling) return
      toggle()
      setTimeout(() => {
        toast.success(
          autoShortlist ? `Auto Shortlist disabled` : `Auto Shortlist enabled`,
          { duration: 2000 }
        )
      }, 100)
    }

    return (
      <Card
        onClick={onClick}
        className={cn(
          'group cursor-pointer transition-all duration-300 border-border-default hover:border-primary-200 dark:hover:border-primary-800 bg-background-surface hover:shadow-md hover:-translate-y-0.5',
          className
        )}
      >
        <CardHeader className="p-6 pb-3 space-y-4">
          {/* Top Row: Badges and Actions */}
          <div className="flex justify-between items-start">
            <div className="flex gap-2 flex-wrap">
              {job.department && (
                <Badge variant="secondary" className={cn('h-6 font-semibold border-none', deptColor.bg, deptColor.text)}>
                  {job.department}
                </Badge>
              )}
              {job.application_deadline && (
                <Badge
                  variant="outline"
                  className={cn(
                    'h-6 border-none',
                    displayStatus === 'Expired'
                      ? 'bg-error-50 dark:bg-error-950/20 text-error-600 dark:text-error-400'
                      : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                  )}
                >
                  {displayStatus === 'Expired' ? 'Expired' : formatDeadline(job.application_deadline)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={handleAutoShortlistToggle}
                className={cn(
                  'transition-all duration-200 p-1.5 rounded-lg',
                  autoShortlist
                    ? 'text-orange-500 fill-orange-500'
                    : 'text-text-muted hover:text-orange-400'
                )}
                title={autoShortlist ? 'Auto Shortlist: ON' : 'Auto Shortlist: OFF'}
              >
                <Zap className={cn('w-4 h-4', autoShortlist && 'fill-current')} />
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Title and Logo Branding */}
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border border-border-subtle bg-background-subtle rounded-xl">
              <AvatarImage src={companyLogo} />
              <AvatarFallback className="text-primary-600 dark:text-primary-400 font-bold text-xs bg-primary-50 dark:bg-primary-950">
                {companyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  {job.title}
                </h3>
              </div>
              <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest mt-0.5 mt-1">{companyName}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2 space-y-5">
          {/* Vertical Hierarchy Spine */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
              <span className="truncate">{locationDisplay}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <DollarSign className="w-4 h-4 text-text-muted flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">{formatSalary(job)}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-text-secondary">
              <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
              <span className="whitespace-nowrap">
                {formatPostedDate(job.posted_date || job.created_at)}
              </span>
            </div>
          </div>

          {/* Type Tags */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium bg-background-subtle text-text-secondary border-transparent">
              {job.employment_type}
            </Badge>
            <Badge variant="secondary" className="font-medium bg-background-subtle text-text-secondary border-transparent">
              {job.location_type || 'On-site'}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-4 border-t border-border-default/60 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <Users className="w-4 h-4" />
              <span>{job.applicant_count || 0} applicants</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <Eye className="w-4 h-4" />
              <span>{job.views_count || 0} views</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }
)

RecruiterJobCard.displayName = 'RecruiterJobCard'
