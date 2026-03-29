'use client'

import type { JobEditPreviewData } from '@/lib/types/recruiterChat'

import { formatFieldLabel, isListDiff, stringifyScalar, toStringArray } from './utils'

interface JobEditDiffCardProps {
  data: JobEditPreviewData
  onConfirm?: (patch?: Record<string, unknown>) => void
  onCancel?: () => void
}

function renderList(beforeList: string[], afterList: string[]) {
  const allValues = Array.from(new Set([...beforeList, ...afterList]))

  return (
    <div className="recruiter-chat-diff-grid">
      <div className="recruiter-chat-diff-pane">
        <div className="recruiter-chat-diff-pane-label">Before</div>
        <div className="recruiter-chat-diff-list">
          {allValues.map((value) => {
            const removed = beforeList.includes(value) && !afterList.includes(value)

            if (!beforeList.includes(value)) return null

            return (
              <div
                key={`before-${value}`}
                className={`recruiter-chat-diff-list-item${removed ? ' recruiter-chat-diff-list-item--removed' : ''}`}
              >
                {removed ? (
                  <span className="recruiter-chat-diff-marker recruiter-chat-diff-marker--removed">
                    -
                  </span>
                ) : null}
                {value}
              </div>
            )
          })}
        </div>
      </div>

      <div className="recruiter-chat-diff-pane">
        <div className="recruiter-chat-diff-pane-label">After</div>
        <div className="recruiter-chat-diff-list">
          {allValues.map((value) => {
            const added = afterList.includes(value) && !beforeList.includes(value)

            if (!afterList.includes(value)) return null

            return (
              <div
                key={`after-${value}`}
                className={`recruiter-chat-diff-list-item${added ? ' recruiter-chat-diff-list-item--added' : ''}`}
              >
                {added ? (
                  <span className="recruiter-chat-diff-marker recruiter-chat-diff-marker--added">
                    +
                  </span>
                ) : null}
                {value}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function JobEditDiffCard({ data, onCancel, onConfirm }: JobEditDiffCardProps) {
  return (
    <section className="recruiter-chat-card recruiter-chat-card--job-edit">
      <div className="recruiter-chat-review-header">
        <div className="recruiter-chat-review-eyebrow">Edit review</div>
        <div className="recruiter-chat-card-title">Review changes for {data.job_title}</div>
        <div className="recruiter-chat-card-subtitle">{data.summary}</div>
      </div>

      {data.diffs.length ? (
        <div className="recruiter-chat-section-stack">
          {data.diffs.map((diff) => {
            if (isListDiff(diff)) {
              return (
                <div key={diff.field} className="recruiter-chat-diff-card">
                  <div className="recruiter-chat-diff-title">{formatFieldLabel(diff.field)}</div>
                  {renderList(toStringArray(diff.before), toStringArray(diff.after))}
                </div>
              )
            }

            return (
              <div key={diff.field} className="recruiter-chat-diff-card">
                <div className="recruiter-chat-diff-title">{formatFieldLabel(diff.field)}</div>
                <div className="recruiter-chat-diff-grid">
                  <div className="recruiter-chat-diff-pane">
                    <div className="recruiter-chat-diff-pane-label">Before</div>
                    <div className="recruiter-chat-scalar recruiter-chat-scalar--before">
                      {diff.before !== diff.after ? (
                        <span className="recruiter-chat-diff-marker recruiter-chat-diff-marker--removed">
                          -
                        </span>
                      ) : null}
                      {stringifyScalar(diff.before)}
                    </div>
                  </div>
                  <div className="recruiter-chat-diff-pane">
                    <div className="recruiter-chat-diff-pane-label">After</div>
                    <div className="recruiter-chat-scalar recruiter-chat-scalar--after">
                      {diff.before !== diff.after ? (
                        <span className="recruiter-chat-diff-marker recruiter-chat-diff-marker--added">
                          +
                        </span>
                      ) : null}
                      {stringifyScalar(diff.after)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="recruiter-chat-muted-copy">
          No field-level diffs were returned for this edit.
        </p>
      )}

      {onCancel && onConfirm ? (
        <div className="recruiter-chat-card-actions">
          <button type="button" className="btn btn--ghost btn--danger btn--sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => onConfirm(data.patch)}
          >
            Confirm changes
          </button>
        </div>
      ) : null}
    </section>
  )
}
