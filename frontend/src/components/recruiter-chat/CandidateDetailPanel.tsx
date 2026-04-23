'use client'

import type { CandidateDetailData } from '@/lib/types/recruiterChat'

import MediaBadge from '@/components/common/MediaBadge'

import { formatDateLabel, formatLongDate, getInitials, getStatusTone } from './utils'

export function CandidateDetailPanel({ data }: { data: CandidateDetailData }) {
  return (
    <section className="recruiter-chat-card recruiter-chat-card--detail">
      <div className="recruiter-chat-detail-header">
        <MediaBadge
          src={data.avatar_url}
          alt={data.full_name}
          fallback={getInitials(data.full_name)}
          className="recruiter-chat-avatar recruiter-chat-avatar--large"
          sizes="56px"
        />

        <div className="recruiter-chat-detail-identity">
          <div className="recruiter-chat-detail-name">{data.full_name}</div>
          <div className="recruiter-chat-detail-headline">
            {data.headline || data.job_title || data.email}
          </div>
          <div className="recruiter-chat-detail-meta">
            <span className={`status-dot status-dot--${getStatusTone(data.application_status)}`}>
              {data.application_status.replace(/_/g, ' ')}
            </span>
            {data.score != null ? (
              <span className="recruiter-chat-detail-score">Score: {data.score}</span>
            ) : null}
          </div>
        </div>
      </div>

      {data.feedback ? (
        <div className="recruiter-chat-feedback">
          <div className="recruiter-chat-feedback-label">Recruiter Notes</div>
          <p>{data.feedback}</p>
        </div>
      ) : null}

      {data.summary ? <p className="recruiter-chat-muted-copy">{data.summary}</p> : null}

      {data.skills.length ? (
        <div className="recruiter-chat-section">
          <div className="recruiter-chat-section-title">Skills</div>
          <div className="recruiter-chat-skills">
            {data.skills.map((skill, i) => (
              <span key={skill.id}>
                {skill.skill_name}
                {i < data.skills.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {data.experiences.length ? (
        <div className="recruiter-chat-section">
          <div className="recruiter-chat-section-title">Experience</div>
          <div className="recruiter-chat-section-stack">
            {data.experiences.map((experience) => (
              <div key={experience.id} className="recruiter-chat-timeline-item">
                <div className="recruiter-chat-timeline-title">{experience.company_name}</div>
                <div className="recruiter-chat-timeline-subtitle">{experience.title}</div>
                <div className="recruiter-chat-timeline-meta">
                  {formatDateLabel(experience.start_date)} - {formatDateLabel(experience.end_date)}
                </div>
                {experience.description.length ? (
                  <ul className="recruiter-chat-bullet-list">
                    {experience.description.map((item, index) => (
                      <li key={`${experience.id}-description-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.educations.length ? (
        <div className="recruiter-chat-section">
          <div className="recruiter-chat-section-title">Education</div>
          <div className="recruiter-chat-section-stack">
            {data.educations.map((education) => (
              <div key={education.id} className="recruiter-chat-timeline-item">
                <div className="recruiter-chat-timeline-title">{education.institution}</div>
                <div className="recruiter-chat-timeline-subtitle">
                  {[education.degree, education.field_of_study].filter(Boolean).join(' · ') ||
                    'Education'}
                </div>
                <div className="recruiter-chat-timeline-meta">
                  {formatDateLabel(education.start_date)} - {formatDateLabel(education.end_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="recruiter-chat-detail-footer">
        Applied for {data.resume_name} on {formatLongDate(data.applied_at)}
      </div>
    </section>
  )
}
