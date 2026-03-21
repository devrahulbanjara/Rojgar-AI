'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'

import { X } from 'lucide-react'

import type { RecruiterChatCandidateCard } from '@/store/services/recruiterChatApi'

import { getInitials, getStatusTone } from './utils'

function CandidatePreviewModal({
  candidate,
  onClose,
}: {
  candidate: RecruiterChatCandidateCard | null
  onClose: () => void
}) {
  if (!candidate) return null

  return (
    <div className="modal-backdrop modal-backdrop--animated" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal modal--recruiter-chat" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Candidate preview</span>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="modal__body modal__body--scroll">
          <section className="recruiter-chat-card recruiter-chat-card--candidate-detail recruiter-chat-card--compact">
            <div className="recruiter-chat-card__header">
              <div className="recruiter-chat-candidate-card__top">
                <div className="recruiter-chat-avatar recruiter-chat-avatar--lg">
                  {candidate.avatar_url ? (
                    <img src={candidate.avatar_url} alt={candidate.full_name} />
                  ) : (
                    <span>{getInitials(candidate.full_name)}</span>
                  )}
                </div>
                <div className="recruiter-chat-candidate-card__identity">
                  <div className="recruiter-chat-candidate-card__name">{candidate.full_name}</div>
                  <div className="recruiter-chat-candidate-card__headline">
                    {candidate.headline || candidate.applied_for_job}
                  </div>
                </div>
              </div>
            </div>

            <div className="recruiter-chat-candidate-profile">
              <div className="recruiter-chat-detail-meta">
                <span className={`recruiter-chat-pill recruiter-chat-pill--${getStatusTone(candidate.application_status)}`}>
                  {candidate.application_status.replace(/_/g, ' ')}
                </span>
                <span>Applied for {candidate.applied_for_job}</span>
                <span>{Math.round((candidate.match_score || 0) * 100)}% match</span>
              </div>

              {candidate.skills.length > 0 ? (
                <div className="recruiter-chat-chip-row">
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="recruiter-chat-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}

              {candidate.feedback ? (
                <div className="recruiter-chat-feedback-box">
                  <div className="recruiter-chat-feedback-box__label">Recruiter feedback</div>
                  <p>{candidate.feedback}</p>
                </div>
              ) : (
                <p className="recruiter-chat-card__body-copy">
                  Ask the assistant for this candidate by name and job title if you want the full application profile inline in chat.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function CandidateCardGrid({
  results,
}: {
  results: RecruiterChatCandidateCard[]
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterChatCandidateCard | null>(null)

  if (results.length === 0) {
    return null
  }

  return (
    <>
      <section className="recruiter-chat-card recruiter-chat-card--candidate-list">
        <div className="recruiter-chat-card__header">
          <div>
            <div className="recruiter-chat-card__title">Matching candidates</div>
            <div className="recruiter-chat-card__subtitle">
              {results.length} result{results.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="recruiter-chat-candidate-grid">
          {results.map((candidate) => (
            <button
              key={`${candidate.user_id}-${candidate.application_id ?? candidate.applied_for_job}`}
              type="button"
              className="recruiter-chat-candidate-card"
              onClick={() => setSelectedCandidate(candidate)}
            >
              <div className="recruiter-chat-candidate-card__top">
                <div className="recruiter-chat-avatar">
                  {candidate.avatar_url ? (
                    <img src={candidate.avatar_url} alt={candidate.full_name} />
                  ) : (
                    <span>{getInitials(candidate.full_name)}</span>
                  )}
                </div>
                <div className="recruiter-chat-candidate-card__identity">
                  <div className="recruiter-chat-candidate-card__name">{candidate.full_name}</div>
                  <div className="recruiter-chat-candidate-card__headline">
                    {candidate.headline || candidate.applied_for_job}
                  </div>
                </div>
              </div>

              <div className="recruiter-chat-candidate-card__meta">
                <span className={`recruiter-chat-pill recruiter-chat-pill--${getStatusTone(candidate.application_status)}`}>
                  {candidate.application_status.replace(/_/g, ' ')}
                </span>
                <span className="recruiter-chat-score">
                  {Math.round((candidate.match_score || 0) * 100)}% match
                </span>
              </div>

              <div className="recruiter-chat-candidate-card__job">
                Applied for {candidate.applied_for_job}
              </div>

              {candidate.skills.length > 0 ? (
                <div className="recruiter-chat-chip-row">
                  {candidate.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="recruiter-chat-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}

              {candidate.feedback ? (
                <p className="recruiter-chat-candidate-card__feedback">{candidate.feedback}</p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <CandidatePreviewModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
    </>
  )
}
