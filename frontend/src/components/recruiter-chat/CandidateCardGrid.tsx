'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import type { CandidateSearchResult } from '@/lib/types/recruiterChat'
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

import { getStatusTone } from './utils'

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
      <Avatar
        name={candidate.full_name}
        src={candidate.avatar_url}
        seed={candidate.user_id}
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
  const [showLow, setShowLow] = useState(false)

  if (!data.candidates?.length) {
    return (
      <section className="recruiter-chat-card recruiter-chat-card--empty-state">
        <p>No matching candidates were found for that request.</p>
      </section>
    )
  }

  // Older payloads may not carry the `relevance` flag — treat them all as "high"
  // so the UI keeps working without a server upgrade.
  const high = data.candidates.filter((c) => (c.relevance ?? 'high') === 'high')
  const low = data.candidates.filter((c) => c.relevance === 'low')
  const visible = showLow ? [...high, ...low] : high

  return (
    <section className="recruiter-chat-card-shell">
      <div className="recruiter-chat-card-count">
        {high.length} strong match{high.length === 1 ? '' : 'es'}
        {low.length ? ` · ${low.length} weaker` : ''}
      </div>

      <div className="recruiter-chat-job-mini-list">
        {visible.map((candidate) => (
          <CandidateRow
            key={`${candidate.user_id}-${candidate.application_id}`}
            candidate={candidate}
          />
        ))}
      </div>

      {low.length ? (
        <button
          type="button"
          className="btn btn--ghost btn--sm recruiter-chat-show-more"
          onClick={() => setShowLow((current) => !current)}
        >
          {showLow ? (
            <>
              <ChevronUp size={13} />
              Hide {low.length} weaker match{low.length === 1 ? '' : 'es'}
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              Show {low.length} weaker match{low.length === 1 ? '' : 'es'}
            </>
          )}
        </button>
      ) : null}
    </section>
  )
}
