'use client'

import type { RecruiterChatJobEditDiff, RecruiterChatJobEditProposal } from '@/store/services/recruiterChatApi'

function renderScalarValue(value: RecruiterChatJobEditDiff['before']) {
  if (value == null || value === '') {
    return <span className="recruiter-chat-diff-empty">Empty</span>
  }

  return <span>{String(value)}</span>
}

function renderListDiff(beforeList: string[], afterList: string[]) {
  const kept = afterList.filter((item) => beforeList.includes(item))
  const added = afterList.filter((item) => !beforeList.includes(item))
  const removed = beforeList.filter((item) => !afterList.includes(item))

  return (
    <ul className="recruiter-chat-diff-list">
      {kept.map((item) => (
        <li key={`keep-${item}`} className="recruiter-chat-diff-list__item">
          {item}
        </li>
      ))}
      {added.map((item) => (
        <li key={`add-${item}`} className="recruiter-chat-diff-list__item recruiter-chat-diff-list__item--added">
          + {item}
        </li>
      ))}
      {removed.map((item) => (
        <li key={`remove-${item}`} className="recruiter-chat-diff-list__item recruiter-chat-diff-list__item--removed">
          - {item}
        </li>
      ))}
    </ul>
  )
}

export default function JobEditDiffCard({
  proposal,
  onConfirm,
  onCancel,
}: {
  proposal: RecruiterChatJobEditProposal
  onConfirm: (patch: Record<string, unknown>) => void
  onCancel: () => void
}) {
  return (
    <section className="recruiter-chat-card recruiter-chat-card--interrupt">
      <div className="recruiter-chat-card__header">
        <div>
          <div className="recruiter-chat-card__title">Confirm job edit</div>
          <div className="recruiter-chat-card__subtitle">
            {proposal.summary || `Review the proposed changes for ${proposal.job_title || 'this job'}.`}
          </div>
        </div>
      </div>

      <div className="recruiter-chat-interrupt__diffs">
        {(proposal.diffs ?? []).map((diff) => {
          const beforeList = Array.isArray(diff.before) ? diff.before : null
          const afterList = Array.isArray(diff.after) ? diff.after : null

          return (
            <div key={diff.field} className="recruiter-chat-diff-card">
              <div className="recruiter-chat-diff-card__title">{diff.field.replace(/_/g, ' ')}</div>
              <div className="recruiter-chat-diff-card__grid">
                <div className="recruiter-chat-diff-card__pane">
                  <span className="recruiter-chat-diff-card__label">Before</span>
                  {beforeList && afterList ? renderListDiff(beforeList, beforeList) : renderScalarValue(diff.before)}
                </div>
                <div className="recruiter-chat-diff-card__pane recruiter-chat-diff-card__pane--after">
                  <span className="recruiter-chat-diff-card__label">After</span>
                  {beforeList && afterList ? renderListDiff(beforeList, afterList) : renderScalarValue(diff.after)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="recruiter-chat-interrupt__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => onConfirm(proposal.patch ?? {})}
        >
          Confirm
        </button>
      </div>
    </section>
  )
}
