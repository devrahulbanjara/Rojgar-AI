'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useGetCompanyCandidateByIdQuery } from '@/store/services/applicationsApi'
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, UserRound } from 'lucide-react'

import StatusPill from '@/components/common/StatusPill'

import { CandidateDetailSkeleton } from '../_components/CandidatesSkeletons'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatResumeDate(value: string | null): string {
  if (!value) return 'Present'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export default function RecruiterCandidateDetailPage() {
  const params = useParams()
  const applicationId = params.application_id as string
  const { data: resp, isLoading, isError, refetch } = useGetCompanyCandidateByIdQuery(applicationId)
  const candidate = resp?.data

  return (
    <div className="dash-content container container--app-shell">
      <Link href="/recruiter/candidates" className="jd-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Candidates
      </Link>

      {isLoading ? (
        <CandidateDetailSkeleton />
      ) : isError || !candidate ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Could not load this candidate.{' '}
            <button className="auth__inline-link" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="recruiter-candidate-detail">
          <div className="dash-card">
            <div className="dash-card__body recruiter-candidate-detail__hero">
              <div className="recruiter-candidate-detail__identity">
                <div className="recruiter-candidate-detail__avatar">
                  {candidate.applicant_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.applicant_avatar_url} alt={candidate.applicant_name} />
                  ) : (
                    candidate.applicant_name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? '')
                      .join('')
                  )}
                </div>
                <div className="recruiter-candidate-detail__copy">
                  <h2 className="recruiter-candidate-detail__title">{candidate.applicant_name}</h2>
                  <p className="recruiter-candidate-detail__subtitle">{candidate.job_title}</p>
                  <div className="recruiter-candidate-detail__meta">
                    <StatusPill kind="application" status={candidate.status} />
                    <span>Applied {formatDate(candidate.created_at)}</span>
                    {candidate.score !== null ? <span>Score {candidate.score}/100</span> : null}
                  </div>
                </div>
              </div>

              <div className="recruiter-candidate-detail__contacts">
                {candidate.applicant_email ? (
                  <span className="badge badge--gray">
                    <Mail size={12} />
                    {candidate.applicant_email}
                  </span>
                ) : null}
                {candidate.candidate_phone ? (
                  <span className="badge badge--gray">
                    <Phone size={12} />
                    {candidate.candidate_phone}
                  </span>
                ) : null}
                {candidate.candidate_location ? (
                  <span className="badge badge--gray">
                    <MapPin size={12} />
                    {candidate.candidate_location}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Shared profile details</div>
                  <div className="dash-card__subtitle">
                    Only the details this candidate chose to share for this application.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                {candidate.candidate_headline ? (
                  <div className="recruiter-candidate-detail__block">
                    <div className="recruiter-candidate-detail__label">Headline</div>
                    <p>{candidate.candidate_headline}</p>
                  </div>
                ) : null}
                {candidate.candidate_summary ? (
                  <div className="recruiter-candidate-detail__block">
                    <div className="recruiter-candidate-detail__label">Summary</div>
                    <p>{candidate.candidate_summary}</p>
                  </div>
                ) : null}
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Shared links</div>
                  <div className="recruiter-candidate-detail__links">
                    {candidate.linkedin_url ? (
                      <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                        LinkedIn <ExternalLink size={12} />
                      </a>
                    ) : null}
                    {candidate.github_url ? (
                      <a href={candidate.github_url} target="_blank" rel="noreferrer">
                        GitHub <ExternalLink size={12} />
                      </a>
                    ) : null}
                    {candidate.portfolio_url ? (
                      <a href={candidate.portfolio_url} target="_blank" rel="noreferrer">
                        Portfolio <ExternalLink size={12} />
                      </a>
                    ) : null}
                    {!candidate.linkedin_url &&
                    !candidate.github_url &&
                    !candidate.portfolio_url ? (
                      <p className="cell-muted">No profile links shared for this application.</p>
                    ) : null}
                  </div>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">AI review</div>
                  <p>{candidate.feedback ?? 'No feedback available yet.'}</p>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Resume attached</div>
                  <div className="dash-card__subtitle">
                    The resume selected by the candidate when they applied.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                {candidate.resume ? (
                  <>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Resume</div>
                      <p>{candidate.resume.resume_name}</p>
                      {candidate.resume.headline ? (
                        <p className="cell-muted">{candidate.resume.headline}</p>
                      ) : null}
                    </div>
                    {candidate.resume.summary ? (
                      <div className="recruiter-candidate-detail__block">
                        <div className="recruiter-candidate-detail__label">Resume summary</div>
                        <p>{candidate.resume.summary}</p>
                      </div>
                    ) : null}
                    {candidate.resume.skills.length > 0 ? (
                      <div className="recruiter-candidate-detail__block">
                        <div className="recruiter-candidate-detail__label">Skills</div>
                        <div className="recruiter-candidate-detail__chips">
                          {candidate.resume.skills.map((skill) => (
                            <span key={skill.id} className="badge badge--gray">
                              {skill.skill_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {candidate.resume.experiences.length > 0 ? (
                      <div className="recruiter-candidate-detail__block">
                        <div className="recruiter-candidate-detail__label">Experience</div>
                        <div className="recruiter-candidate-detail__timeline">
                          {candidate.resume.experiences.map((experience) => (
                            <div
                              key={experience.id}
                              className="recruiter-candidate-detail__timelineItem"
                            >
                              <div className="recruiter-candidate-detail__timelineTitle">
                                {experience.title} · {experience.company_name}
                              </div>
                              <div className="recruiter-candidate-detail__timelineMeta">
                                {formatResumeDate(experience.start_date)} —{' '}
                                {formatResumeDate(experience.end_date)}
                              </div>
                              {experience.description.length > 0 ? (
                                <ul className="recruiter-candidate-detail__timelineList">
                                  {experience.description.map((line, index) => (
                                    <li key={index}>{line}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {candidate.resume.educations.length > 0 ? (
                      <div className="recruiter-candidate-detail__block">
                        <div className="recruiter-candidate-detail__label">Education</div>
                        <div className="recruiter-candidate-detail__timeline">
                          {candidate.resume.educations.map((education) => (
                            <div
                              key={education.id}
                              className="recruiter-candidate-detail__timelineItem"
                            >
                              <div className="recruiter-candidate-detail__timelineTitle">
                                {education.degree ?? 'Education'} · {education.institution}
                              </div>
                              {education.field_of_study ? (
                                <div className="recruiter-candidate-detail__timelineMeta">
                                  {education.field_of_study}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="profile-empty">
                    <UserRound size={18} />
                    <p>No resume details are available for this application.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
