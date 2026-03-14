'use client'

import type { JobListItem } from '@/store/services/jobsApi'

type JobAIAssistantProps = {
  prompt: string
  sourceText: string
  sourceJobId: string
  researchSalary: boolean
  followUpFeedback: string
  loading: boolean
  jobs: JobListItem[]
  onPromptChange: (value: string) => void
  onSourceTextChange: (value: string) => void
  onSourceJobIdChange: (value: string) => void
  onResearchSalaryChange: (value: boolean) => void
  onFollowUpFeedbackChange: (value: string) => void
  onGenerate: () => void
}

export default function JobAIAssistant({
  prompt,
  sourceText,
  sourceJobId,
  researchSalary,
  followUpFeedback,
  loading,
  jobs,
  onPromptChange,
  onSourceTextChange,
  onSourceJobIdChange,
  onResearchSalaryChange,
  onFollowUpFeedbackChange,
  onGenerate,
}: JobAIAssistantProps) {
  return (
    <section className="job-ai-card job-ai-assistant">
      <div className="job-ai-card__header">
        <div>
          <h1 className="job-ai-card__title">Job Creation Copilot</h1>
          <p className="job-ai-card__subtitle">
            Start from a prompt, pasted hiring notes, or a previous role. AI drafts, you decide.
          </p>
        </div>
      </div>

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

      <div className="job-ai-assistant__section">
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
          Follow-up instructions
        </label>
        <textarea
          id="job-ai-feedback"
          className="job-ai-textarea"
          rows={4}
          value={followUpFeedback}
          onChange={(event) => onFollowUpFeedbackChange(event.target.value)}
          placeholder="Used for regenerate or save-review actions, for example: make the overview tighter and emphasize production AI systems."
        />
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
      </div>
    </section>
  )
}
