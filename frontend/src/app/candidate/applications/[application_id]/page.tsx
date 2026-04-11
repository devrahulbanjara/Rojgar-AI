'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { getApplicationStatusLabel } from '@/lib/applicationStatus'
import { useGetApplicationByIdQuery } from '@/store/services/applicationsApi'
import { ArrowLeft, CalendarDays, Clock3, MapPin } from 'lucide-react'

import DashboardErrorState from '@/components/common/DashboardErrorState'
import StatusPill from '@/components/common/StatusPill'

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function CandidateApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.application_id as string
  const { data, isLoading, isError, error, isFetching, refetch } =
    useGetApplicationByIdQuery(applicationId)
  const application = data?.data

  return (
    <div className="dash-content container container--app-shell">
      <Link href="/candidate/applications" className="jd-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Applications
      </Link>

      {isLoading ? (
        <div className="dash-card">
          <div className="dash-card__body">Loading application details...</div>
        </div>
      ) : isError || !application ? (
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      ) : (
        <div className="candidate-dashboard">
          <div className="dash-card">
            <div className="dash-card__body recruiter-candidate-detail__hero">
              <div className="recruiter-candidate-detail__copy">
                <h1 className="recruiter-candidate-detail__title">{application.job_title}</h1>
                <p className="recruiter-candidate-detail__subtitle">{application.company_name}</p>
                <div className="recruiter-candidate-detail__contacts">
                  {application.location ? (
                    <span className="recruiter-candidate-detail__contactValue">
                      <MapPin size={12} />
                      {application.location}
                    </span>
                  ) : null}
                  <span className="recruiter-candidate-detail__contactValue">
                    <CalendarDays size={12} />
                    Applied {formatDateTime(application.created_at)}
                  </span>
                </div>
              </div>

              <div className="recruiter-candidate-detail__contactStatus">
                <StatusPill kind="application" status={application.status} />
              </div>
            </div>
          </div>

          <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Timeline</div>
                  <div className="dash-card__subtitle">
                    Every recorded step for this application.
                  </div>
                </div>
              </div>
              <div className="dash-card__body">
                <div className="activity-list activity-list--panel">
                  {application.timeline.map((event) => (
                    <div key={event.id} className="activity-item activity-item--panel">
                      <div className="activity-item__dot" />
                      <div className="activity-item__body">
                        <p className="activity-item__text">
                          <strong>{event.title}</strong>
                        </p>
                        {event.description ? (
                          <p className="activity-item__text">{event.description}</p>
                        ) : null}
                        <div className="activity-item__time">
                          {formatDateTime(event.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">What happens next</div>
                  <div className="dash-card__subtitle">Guidance based on the current stage.</div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Current stage</div>
                  <p>{getApplicationStatusLabel(application.status)}</p>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Next step</div>
                  <p>
                    {application.next_step_hint ?? 'Updates will appear here as the process moves.'}
                  </p>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Review notes</div>
                  <p>{application.feedback ?? 'No recruiter notes have been shared yet.'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Interview details</div>
                  <div className="dash-card__subtitle">
                    The current interview booking tied to this application.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                {application.interview ? (
                  <>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Schedule</div>
                      <p className="recruiter-candidate-detail__timelineTitle">
                        <CalendarDays size={14} />{' '}
                        {formatDateTime(application.interview.start_time)}
                      </p>
                      <p className="recruiter-candidate-detail__timelineMeta">
                        <Clock3 size={14} /> {formatDateTime(application.interview.end_time)}
                      </p>
                    </div>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Location</div>
                      <p>{application.interview.location ?? 'Not provided'}</p>
                    </div>
                  </>
                ) : (
                  <div className="dash-navbar__notifications-empty">
                    No interview has been booked for this application yet.
                  </div>
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Resume used</div>
                  <div className="dash-card__subtitle">
                    Snapshot of the resume submitted with this application.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                {application.resume ? (
                  <>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Resume name</div>
                      <p>{application.resume.resume_name}</p>
                    </div>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Headline</div>
                      <p>{application.resume.headline ?? 'Not provided'}</p>
                    </div>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Summary</div>
                      <p>{application.resume.summary ?? 'Not provided'}</p>
                    </div>
                    <div className="recruiter-candidate-detail__block">
                      <div className="recruiter-candidate-detail__label">Skills</div>
                      <p>
                        {application.resume.skills.map((skill) => skill.skill_name).join(', ') ||
                          'No skills listed'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="dash-navbar__notifications-empty">
                    Resume details are not available for this application.
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
