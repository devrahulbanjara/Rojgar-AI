'use client'

import { useState } from 'react'

import type { JobListItem } from '@/store/services/jobsApi'
import { Sparkles } from 'lucide-react'

type JobAIAssistantProps = {
  title: string
  roughDescription: string
  sourceJobId: string
  researchSalary: boolean
  followUpFeedback: string
  draftExists: boolean
  loading: boolean
  jobs: JobListItem[]
  onTitleChange: (value: string) => void
  onRoughDescriptionChange: (value: string) => void
  onSourceJobIdChange: (value: string) => void
  onResearchSalaryChange: (value: boolean) => void
  onFollowUpFeedbackChange: (value: string) => void
  onGenerate: () => void
  onGeneralUpdate: () => void
}

export default function JobAIAssistant({
  title,
  roughDescription,
  sourceJobId,
  researchSalary,
  followUpFeedback,
  draftExists,
  loading,
  jobs,
  onTitleChange,
  onRoughDescriptionChange,
  onSourceJobIdChange,
  onResearchSalaryChange,
  onFollowUpFeedbackChange,
  onGenerate,
  onGeneralUpdate,
}: JobAIAssistantProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <section className="job-ai-card job-ai-assistant dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h2 className="job-ai-card__title dash-card__title">
            {draftExists ? 'Refine with AI' : 'Start with AI'}
          </h2>
          <p className="job-ai-card__subtitle dash-card__subtitle">
            {draftExists
              ? 'Send follow-up instructions to update the unlocked fields.'
              : 'Describe the role and let AI generate a first draft. You stay in control of every field.'}
          </p>
        </div>
      </div>

      <div className="job-ai-card__body dash-card__body">
        {!draftExists ? (
          <>
            <div className="job-ai-assistant__section">
              <label className="job-ai-label" htmlFor="job-ai-title">
                Job title
              </label>
              <input
                id="job-ai-title"
                type="text"
                className="job-ai-input"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="e.g. Senior AI Engineer"
              />
            </div>

            <div className="job-ai-assistant__section">
              <label className="job-ai-label" htmlFor="job-ai-rough-description">
                Rough description
              </label>
              <textarea
                id="job-ai-rough-description"
                className="job-ai-textarea"
                rows={4}
                value={roughDescription}
                onChange={(event) => onRoughDescriptionChange(event.target.value)}
                placeholder="e.g. 5 years exp, need FastAPI advanced exp, PyTorch, skilled in LLMs"
              />
            </div>

            <div className="job-ai-assistant__toggle">
              <label className="job-ai-checkbox">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(event) => setShowAdvanced(event.target.checked)}
                />
                <span>Add extra context or match writing style from a past job</span>
              </label>
            </div>

            {showAdvanced && (
              <div className="job-ai-assistant__section">
                <label className="job-ai-label" htmlFor="job-ai-source-job">
                  Match writing style from a past job
                </label>
                <select
                  id="job-ai-source-job"
                  className="job-ai-input"
                  value={sourceJobId}
                  onChange={(event) => onSourceJobIdChange(event.target.value)}
                >
                  <option value="">None — use default style</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                      {job.auto_shortlist ? ' — AI evaluation on' : ''}
                    </option>
                  ))}
                </select>
                <p className="job-ai-assistant__helper">
                  AI will mirror the tone and phrasing of the selected job.
                </p>
              </div>
            )}

            <div className="job-ai-assistant__toggle">
              <label className="job-ai-checkbox">
                <input
                  type="checkbox"
                  checked={researchSalary}
                  onChange={(event) => onResearchSalaryChange(event.target.checked)}
                />
                <span>Research salary from web evidence</span>
              </label>
            </div>

            <div className="job-ai-assistant__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={loading}
                onClick={onGenerate}
              >
                <Sparkles size={16} aria-hidden="true" />
                {loading ? 'Generating…' : 'Generate draft'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="job-ai-assistant__section">
              <label className="job-ai-label" htmlFor="job-ai-feedback">
                What should AI change?
              </label>
              <textarea
                id="job-ai-feedback"
                className="job-ai-textarea"
                rows={3}
                value={followUpFeedback}
                onChange={(event) => onFollowUpFeedbackChange(event.target.value)}
                placeholder="e.g. shorten the overview and make the requirements more realistic."
              />
              <p className="job-ai-assistant__helper">
                AI rewrites unlocked fields only. Lock anything you want preserved.
              </p>
            </div>

            <div className="job-ai-assistant__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={loading || !followUpFeedback.trim()}
                onClick={onGeneralUpdate}
              >
                <Sparkles size={16} aria-hidden="true" />
                Apply update
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
