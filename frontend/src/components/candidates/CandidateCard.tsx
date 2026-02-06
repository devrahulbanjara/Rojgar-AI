import React from 'react'
import { CandidateApplication } from '../../types/candidate'
import { cn } from '../../lib/utils'
import { Mail, Phone } from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'

interface CandidateCardProps {
  candidate: CandidateApplication
  onClick?: () => void
  className?: string
  index?: number
}

export function CandidateCard({
  candidate,
  onClick,
  className,
  index: _index = 0,
}: CandidateCardProps) {
  return (
    <div
      className={cn(
        'group w-full bg-background-surface rounded-[12px] border border-border-subtle cursor-pointer',
        'px-6 py-5 shadow-sm transition-all duration-200',
        'hover:border-border-default hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <UserAvatar
            name={candidate.name}
            src={candidate.picture || undefined}
            className="w-[72px] h-[72px]"
          />
        </div>

        {/* Main Content - Flex Column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Name */}
          <h3 className="text-lg font-semibold text-text-primary leading-[1.2]">
            {candidate.name}
          </h3>

          {/* Job Applied For */}
          {candidate.job_title && (
            <div className="mt-1">
              <span className="text-sm font-medium text-primary">{candidate.job_title}</span>
            </div>
          )}

          {/* Email | Phone */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
              <span className="text-sm text-text-tertiary">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <>
                <span className="text-border-default">|</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
                  <span className="text-sm text-text-tertiary">{candidate.phone}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
