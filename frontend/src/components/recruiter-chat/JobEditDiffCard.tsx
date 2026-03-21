'use client'

import type { JobEditPreviewData } from '@/lib/types/recruiterChat'

import { formatFieldLabel, isListDiff, stringifyScalar, toStringArray } from './utils'

interface JobEditDiffCardProps {
  data: JobEditPreviewData
  onConfirm: (patch?: Record<string, unknown>) => void
  onCancel: () => void
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
      <div>
        <div className="recruiter-chat-card-title">Review Edit: {data.job_title}</div>
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
                      {stringifyScalar(diff.before)}
                    </div>
                  </div>
                  <div className="recruiter-chat-diff-pane">
                    <div className="recruiter-chat-diff-pane-label">After</div>
                    <div className="recruiter-chat-scalar recruiter-chat-scalar--after">
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

      <div className="recruiter-chat-card-actions">
        <button type="button" className="btn btn--outline btn--dark btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--dark btn--sm"
          onClick={() => onConfirm(data.patch)}
        >
          Confirm
        </button>
      </div>
    </section>
  )
}
