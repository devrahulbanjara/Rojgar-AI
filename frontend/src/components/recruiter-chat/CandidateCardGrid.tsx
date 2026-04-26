'use client'

import { useRouter } from 'next/navigation'

import type { CandidateSearchResult } from '@/lib/types/recruiterChat'
import { ChevronRight } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

import { getInitials, getStatusTone } from './utils'

function CandidateRow({ candidate }: { candidate: CandidateSearchResult['candidates'][number] }) {
  const router = useRouter()
  const tone = getStatusTone(candidate.application_status)
  const status = (candidate.application_status ?? '').replace(/_/g, ' ')
  const score = candidate.match_score != null ? `${Math.round(candidate.match_score * 100)}%` : null

  return (
    <button
      type="button"
      className="recruiter-chat-job-mini-row recruiter-chat-candidate-mini-row"
      onClick={() => router.push(`/recruiter/candidates/${candidate.application_id}?from=chat`)}
    >
      <MediaBadge
        src={candidate.avatar_url}
        alt={candidate.full_name}
        fallback={getInitials(candidate.full_name)}
        className="recruiter-chat-candidate-mini-avatar"
        sizes="28px"
      />

      <div className="recruiter-chat-job-mini-row__main">
        <div className="recruiter-chat-job-mini-row__header">
          <div className="recruiter-chat-job-mini-row__title">{candidate.full_name}</div>
          {status && <span className={`status-dot status-dot--${tone}`}>{status}</span>}
        </div>

        <div className="recruiter-chat-candidate-mini-row__sub">
          <span className="recruiter-chat-candidate-mini-row__sub-job">
            {candidate.applied_for_job}
          </span>
          {score && (
            <span className="recruiter-chat-candidate-mini-row__score">&middot; {score}</span>
          )}
        </div>
      </div>

      <ChevronRight size={14} className="recruiter-chat-candidate-row__chevron" />
    </button>
  )
}

export function CandidateCardGrid({ data }: { data: CandidateSearchResult }) {
  if (!data.candidates?.length) {
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

      <div className="recruiter-chat-job-mini-list">
        {data.candidates.map((candidate) => (
          <CandidateRow
            key={`${candidate.user_id}-${candidate.application_id}`}
            candidate={candidate}
          />
        ))}
      </div>
    </section>
  )
}
