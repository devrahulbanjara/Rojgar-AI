import React from 'react'
import { AlertCircle, UserCircle, FileText, Calendar } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'

interface NeedsAttentionProps {
  hasProfile: boolean
  hasResume: boolean
  hasPendingInterview: boolean
}

interface AttentionItem {
  icon: React.ReactNode
  label: string
  description: string
  actionLabel: string
  href: string
  color: string
}

export function NeedsAttention({
  hasProfile,
  hasResume,
  hasPendingInterview,
}: NeedsAttentionProps) {
  const items: AttentionItem[] = []

  if (!hasProfile) {
    items.push({
      icon: <UserCircle className="w-5 h-5" />,
      label: 'Complete Your Profile',
      description: 'A complete profile helps you get better job matches.',
      actionLabel: 'Go to Profile',
      href: '/candidate/profile',
      color: 'text-amber-600 dark:text-amber-400',
    })
  }

  if (!hasResume) {
    items.push({
      icon: <FileText className="w-5 h-5" />,
      label: 'Upload a Resume',
      description: 'Add at least one resume to start applying for jobs.',
      actionLabel: 'Go to Resumes',
      href: '/candidate/resumes',
      color: 'text-blue-600 dark:text-blue-400',
    })
  }

  if (hasPendingInterview) {
    items.push({
      icon: <Calendar className="w-5 h-5" />,
      label: 'Upcoming Interview',
      description: 'You have an interview coming up. Prepare for it!',
      actionLabel: 'View Details',
      href: '/candidate/dashboard',
      color: 'text-violet-600 dark:text-violet-400',
    })
  }

  if (items.length === 0) return null

  return (
    <Card className="border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Needs Attention
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background-surface border border-border-subtle hover:border-primary-200 dark:hover:border-primary-700 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={item.color}>{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{item.label}</p>
                  <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap group-hover:underline">
                {item.actionLabel} →
              </span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
