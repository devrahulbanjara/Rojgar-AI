'use client'

import type { CandidateSearchResult } from '@/lib/types/recruiterChat'
import { BriefcaseBusiness, ChevronRight } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

import { getInitials, getStatusTone } from './utils'

export function CandidateCardGrid({ data }: { data: CandidateSearchResult }) {
  if (!data.candidates.length) {
    return (
      <section className="recruiter-chat-card recruiter-chat-card--empty-state">
        <p>No matching candidates were found for that request.</p>
      </section>
    )
  }

  return (
    <section className="recruiter-chat-card-shell">
      <div className="recruiter-chat-card-count">
        {data.total} candidate{data.total === 1 ? '' : 's'} found
      </div>

      <div className="recruiter-chat-candidate-list">
        {data.candidates.map((candidate) => {
          return (
            <button
              key={`${candidate.user_id}-${candidate.application_id}`}
              type="button"
              className="recruiter-chat-card recruiter-chat-card--candidate-row"
            >
              <div className="recruiter-chat-candidate-row__main">
                <MediaBadge
                  src={candidate.avatar_url}
                  alt={candidate.full_name}
                  fallback={getInitials(candidate.full_name)}
                  className="recruiter-chat-avatar recruiter-chat-avatar--candidate recruiter-chat-avatar--candidate-row"
                  sizes="40px"
                />

                <div className="recruiter-chat-candidate-row__copy">
                  <div className="recruiter-chat-candidate-row__name">{candidate.full_name}</div>
                  <div className="recruiter-chat-candidate-row__job">
                    <BriefcaseBusiness size={14} />
                    <span>{candidate.applied_for_job}</span>
                  </div>
                </div>
              </div>

              <div className="recruiter-chat-candidate-row__meta">
                <span
                  className={`status-dot status-dot--${getStatusTone(candidate.application_status)}`}
                >
                  {candidate.application_status.replace(/_/g, ' ')}
                </span>
                <span className="recruiter-chat-candidate-row__score">
                  {Math.round(candidate.match_score * 100)}%
                </span>
                <ChevronRight size={16} className="recruiter-chat-candidate-row__chevron" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
