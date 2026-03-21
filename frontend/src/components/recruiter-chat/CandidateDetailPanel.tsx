'use client'

/* eslint-disable @next/next/no-img-element */

import type { RecruiterChatCandidateDetailPayload } from '@/store/services/recruiterChatApi'

import {
  formatDateTime,
  formatShortDate,
  getInitials,
  getSkillNames,
  getStatusTone,
} from './utils'

export default function CandidateDetailPanel({
  candidate,
  compact = false,
}: {
  candidate: RecruiterChatCandidateDetailPayload
  compact?: boolean
}) {
  const skills = getSkillNames(candidate.skills)

  return (
    <section
      className={`recruiter-chat-card recruiter-chat-card--candidate-detail${compact ? ' recruiter-chat-card--compact' : ''}`}
    >
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
              {candidate.headline || candidate.job_title || candidate.resume_name}
            </div>
            <div className="recruiter-chat-detail-meta">
              <span className={`recruiter-chat-pill recruiter-chat-pill--${getStatusTone(candidate.application_status)}`}>
                {candidate.application_status.replace(/_/g, ' ')}
              </span>
              {candidate.score != null ? <span>AI score {candidate.score}</span> : null}
              <span>Applied {formatDateTime(candidate.applied_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recruiter-chat-candidate-profile">
        <div className="recruiter-chat-candidate-profile__summary">
          {candidate.summary ? <p>{candidate.summary}</p> : null}

          <div className="recruiter-chat-detail-stats">
            <div>
              <span className="recruiter-chat-detail-stats__label">Role</span>
              <strong>{candidate.job_title || 'Unknown role'}</strong>
            </div>
            <div>
              <span className="recruiter-chat-detail-stats__label">Resume</span>
              <strong>{candidate.resume_name}</strong>
            </div>
            <div>
              <span className="recruiter-chat-detail-stats__label">Contact</span>
              <strong>{candidate.email || 'Not available'}</strong>
            </div>
          </div>

          {candidate.feedback ? (
            <div className="recruiter-chat-feedback-box">
              <div className="recruiter-chat-feedback-box__label">Recruiter feedback</div>
              <p>{candidate.feedback}</p>
            </div>
          ) : null}
        </div>

        {skills.length > 0 ? (
          <div className="recruiter-chat-section">
            <div className="recruiter-chat-section__title">Skills</div>
            <div className="recruiter-chat-chip-row">
              {skills.map((skill) => (
                <span key={skill} className="recruiter-chat-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {candidate.experiences.length > 0 ? (
          <div className="recruiter-chat-section">
            <div className="recruiter-chat-section__title">Experience</div>
            <div className="recruiter-chat-timeline">
              {candidate.experiences.map((experience, index) => (
                <div
                  key={`${experience.company_name}-${experience.title}-${index}`}
                  className="recruiter-chat-timeline__item"
                >
                  <div className="recruiter-chat-timeline__title">
                    {experience.title} at {experience.company_name}
                  </div>
                  <div className="recruiter-chat-timeline__meta">
                    {formatShortDate(experience.start_date)} - {formatShortDate(experience.end_date)}
                  </div>
                  {experience.description?.length ? (
                    <ul className="recruiter-chat-bullets">
                      {experience.description.map((item, itemIndex) => (
                        <li key={`${experience.company_name}-desc-${itemIndex}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {candidate.educations.length > 0 ? (
          <div className="recruiter-chat-section">
            <div className="recruiter-chat-section__title">Education</div>
            <div className="recruiter-chat-timeline">
              {candidate.educations.map((education, index) => (
                <div
                  key={`${education.institution}-${education.degree ?? 'education'}-${index}`}
                  className="recruiter-chat-timeline__item"
                >
                  <div className="recruiter-chat-timeline__title">
                    {education.degree || 'Education'}
                    {education.field_of_study ? ` • ${education.field_of_study}` : ''}
                  </div>
                  <div className="recruiter-chat-timeline__meta">
                    {education.institution}
                    {education.start_date || education.end_date
                      ? ` • ${formatShortDate(education.start_date)} - ${formatShortDate(education.end_date)}`
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
