import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonCandidateCardProps {
  className?: string
  index?: number
}

// Subtle alternating background colors matching the card design
const getCardBackgroundColor = (index: number) => {
  const colors = [
    'bg-gradient-to-r from-blue-50/30 via-white to-white',
    'bg-gradient-to-r from-indigo-50/30 via-white to-white',
    'bg-gradient-to-r from-purple-50/30 via-white to-white',
    'bg-gradient-to-r from-pink-50/30 via-white to-white',
    'bg-gradient-to-r from-cyan-50/30 via-white to-white',
  ]
  return colors[index % colors.length]
}

export function SkeletonCandidateCard({ className, index = 0 }: SkeletonCandidateCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-slate-200/80 animate-pulse overflow-hidden',
        getCardBackgroundColor(index),
        className
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Avatar skeleton */}
          <div className="w-16 h-16 rounded-xl bg-slate-200 flex-shrink-0 border-2 border-white" />

          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
              {/* Score skeleton */}
              <div className="w-16 h-16 bg-slate-200 rounded-xl" />
            </div>

            {/* Info skeleton */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
          </div>

          {/* Arrow skeleton */}
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}