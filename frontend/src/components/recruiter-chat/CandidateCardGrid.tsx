'use client'

import type { CandidateSearchResult } from '@/lib/types/recruiterChat'
import { BriefcaseBusiness } from 'lucide-react'

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

      <div className="recruiter-chat-candidate-grid">
        {data.candidates.map((candidate) => {
          const visibleSkills = candidate.skills.slice(0, 4)
          const remainingSkillCount = Math.max(0, candidate.skills.length - visibleSkills.length)

          return (
            <button
              key={`${candidate.user_id}-${candidate.application_id}`}
              type="button"
              className="recruiter-chat-card recruiter-chat-card--candidate"
            >
              <div className="recruiter-chat-candidate-top">
                <MediaBadge
                  src={candidate.avatar_url}
                  alt={candidate.full_name}
                  fallback={getInitials(candidate.full_name)}
                  className="recruiter-chat-avatar recruiter-chat-avatar--candidate"
                  sizes="40px"
                />

                <div className="recruiter-chat-candidate-copy">
                  <div className="recruiter-chat-candidate-name">{candidate.full_name}</div>
                  <div className="recruiter-chat-candidate-headline">
                    {candidate.headline || 'No headline provided'}
                  </div>
                </div>
              </div>

              <div className="recruiter-chat-candidate-meta">
                <span
                  className={`recruiter-chat-badge recruiter-chat-badge--${getStatusTone(candidate.application_status)}`}
                >
                  {candidate.application_status.replace(/_/g, ' ')}
                </span>
                <span className="recruiter-chat-match-score">
                  {Math.round(candidate.match_score * 100)}% match
                </span>
              </div>

              <div className="recruiter-chat-chip-row">
                {visibleSkills.map((skill) => (
                  <span key={skill} className="recruiter-chat-chip">
                    {skill}
                  </span>
                ))}
                {remainingSkillCount > 0 ? (
                  <span className="recruiter-chat-chip">+{remainingSkillCount}</span>
                ) : null}
              </div>

              <div className="recruiter-chat-candidate-job">
                <BriefcaseBusiness size={14} />
                <span>{candidate.applied_for_job}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
