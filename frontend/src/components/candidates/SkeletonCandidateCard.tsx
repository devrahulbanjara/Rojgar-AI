import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonCandidateCardProps {
  className?: string
  index?: number
}

const getCardBackgroundColor = (index: number) => {
  const colors = [
    'bg-gradient-to-r from-blue-50/30 dark:from-blue-900/20 via-background-surface to-background-surface',
    'bg-gradient-to-r from-indigo-50/30 dark:from-indigo-900/20 via-background-surface to-background-surface',
    'bg-gradient-to-r from-purple-50/30 dark:from-purple-900/20 via-background-surface to-background-surface',
    'bg-gradient-to-r from-pink-50/30 dark:from-pink-900/20 via-background-surface to-background-surface',
    'bg-gradient-to-r from-cyan-50/30 dark:from-cyan-900/20 via-background-surface to-background-surface',
  ]
  return colors[index % colors.length]
}

export function SkeletonCandidateCard({ className, index = 0 }: SkeletonCandidateCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border-default/80 animate-pulse overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
        getCardBackgroundColor(index),
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center gap-6">
          {}
          <div className="w-16 h-16 rounded-xl bg-background-muted flex-shrink-0 border-2 border-background-surface" />

          {}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-background-muted rounded w-1/3" />
                <div className="h-4 bg-background-muted rounded w-1/2" />
                <div className="h-4 bg-background-muted rounded w-2/3" />
              </div>
              {}
              <div className="w-16 h-16 bg-background-muted rounded-xl" />
            </div>

            {}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="h-4 bg-background-muted rounded w-32" />
              <div className="h-4 bg-background-muted rounded w-24" />
              <div className="h-6 bg-background-muted rounded-full w-20" />
            </div>
          </div>

          {}
          <div className="w-10 h-10 bg-background-muted rounded-lg flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
