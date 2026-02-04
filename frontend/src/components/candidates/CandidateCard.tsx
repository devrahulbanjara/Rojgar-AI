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

export function CandidateCard({ candidate, onClick, className, index: _index = 0 }: CandidateCardProps) {

  return (
    <div
      className={cn(
        'group w-full bg-white rounded-[12px] border border-[#F1F5F9] cursor-pointer',
        'hover:border-[#E2E8F0]',
        className
      )}
      style={{
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'
        e.currentTarget.style.borderColor = '#F1F5F9'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
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
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: '8px' }}>
          {/* Header Row - Name + Roles */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-[#1E293B] leading-[1.2]">
              {candidate.name}
            </h3>
            {candidate.professional_headline && (
              <>
                <span className="text-[#CBD5E1] text-sm mx-1">•</span>
                <span className="text-sm text-[#64748B] font-medium">
                  {candidate.professional_headline}
                </span>
              </>
            )}
            {candidate.job_title && (
              <>
                <span className="text-[#CBD5E1] text-sm mx-1">•</span>
                <span className="text-sm text-[#64748B] font-medium">
                  {candidate.job_title}
                </span>
              </>
            )}
          </div>

          {/* Contact Information Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#94A3B8]" strokeWidth={2} />
              <span className="text-sm text-[#64748B]">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <>
                <span className="text-[#E2E8F0]">|</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8]" strokeWidth={2} />
                  <span className="text-sm text-[#64748B]">{candidate.phone}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}