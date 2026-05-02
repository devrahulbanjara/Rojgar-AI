'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import ResumeTemplate from '@/app/candidate/resume/_components/ResumeTemplate'
import CandidateEvaluationCard from '@/app/recruiter/candidates/_components/CandidateEvaluationCard'
import InterviewRecordingCard from '@/app/recruiter/candidates/_components/InterviewRecordingCard'
import { mapRecruiterCandidateResume } from '@/app/recruiter/candidates/_lib/mapRecruiterCandidateResume'
import { buildEmailPreviewDocument } from '@/lib/email/preview'
import { getAllRecruiterSelectableStatuses } from '@/lib/statusMetadata'
import {
  type ApplicationStatus,
  type RecruiterCandidateDetailView,
  useGetCompanyCandidateByIdQuery,
  useGetMyCompanyCandidatesQuery,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import {
  type EmailDraftRecord,
  useApproveDraftMutation,
  useDeleteDraftMutation,
  useGenerateDraftForApplicationMutation,
  useGetDraftsQuery,
  useUpdateDraftMutation,
} from '@/store/services/outreachApi'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Hash,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import { FilterSelect } from '@/components/common/Toolbar'

import styles from './CandidateDrawer.module.scss'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_booked: 'Interview booked',
  interview_completed: 'Interview completed',
  offer: 'Offer',
  offer_accepted: 'Offer accepted',
  offer_declined: 'Offer declined',
  rejected: 'Rejected',
}

export const DRAWER_TABS = ['profile', 'evaluation', 'interview', 'outreach', 'resume'] as const
export type DrawerTab = (typeof DRAWER_TABS)[number]

const TAB_LABELS: Record<DrawerTab, string> = {
  profile: 'Profile',
  evaluation: 'Evaluation',
  interview: 'Interview',
  outreach: 'Outreach',
  resume: 'Resume',
}

function formatInterviewDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatInterviewTime(startValue: string, endValue: string) {
  const start = new Date(startValue)
  const end = new Date(endValue)
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${fmt.format(start)} - ${fmt.format(end)}`
}

function formatTimelineTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type CandidateDrawerProps = {
  applicationId: string | null
  activeTab?: DrawerTab
  onClose: () => void
  onTabChange?: (tab: DrawerTab) => void
  onApplicationChange?: (applicationId: string) => void
}

export default function CandidateDrawer({
  applicationId,
  activeTab = 'profile',
  onClose,
  onTabChange,
  onApplicationChange,
}: CandidateDrawerProps) {
  const isOpen = Boolean(applicationId)

  const { data, isLoading, isError, refetch } = useGetCompanyCandidateByIdQuery(
    applicationId ?? '',
    { skip: !applicationId },
  )
  const candidate = data?.data
  const interview = candidate?.interview
  const transitions = candidate ? getAllRecruiterSelectableStatuses(candidate.status) : []

  const { data: candidatesResp } = useGetMyCompanyCandidatesQuery(
    { page: 1, size: 200 },
    { skip: !candidate },
  )
  const siblingApplications = useMemo(() => {
    if (!candidate) return []
    const row = candidatesResp?.data?.find((c) => c.candidate_id === candidate.candidate_id)
    return row?.applications ?? []
  }, [candidate, candidatesResp?.data])

  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation()

  const renderedResume = useMemo(() => mapRecruiterCandidateResume(candidate), [candidate])

  useEffect(() => {
    if (!isOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleStatusChange = async (next: ApplicationStatus) => {
    if (!candidate || !next || next === candidate.status) return
    try {
      await updateStatus({
        application_id: candidate.id,
        body: { status: next },
      }).unwrap()
      toast.success(`Application moved to ${STATUS_LABELS[next].toLowerCase()}.`)
      void refetch()
    } catch {
      toast.error('Could not update application status.')
    }
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label="Candidate drawer"
        data-lenis-prevent
      >
        <div className={styles.header}>
          <Avatar
            name={candidate?.applicant_name ?? 'Candidate'}
            src={candidate?.applicant_avatar_url}
            seed={candidate?.candidate_id ?? candidate?.applicant_email ?? undefined}
            className={styles.headerAvatar}
            sizes="64px"
          />
          <div className={styles.headerCopy}>
            <div className={styles.headerName}>
              {candidate?.applicant_name ?? (isLoading ? 'Loading…' : 'Candidate')}
            </div>
            <div className={styles.headerMeta}>
              {candidate?.applicant_email ? (
                <>
                  <Mail size={11} aria-hidden="true" />
                  {candidate.applicant_email}
                </>
              ) : null}
            </div>
          </div>

          {candidate ? (
            <div className={styles.statusSelectWrap}>
              <span className={styles.statusSelectLabel}>Change application status</span>
              <FilterSelect<ApplicationStatus>
                value={candidate.status}
                onChange={(next) => void handleStatusChange(next)}
                options={[
                  { value: candidate.status, label: `Current: ${STATUS_LABELS[candidate.status]}` },
                  ...transitions.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
                ]}
                ariaLabel="Change application status"
                disabled={isUpdating}
                className={styles.statusSelect}
              />
            </div>
          ) : null}

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {siblingApplications.length > 1 && onApplicationChange ? (
          <div className={styles.appSwitcher} role="tablist" aria-label="Other applications">
            <div className={styles.appSwitcherChips}>
              {siblingApplications.map((app) => {
                const isActive = app.application_id === applicationId
                return (
                  <button
                    key={app.application_id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.appChip} ${isActive ? styles.appChipActive : ''}`}
                    onClick={() => onApplicationChange(app.application_id)}
                    title={`${app.job_title} · ${STATUS_LABELS[app.status]}`}
                  >
                    <span className={styles.appChipTitle}>{app.job_title}</span>
                    <span className={styles.appChipStatus}>{STATUS_LABELS[app.status]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.tabs} role="tablist">
          {DRAWER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => onTabChange?.(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.section}>
              <div className={styles.skeleton}>
                <div style={{ width: '60%' }} />
                <div style={{ width: '90%' }} />
                <div style={{ width: '75%' }} />
                <div style={{ width: '85%' }} />
              </div>
            </div>
          ) : isError || !candidate || !applicationId ? (
            <div className={styles.empty}>
              Could not load this candidate.{' '}
              <button className="btn btn--ghost btn--sm" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : activeTab === 'profile' ? (
            <ProfileTab candidate={candidate} />
          ) : activeTab === 'evaluation' ? (
            <CandidateEvaluationCard applicationId={applicationId} />
          ) : activeTab === 'interview' ? (
            <InterviewBookingSection interview={interview ?? null} />
          ) : activeTab === 'outreach' ? (
            <OutreachTab
              applicationId={applicationId}
              jobId={candidate.job_id}
              strengths={candidate.strengths}
              weaknesses={candidate.weaknesses}
              score={candidate.score}
            />
          ) : (
            <ResumeTab renderedResume={renderedResume} />
          )}
          {!isLoading && !isError && candidate && applicationId ? (
            <div
              className={activeTab === 'interview' ? undefined : styles.hiddenRecordingPanel}
              aria-hidden={activeTab !== 'interview'}
            >
              <InterviewRecordingCard key={applicationId} applicationId={applicationId} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}

type Candidate = RecruiterCandidateDetailView

function ProfileTab({ candidate }: { candidate: Candidate }) {
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Applied for</h3>
        <p className={styles.headline}>{candidate.job_title}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Contact</h3>
        <div className={styles.contactGrid}>
          {candidate.applicant_email ? (
            <span className={styles.contactItem}>
              <Mail size={14} aria-hidden="true" />
              {candidate.applicant_email}
            </span>
          ) : null}
          {candidate.candidate_phone ? (
            <span className={styles.contactItem}>
              <Phone size={14} aria-hidden="true" />
              {candidate.candidate_phone}
            </span>
          ) : null}
          {candidate.candidate_location ? (
            <span className={styles.contactItem}>
              <MapPin size={14} aria-hidden="true" />
              {candidate.candidate_location}
            </span>
          ) : null}
          {!candidate.applicant_email &&
          !candidate.candidate_phone &&
          !candidate.candidate_location ? (
            <span className={styles.muted}>No contact details shared.</span>
          ) : null}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Headline</h3>
        <p className={styles.headline}>{candidate.candidate_headline ?? 'Not shared.'}</p>
        {candidate.candidate_summary ? (
          <p className={styles.summary}>{candidate.candidate_summary}</p>
        ) : null}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Shared links</h3>
        <div className={styles.linksRow}>
          {candidate.linkedin_url ? (
            <a
              href={candidate.linkedin_url}
              className={styles.link}
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : null}
          {candidate.github_url ? (
            <a href={candidate.github_url} className={styles.link} target="_blank" rel="noreferrer">
              GitHub <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : null}
          {candidate.portfolio_url ? (
            <a
              href={candidate.portfolio_url}
              className={styles.link}
              target="_blank"
              rel="noreferrer"
            >
              Portfolio <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : null}
          {!candidate.linkedin_url && !candidate.github_url && !candidate.portfolio_url ? (
            <span className={styles.muted}>None.</span>
          ) : null}
        </div>
      </div>

      {candidate.strengths?.length || candidate.weaknesses?.length ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>AI review</h3>
          <div className={styles.reviewColumns}>
            {candidate.strengths?.length ? (
              <div className={styles.reviewColumn}>
                <h4 className={styles.reviewColumnTitle}>Strengths</h4>
                <ul className={styles.reviewList}>
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className={styles.strengthItem}>
                      <Check size={14} className={styles.strengthIcon} /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {candidate.weaknesses?.length ? (
              <div className={styles.reviewColumn}>
                <h4 className={styles.reviewColumnTitle}>Gaps</h4>
                <ul className={styles.reviewList}>
                  {candidate.weaknesses.map((w, i) => (
                    <li key={i} className={styles.weaknessItem}>
                      <X size={14} className={styles.weaknessIcon} /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {candidate.timeline.length > 0 ? (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Timeline</h3>
          <div className={styles.timelineList}>
            {candidate.timeline.map((event) => (
              <div key={event.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTitle}>{event.title}</div>
                  {event.description ? (
                    <div className={styles.timelineDesc}>{event.description}</div>
                  ) : null}
                  <div className={styles.timelineTime}>{formatTimelineTime(event.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

function InterviewBookingSection({ interview }: { interview: Candidate['interview'] }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Booking</h3>
      {interview ? (
        <>
          <div className={styles.bookingRow}>
            <CalendarDays size={14} aria-hidden="true" />
            {interview.start_time
              ? formatInterviewDate(interview.start_time)
              : 'Date not available'}
          </div>
          <div className={styles.bookingRow}>
            <Clock3 size={14} aria-hidden="true" />
            {interview.start_time && interview.end_time
              ? formatInterviewTime(interview.start_time, interview.end_time)
              : 'Time not available'}
          </div>
          <div className={styles.bookingRow}>
            <MapPin size={14} aria-hidden="true" />
            {interview.location ?? 'Location not available'}
          </div>
          {interview.title ? (
            <div className={`${styles.bookingRow} ${styles.muted}`}>{interview.title}</div>
          ) : null}
          {interview.cal_booking_uid ? (
            <div className={styles.bookingRow}>
              <Hash size={14} aria-hidden="true" />
              <span className={styles.bookingMono}>{interview.cal_booking_uid}</span>
            </div>
          ) : null}
        </>
      ) : (
        <p className={styles.muted}>No interview booked yet.</p>
      )}
    </div>
  )
}

function ResumeTab({
  renderedResume,
}: {
  renderedResume: ReturnType<typeof mapRecruiterCandidateResume>
}) {
  if (!renderedResume) {
    return <div className={styles.empty}>No resume details are available for this application.</div>
  }
  return (
    <div className={styles.resumeWrap}>
      <div className="rv-page-shadow">
        <ResumeTemplate resume={renderedResume} />
      </div>
    </div>
  )
}

function OutreachTab({
  applicationId,
  jobId,
  strengths,
  weaknesses,
  score,
}: {
  applicationId: string
  jobId: string
  strengths: string[] | null
  weaknesses: string[] | null
  score: number | null
}) {
  const { data, isLoading, refetch } = useGetDraftsQuery(jobId)
  const [generateDraft, { isLoading: isGenerating }] = useGenerateDraftForApplicationMutation()

  const allDrafts: EmailDraftRecord[] = data?.data ?? []
  const draft = allDrafts.find((entry) => entry.application_id === applicationId) ?? null
  const resolvedStrengths = strengths ?? draft?.application_strengths ?? null
  const resolvedWeaknesses = weaknesses ?? draft?.application_weaknesses ?? null
  const hasReview = !!(resolvedStrengths?.length || resolvedWeaknesses?.length)
  const resolvedScore = score ?? draft?.score ?? null

  async function handleGenerate() {
    try {
      await generateDraft(applicationId).unwrap()
      toast.success('Draft generated.')
      void refetch()
    } catch {
      toast.error('Could not generate draft.')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.skeleton}>
          <div style={{ width: '50%' }} />
          <div style={{ width: '90%' }} />
          <div style={{ width: '85%' }} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.section}>
        <div className={styles.outreachFeedbackHeader}>
          <h3 className={styles.sectionTitle}>AI review</h3>
          {resolvedScore !== null ? (
            <span className={styles.outreachScoreChip}>Score {resolvedScore}</span>
          ) : null}
        </div>
        {hasReview ? (
          <div className={styles.reviewColumns}>
            {resolvedStrengths?.length ? (
              <div className={styles.reviewColumn}>
                <h4 className={styles.reviewColumnTitle}>Strengths</h4>
                <ul className={styles.reviewList}>
                  {resolvedStrengths.map((s, i) => (
                    <li key={i} className={styles.strengthItem}>
                      <Check size={14} className={styles.strengthIcon} /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {resolvedWeaknesses?.length ? (
              <div className={styles.reviewColumn}>
                <h4 className={styles.reviewColumnTitle}>Gaps</h4>
                <ul className={styles.reviewList}>
                  {resolvedWeaknesses.map((w, i) => (
                    <li key={i} className={styles.weaknessItem}>
                      <X size={14} className={styles.weaknessIcon} /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className={styles.outreachFeedbackMuted}>
            No AI feedback for this candidate. The email will use a generic template — no fabricated
            reasons.
          </p>
        )}
      </div>

      {draft ? (
        <DraftEditor key={draft.draft_id} draft={draft} onRegenerated={() => void refetch()} />
      ) : (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Email draft</h3>
          <p className={styles.muted}>
            No draft yet for this candidate. Generate one to start outreach.
          </p>
          <div className={styles.outreachActions}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
            >
              <Mail size={14} aria-hidden="true" />
              {isGenerating ? 'Generating…' : 'Generate AI draft'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function DraftEditor({
  draft,
  onRegenerated,
}: {
  draft: EmailDraftRecord
  onRegenerated: () => void
}) {
  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftMutation()
  const [approveDraft, { isLoading: isApproving }] = useApproveDraftMutation()
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftMutation()
  const [generateDraft, { isLoading: isRegenerating }] = useGenerateDraftForApplicationMutation()

  const [subject, setSubject] = useState(draft.subject ?? '')
  const [body, setBody] = useState(draft.body ?? '')
  const [dirty, setDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const previewDocument = useMemo(() => buildEmailPreviewDocument(subject, body), [body, subject])

  const editable = !draft.is_sent && !draft.is_discarded

  async function handleSave() {
    try {
      await updateDraft({ draftId: draft.draft_id, subject, body }).unwrap()
      toast.success('Draft saved.')
      setDirty(false)
    } catch {
      toast.error('Could not save draft.')
    }
  }

  async function handleSendNow() {
    try {
      if (dirty) {
        await updateDraft({ draftId: draft.draft_id, subject, body }).unwrap()
        setDirty(false)
      }
      await approveDraft({ draftId: draft.draft_id, approved: true }).unwrap()
      toast.success('Email sent.')
    } catch {
      toast.error('Could not send email.')
    }
  }

  async function handleRegenerate() {
    try {
      await generateDraft(draft.application_id).unwrap()
      toast.success('Draft regenerated.')
      setDirty(false)
      onRegenerated()
    } catch {
      toast.error('Could not regenerate draft.')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this draft?')) return
    try {
      await deleteDraft(draft.draft_id).unwrap()
      toast.success('Draft deleted.')
    } catch {
      toast.error('Could not delete draft.')
    }
  }

  const statusBadge = draft.is_sent ? (
    <span className={`${styles.outreachStatusBadge} ${styles.outreachStatusSent}`}>
      <Check size={12} aria-hidden="true" /> Sent
    </span>
  ) : draft.is_discarded ? (
    <span className={`${styles.outreachStatusBadge} ${styles.outreachStatusDiscarded}`}>
      Discarded
    </span>
  ) : draft.is_approved ? (
    <span className={`${styles.outreachStatusBadge} ${styles.outreachStatusApproved}`}>
      <Check size={12} aria-hidden="true" /> Approved
    </span>
  ) : (
    <span className={`${styles.outreachStatusBadge} ${styles.outreachStatusPending}`}>Drafted</span>
  )

  return (
    <div className={styles.section}>
      <div className={styles.outreachEditorHead}>
        <h3 className={styles.sectionTitle}>Email draft</h3>
        {statusBadge}
      </div>

      <label className={styles.outreachFieldLabel} htmlFor="drawer-outreach-subject">
        Subject
      </label>
      <input
        id="drawer-outreach-subject"
        type="text"
        className={styles.outreachInput}
        value={subject}
        disabled={!editable}
        onChange={(event) => {
          setSubject(event.target.value)
          setDirty(true)
        }}
      />

      <label className={styles.outreachFieldLabel} htmlFor="drawer-outreach-body">
        HTML body
      </label>
      <textarea
        id="drawer-outreach-body"
        className={styles.outreachTextarea}
        value={body}
        disabled={!editable}
        rows={12}
        onChange={(event) => {
          setBody(event.target.value)
          setDirty(true)
        }}
      />

      <button
        type="button"
        className={`btn btn--ghost btn--sm ${styles.outreachPreviewToggle}`}
        onClick={() => setShowPreview((current) => !current)}
        aria-expanded={showPreview}
      >
        {showPreview ? (
          <ChevronDown size={14} aria-hidden="true" />
        ) : (
          <ChevronRight size={14} aria-hidden="true" />
        )}
        {showPreview ? 'Hide preview' : 'Show preview'}
      </button>

      {showPreview ? (
        <iframe
          title="Rendered email preview"
          className={styles.outreachPreviewFrame}
          sandbox=""
          srcDoc={previewDocument}
        />
      ) : null}

      {editable ? (
        <div className={styles.outreachActions}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => void handleSendNow()}
            disabled={isApproving || isSaving}
          >
            {isApproving ? 'Sending…' : 'Send now'}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => void handleSave()}
            disabled={!dirty || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => void handleRegenerate()}
            disabled={isRegenerating}
          >
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <span className={styles.outreachActionsSpacer} />
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
