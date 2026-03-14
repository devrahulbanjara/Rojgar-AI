'use client'

import { useState } from 'react'

import type { JobListItem } from '@/store/services/jobsApi'

type JobAIAssistantProps = {
  prompt: string
  sourceText: string
  sourceJobId: string
  researchSalary: boolean
  followUpFeedback: string
  draftExists: boolean
  loading: boolean
  jobs: JobListItem[]
  onPromptChange: (value: string) => void
  onSourceTextChange: (value: string) => void
  onSourceJobIdChange: (value: string) => void
  onResearchSalaryChange: (value: boolean) => void
  onFollowUpFeedbackChange: (value: string) => void
  onGenerate: () => void
  onGeneralUpdate: () => void
}

export default function JobAIAssistant({
  prompt,
  sourceText,
  sourceJobId,
  researchSalary,
  followUpFeedback,
  draftExists,
  loading,
  jobs,
  onPromptChange,
  onSourceTextChange,
  onSourceJobIdChange,
  onResearchSalaryChange,
  onFollowUpFeedbackChange,
  onGenerate,
  onGeneralUpdate,
}: JobAIAssistantProps) {
  const [showHiringNotes, setShowHiringNotes] = useState(false)

  return (
    <section className="job-ai-card job-ai-assistant dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h1 className="job-ai-card__title dash-card__title">Job Creation Copilot</h1>
          <p className="job-ai-card__subtitle dash-card__subtitle">
            Start from a prompt, pasted hiring notes, or a previous role. AI drafts, you decide.
          </p>
        </div>
      </div>

      <div className="job-ai-card__body dash-card__body">
        <div className="job-ai-assistant__section">
          <label className="job-ai-label" htmlFor="job-ai-prompt">
            Recruiter prompt
          </label>
          <textarea
            id="job-ai-prompt"
            className="job-ai-textarea"
            rows={5}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Example: Create a senior AI engineer role for our platform team focused on LLM systems, production APIs, and evaluation."
          />
        </div>

        <div className="job-ai-assistant__toggle">
          <label className="job-ai-checkbox">
            <input
              type="checkbox"
              checked={showHiringNotes}
              onChange={(event) => setShowHiringNotes(event.target.checked)}
            />
            <span>Have hiring notes or pasted JD?</span>
          </label>
        </div>

        {showHiringNotes && (
          <div
            className="job-ai-assistant__section"
            style={{ animation: 'content-fade-up 280ms ease both' }}
          >
            <label className="job-ai-label" htmlFor="job-ai-source-text">
              Hiring notes or pasted JD
            </label>
            <textarea
              id="job-ai-source-text"
              className="job-ai-textarea job-ai-textarea--lg"
              rows={9}
              value={sourceText}
              onChange={(event) => onSourceTextChange(event.target.value)}
              placeholder="Paste raw notes, Slack messages, or an older job description here."
            />
          </div>
        )}

        <div className="job-ai-assistant__section">
          <label className="job-ai-label" htmlFor="job-ai-source-job">
            Use previous job
          </label>
          <select
            id="job-ai-source-job"
            className="job-ai-input"
            value={sourceJobId}
            onChange={(event) => onSourceJobIdChange(event.target.value)}
          >
            <option value="">None selected</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

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

        <div className="job-ai-assistant__section">
          <label className="job-ai-label" htmlFor="job-ai-feedback">
            Update unlocked fields
          </label>
          <textarea
            id="job-ai-feedback"
            className="job-ai-textarea"
            rows={4}
            value={followUpFeedback}
            onChange={(event) => onFollowUpFeedbackChange(event.target.value)}
            placeholder="Example: keep the locked fields as they are, shorten the overview, and make the requirements more realistic."
          />
          <p className="job-ai-assistant__helper">
            Use this box when you want AI to refine the overall draft while respecting your locked
            fields.
          </p>
        </div>

        <div className="job-ai-assistant__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={loading}
            onClick={onGenerate}
          >
            {loading ? 'Generating...' : 'Generate Draft'}
          </button>
          <button
            type="button"
            className="btn btn--outline"
            disabled={loading || !draftExists || !followUpFeedback.trim()}
            onClick={onGeneralUpdate}
          >
            Update Draft
          </button>
        </div>
      </div>
    </section>
  )
}
