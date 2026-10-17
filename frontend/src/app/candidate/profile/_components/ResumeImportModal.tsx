'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import { LIMITS, validateResumeFile } from '@/lib/validation'
import {
  type CandidateProfileData,
  type ResumeImportAction,
  type ResumeImportEducation,
  type ResumeImportExperience,
  type ResumeImportProfileData,
  useCommitResumeImportMutation,
  useLazyGetResumeImportTaskStatusQuery,
  useStartResumeImportMutation,
} from '@/store/services/profileApi'
import { useCreateResumeMutation } from '@/store/services/resumeApi'
import { ArrowRight, FileUp, GitCompare, LoaderCircle, RefreshCw, X } from 'lucide-react'

type ResumeImportModalProps = {
  currentProfile: CandidateProfileData | null
  onClose: () => void
  /** Called after a successful commit, before the modal closes. */
  onCommitted?: () => void
}

function cleanText(value: string | null | undefined) {
  return value?.trim() || ''
}

function toMonthInput(value: string | null) {
  return value ? value.slice(0, 7) : ''
}

function fromMonthInput(value: string) {
  return value ? `${value}-01` : null
}

function dedupe(items: string[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function expLabel(
  experience: ResumeImportExperience | CandidateProfileData['experiences'][number],
) {
  return [cleanText(experience.title), cleanText(experience.company_name)]
    .filter(Boolean)
    .join(' at ')
}

function eduLabel(education: ResumeImportEducation | CandidateProfileData['educations'][number]) {
  return [cleanText(education.degree), cleanText(education.institution)]
    .filter(Boolean)
    .join(' at ')
}

function diffEntries(current: string[], next: string[]) {
  const currentSet = new Set(current.map((entry) => entry.toLowerCase()))
  const nextSet = new Set(next.map((entry) => entry.toLowerCase()))
  return {
    added: next.filter((entry) => !currentSet.has(entry.toLowerCase())),
    removed: current.filter((entry) => !nextSet.has(entry.toLowerCase())),
  }
}

export default function ResumeImportModal({
  currentProfile,
  onClose,
  onCommitted,
}: ResumeImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollSequenceRef = useRef(0)
  const [previewFileName, setPreviewFileName] = useState('')
  const [draft, setDraft] = useState<ResumeImportProfileData | null>(null)
  const [targets, setTargets] = useState<Array<{ id: string; resume_name: string }>>([])
  const [createResume] = useCreateResumeMutation()
  const [action, setAction] = useState<ResumeImportAction>('update_profile')
  const [resumeName, setResumeName] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [tagInput, setTagInput] = useState({ skills: '', roles: '' })
  const [taskId, setTaskId] = useState<string | null>(null)
  const [processingFileName, setProcessingFileName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [startResumeImport, { isLoading: isStartingImport }] = useStartResumeImportMutation()
  const [commitResumeImport, { isLoading: isCommitting }] = useCommitResumeImportMutation()
  const [fetchResumeImportTaskStatus, { isFetching: isPollingTask }] =
    useLazyGetResumeImportTaskStatusQuery()

  const isParsing = isStartingImport || isPollingTask || Boolean(taskId)
  const isBusy = isParsing || isCommitting

  useEffect(() => {
    return () => {
      pollSequenceRef.current += 1
    }
  }, [])

  const scalarDiffs = useMemo(() => {
    if (!currentProfile || !draft || action !== 'update_profile') return []
    const pairs = [
      ['Headline', currentProfile.headline, draft.headline],
      ['Summary', currentProfile.summary, draft.summary],
      ['Phone', currentProfile.phone, draft.phone],
      ['Location', currentProfile.location, draft.location],
      ['LinkedIn', currentProfile.linkedin_url, draft.linkedin_url],
      ['GitHub', currentProfile.github_url, draft.github_url],
      ['Portfolio', currentProfile.portfolio_url, draft.portfolio_url],
      [
        'Years of experience',
        `${currentProfile.years_of_experience ?? ''}`,
        `${draft.years_of_experience ?? ''}`,
      ],
    ]

    return pairs
      .map(([label, before, after]) => ({
        label,
        before: cleanText(before),
        after: cleanText(after),
      }))
      .filter((item) => item.before !== item.after)
  }, [action, currentProfile, draft])

  const collectionDiffs = useMemo(() => {
    if (!currentProfile || !draft || action !== 'update_profile') {
      return {
        roles: { added: [], removed: [] },
        skills: { added: [], removed: [] },
        experiences: { added: [], removed: [] },
        educations: { added: [], removed: [] },
      }
    }

    return {
      roles: diffEntries(currentProfile.target_roles, dedupe(draft.target_roles)),
      skills: diffEntries(
        currentProfile.skills.map((skill) => skill.skill_name),
        dedupe(draft.skills.map((skill) => skill.skill_name)),
      ),
      experiences: diffEntries(
        currentProfile.experiences.map(expLabel).filter(Boolean),
        draft.experiences.map(expLabel).filter(Boolean),
      ),
      educations: diffEntries(
        currentProfile.educations.map(eduLabel).filter(Boolean),
        draft.educations.map(eduLabel).filter(Boolean),
      ),
    }
  }, [action, currentProfile, draft])

  function updateDraft<K extends keyof ResumeImportProfileData>(
    key: K,
    value: ResumeImportProfileData[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  function handleClose() {
    pollSequenceRef.current += 1
    onClose()
  }

  async function pollImportTask(nextTaskId: string, fallbackResumeName: string, pollId: number) {
    while (pollSequenceRef.current === pollId) {
      const response = await fetchResumeImportTaskStatus(nextTaskId, false).unwrap()
      const payload = response.data
      if (!payload) {
        throw new Error('Resume import task returned no data.')
      }

      if (payload.status === 'completed' && payload.result) {
        if (pollSequenceRef.current !== pollId) return
        setPreviewFileName(payload.result.source_file_name)
        setDraft(payload.result.extracted_profile)
        setTargets(payload.result.available_resume_targets)
        setSelectedResumeId(payload.result.available_resume_targets[0]?.id ?? '')
        setResumeName((current) => current.trim() || fallbackResumeName)
        setTaskId(null)
        setProcessingFileName('')
        return
      }

      if (payload.status === 'failed') {
        throw new Error(payload.error || 'We could not parse that resume right now.')
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 3000)
      })
    }
  }

  async function handleFile(file: File) {
    const fileCheck = validateResumeFile(file)
    if (!fileCheck.ok) {
      setError(fileCheck.error)
      notify.error(fileCheck.error)
      return
    }
    setError(null)
    setDraft(null)
    setTargets([])
    setAction('update_profile')
    setSelectedResumeId('')
    setTaskId(null)
    setPreviewFileName('')
    setProcessingFileName(file.name)

    const body = new FormData()
    body.append('file', file)

    try {
      const response = await startResumeImport(body).unwrap()
      if (!response.data) return

      const nextResumeName = file.name.replace(/\.pdf$/i, '').trim() || 'Imported Resume'
      const nextTaskId = response.data.task_id
      const pollId = pollSequenceRef.current + 1

      pollSequenceRef.current = pollId
      setResumeName(nextResumeName)
      setTaskId(nextTaskId)
      await pollImportTask(nextTaskId, nextResumeName, pollId)
    } catch (uploadError) {
      const parsed =
        uploadError instanceof Error
          ? { message: uploadError.message }
          : parseApiError(uploadError, {}, 'We could not parse that resume right now.')
      pollSequenceRef.current += 1
      setProcessingFileName('')
      setTaskId(null)
      setError(parsed.message)
      notify.error(parsed.message)
    }
  }

  async function handleCommit() {
    if (!draft) return
    if (action === 'create_resume') {
      const name = resumeName.trim()
      if (!name) {
        setError('Give the new resume a name first.')
        return
      }
      if (name.length > LIMITS.name) {
        setError(`Resume name too long (max ${LIMITS.name}).`)
        return
      }
    }
    if (action === 'update_resume' && !selectedResumeId) {
      setError('Choose which resume should be updated.')
      return
    }

    setError(null)

    try {
      await commitResumeImport({
        action,
        resume_id: action === 'update_resume' ? selectedResumeId : null,
        resume_name: action === 'create_resume' ? resumeName.trim() : null,
        data: draft,
      }).unwrap()

      // A candidate with no resume yet needs one to apply: create it from the
      // freshly imported profile instead of sending them to build it by hand.
      if (action === 'update_profile' && targets.length === 0) {
        try {
          await createResume({ resume_name: 'My Resume', fork_from_profile: true }).unwrap()
        } catch {
          // Profile import still succeeded; the resume can be created later.
        }
      }

      notify.success(
        action === 'update_profile'
          ? 'Your profile was updated from the imported resume.'
          : 'Resume import applied successfully.',
      )
      onCommitted?.()
      handleClose()
    } catch (commitError) {
      const parsed = parseApiError(commitError, {}, 'We could not apply that import right now.')
      setError(parsed.message)
      notify.error(parsed.message)
    }
  }

  return (
    <div className="modal-backdrop modal-backdrop--animated" role="presentation">
      <div className="modal modal--resume-import" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div>
            <h3 className="modal__title">Import Resume with AI</h3>
            <p className="resume-import__subtitle">
              Upload a PDF, review the extracted details, then choose where to apply them.
            </p>
          </div>
          <button
            className="btn btn--icon btn--sm"
            type="button"
            onClick={handleClose}
            aria-label="Close"
            disabled={isBusy}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          {!draft ? (
            <div className="resume-import__empty">
              {isParsing ? (
                <LoaderCircle className="resume-import__spinner" size={28} />
              ) : (
                <FileUp size={28} />
              )}
              <h4>Upload a PDF resume</h4>
              {isParsing ? (
                <>
                  <p className="resume-import__status">
                    {taskId
                      ? `Processing ${processingFileName || 'your resume'}...`
                      : `Uploading ${processingFileName || 'your resume'}...`}
                  </p>
                  <p>This can take 1-5 minutes depending on the size of the resume you have.</p>
                </>
              ) : (
                <p>
                  We&apos;ll extract an editable draft and won&apos;t save anything until you
                  confirm.
                </p>
              )}
              <p className="resume-import__disclaimer">
                Extracted information may not always be correct. Double-check everything before you
                apply it.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose PDF
              </button>
              {error ? <div className="resume-field__error">{error}</div> : null}
            </div>
          ) : (
            <div className="resume-import">
              <section className="resume-import__sidecard">
                <div className="resume-import__section-head">
                  <h4>Import Target</h4>
                  <button
                    type="button"
                    className="btn btn--ghost btn--danger btn--sm"
                    disabled={isParsing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Reupload
                  </button>
                </div>
                <div className="resume-field">
                  <label className="resume-field__label">Apply this data to</label>
                  <select
                    className="resume-field__input"
                    value={action}
                    onChange={(event) => setAction(event.target.value as ResumeImportAction)}
                  >
                    <option value="update_profile">Update my profile</option>
                    <option value="create_resume">Create a new resume</option>
                    <option value="update_resume">Update an existing resume</option>
                  </select>
                </div>
                {action === 'create_resume' ? (
                  <div className="resume-field">
                    <label className="resume-field__label">New resume name</label>
                    <input
                      className="resume-field__input"
                      value={resumeName}
                      maxLength={LIMITS.name}
                      onChange={(event) => setResumeName(event.target.value)}
                      placeholder="e.g. Backend Engineer Resume"
                    />
                  </div>
                ) : null}
                {action === 'update_resume' ? (
                  <div className="resume-field">
                    <label className="resume-field__label">Choose resume</label>
                    <select
                      className="resume-field__input"
                      value={selectedResumeId}
                      onChange={(event) => setSelectedResumeId(event.target.value)}
                    >
                      <option value="">Select a resume</option>
                      {targets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.resume_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </section>

              {draft.warnings.length > 0 ? (
                <section className="resume-import__sidecard">
                  <div className="resume-import__section-head">
                    <h4>Warnings</h4>
                  </div>
                  <ul className="resume-import__warnings">
                    {draft.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {action === 'update_profile' ? (
                <section className="resume-import__sidecard">
                  <div className="resume-import__section-head">
                    <h4>
                      <GitCompare size={16} aria-hidden="true" /> Profile Diff
                    </h4>
                  </div>
                  <div className="resume-import__diff">
                    {scalarDiffs.map((item) => (
                      <div key={item.label} className="resume-import__diff-row">
                        <div className="resume-import__diff-label">{item.label}</div>
                        <div className="resume-import__diff-values">
                          <span>{item.before || 'Empty'}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                          <strong>{item.after || 'Empty'}</strong>
                        </div>
                      </div>
                    ))}
                    {(['roles', 'skills', 'experiences', 'educations'] as const).map((key) =>
                      collectionDiffs[key].added.length > 0 ||
                      collectionDiffs[key].removed.length > 0 ? (
                        <div key={key} className="resume-import__diff-group">
                          <div className="resume-import__diff-label">
                            {key === 'roles'
                              ? 'Target Roles'
                              : key === 'skills'
                                ? 'Skills'
                                : key === 'experiences'
                                  ? 'Experiences'
                                  : 'Educations'}
                          </div>
                          <div className="resume-import__chips">
                            {collectionDiffs[key].added.map((entry) => (
                              <span key={`${key}-${entry}-added`} className="resume-import__chip">
                                + {entry}
                              </span>
                            ))}
                            {collectionDiffs[key].removed.map((entry) => (
                              <span
                                key={`${key}-${entry}-removed`}
                                className="resume-import__chip resume-import__chip--muted"
                              >
                                - {entry}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </section>
              ) : null}

              <div className="resume-import__main">
                <section className="resume-import__section">
                  <div className="resume-import__section-head">
                    <h4>Basics</h4>
                    <span className="resume-import__file">{previewFileName}</span>
                  </div>
                  <div className="resume-form-grid">
                    {(
                      [
                        ['headline', 'Headline', 'text'],
                        ['phone', 'Phone', 'text'],
                        ['location', 'Location', 'text'],
                        ['linkedin_url', 'LinkedIn URL', 'url'],
                        ['github_url', 'GitHub URL', 'url'],
                        ['portfolio_url', 'Portfolio URL', 'url'],
                      ] as const
                    ).map(([field, label, type]) => (
                      <div className="resume-field" key={field}>
                        <label className="resume-field__label">{label}</label>
                        <input
                          className="resume-field__input"
                          type={type}
                          value={draft[field] ?? ''}
                          onChange={(event) => updateDraft(field, event.target.value || null)}
                        />
                      </div>
                    ))}
                    <div className="resume-field">
                      <label className="resume-field__label">Years of Experience</label>
                      <input
                        className="resume-field__input"
                        type="number"
                        min={0}
                        value={draft.years_of_experience ?? ''}
                        onChange={(event) =>
                          updateDraft(
                            'years_of_experience',
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="resume-field">
                    <label className="resume-field__label">Summary</label>
                    <textarea
                      className="resume-field__textarea"
                      rows={5}
                      value={draft.summary ?? ''}
                      onChange={(event) => updateDraft('summary', event.target.value || null)}
                    />
                  </div>
                </section>

                <section className="resume-import__section">
                  <div className="resume-import__section-head">
                    <h4>Target Roles</h4>
                  </div>
                  <div className="resume-import__chips-editor">
                    <div className="resume-import__chips-composer">
                      <input
                        className="resume-field__input"
                        value={tagInput.roles}
                        onChange={(event) =>
                          setTagInput((current) => ({ ...current, roles: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            updateDraft(
                              'target_roles',
                              dedupe([...draft.target_roles, tagInput.roles]),
                            )
                            setTagInput((current) => ({ ...current, roles: '' }))
                          }
                        }}
                        placeholder="Add a target role"
                      />
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => {
                          updateDraft(
                            'target_roles',
                            dedupe([...draft.target_roles, tagInput.roles]),
                          )
                          setTagInput((current) => ({ ...current, roles: '' }))
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="resume-import__chips">
                      {draft.target_roles.map((role) => (
                        <span key={role} className="resume-import__chip">
                          {role}
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                'target_roles',
                                draft.target_roles.filter((currentRole) => currentRole !== role),
                              )
                            }
                            aria-label={`Remove ${role}`}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="resume-import__section">
                  <div className="resume-import__section-head">
                    <h4>Experience</h4>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() =>
                        updateDraft('experiences', [
                          ...draft.experiences,
                          {
                            company_name: null,
                            title: null,
                            start_date: null,
                            end_date: null,
                            description: [],
                          },
                        ])
                      }
                    >
                      Add Experience
                    </button>
                  </div>
                  <div className="resume-import__stack">
                    {draft.experiences.map((experience, index) => (
                      <div key={`experience-${index}`} className="resume-import__card">
                        <div className="resume-import__card-head">
                          <strong>{expLabel(experience) || 'New experience'}</strong>
                          <button
                            type="button"
                            className="resume-import__card-remove"
                            onClick={() =>
                              updateDraft(
                                'experiences',
                                draft.experiences.filter(
                                  (_, currentIndex) => currentIndex !== index,
                                ),
                              )
                            }
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="resume-form-grid">
                          <div className="resume-field">
                            <label className="resume-field__label">Title</label>
                            <input
                              className="resume-field__input"
                              value={experience.title ?? ''}
                              onChange={(event) =>
                                updateDraft(
                                  'experiences',
                                  draft.experiences.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, title: event.target.value || null }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Company</label>
                            <input
                              className="resume-field__input"
                              value={experience.company_name ?? ''}
                              onChange={(event) =>
                                updateDraft(
                                  'experiences',
                                  draft.experiences.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, company_name: event.target.value || null }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Start Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={toMonthInput(experience.start_date)}
                              onChange={(event) =>
                                updateDraft(
                                  'experiences',
                                  draft.experiences.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...current,
                                          start_date: fromMonthInput(event.target.value),
                                        }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">End Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={toMonthInput(experience.end_date)}
                              onChange={(event) =>
                                updateDraft(
                                  'experiences',
                                  draft.experiences.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, end_date: fromMonthInput(event.target.value) }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="resume-field">
                          <label className="resume-field__label">Description</label>
                          <textarea
                            className="resume-field__textarea"
                            rows={4}
                            value={experience.description.join('\n')}
                            onChange={(event) =>
                              updateDraft(
                                'experiences',
                                draft.experiences.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        description: event.target.value
                                          .split('\n')
                                          .map((line) => line.trim())
                                          .filter(Boolean),
                                      }
                                    : current,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="resume-import__section">
                  <div className="resume-import__section-head">
                    <h4>Education</h4>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() =>
                        updateDraft('educations', [
                          ...draft.educations,
                          {
                            institution: null,
                            degree: null,
                            field_of_study: null,
                            start_date: null,
                            end_date: null,
                          },
                        ])
                      }
                    >
                      Add Education
                    </button>
                  </div>
                  <div className="resume-import__stack">
                    {draft.educations.map((education, index) => (
                      <div key={`education-${index}`} className="resume-import__card">
                        <div className="resume-import__card-head">
                          <strong>{eduLabel(education) || 'New education'}</strong>
                          <button
                            type="button"
                            className="resume-import__card-remove"
                            onClick={() =>
                              updateDraft(
                                'educations',
                                draft.educations.filter(
                                  (_, currentIndex) => currentIndex !== index,
                                ),
                              )
                            }
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="resume-form-grid">
                          <div className="resume-field">
                            <label className="resume-field__label">Institution</label>
                            <input
                              className="resume-field__input"
                              value={education.institution ?? ''}
                              onChange={(event) =>
                                updateDraft(
                                  'educations',
                                  draft.educations.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, institution: event.target.value || null }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Degree</label>
                            <input
                              className="resume-field__input"
                              value={education.degree ?? ''}
                              onChange={(event) =>
                                updateDraft(
                                  'educations',
                                  draft.educations.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, degree: event.target.value || null }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Field of Study</label>
                            <input
                              className="resume-field__input"
                              value={education.field_of_study ?? ''}
                              onChange={(event) =>
                                updateDraft(
                                  'educations',
                                  draft.educations.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, field_of_study: event.target.value || null }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">Start Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={toMonthInput(education.start_date)}
                              onChange={(event) =>
                                updateDraft(
                                  'educations',
                                  draft.educations.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...current,
                                          start_date: fromMonthInput(event.target.value),
                                        }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="resume-field">
                            <label className="resume-field__label">End Date</label>
                            <input
                              className="resume-field__input"
                              type="month"
                              value={toMonthInput(education.end_date)}
                              onChange={(event) =>
                                updateDraft(
                                  'educations',
                                  draft.educations.map((current, currentIndex) =>
                                    currentIndex === index
                                      ? { ...current, end_date: fromMonthInput(event.target.value) }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="resume-import__section">
                  <div className="resume-import__section-head">
                    <h4>Skills</h4>
                  </div>
                  <div className="resume-import__chips-editor">
                    <div className="resume-import__chips-composer">
                      <input
                        className="resume-field__input"
                        value={tagInput.skills}
                        onChange={(event) =>
                          setTagInput((current) => ({ ...current, skills: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            updateDraft(
                              'skills',
                              dedupe([
                                ...draft.skills.map((skill) => skill.skill_name),
                                tagInput.skills,
                              ]).map((skill_name) => ({ skill_name })),
                            )
                            setTagInput((current) => ({ ...current, skills: '' }))
                          }
                        }}
                        placeholder="Add a skill"
                      />
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => {
                          updateDraft(
                            'skills',
                            dedupe([
                              ...draft.skills.map((skill) => skill.skill_name),
                              tagInput.skills,
                            ]).map((skill_name) => ({ skill_name })),
                          )
                          setTagInput((current) => ({ ...current, skills: '' }))
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="resume-import__chips">
                      {draft.skills.map((skill) => (
                        <span key={skill.skill_name} className="resume-import__chip">
                          {skill.skill_name}
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                'skills',
                                draft.skills.filter(
                                  (current) => current.skill_name !== skill.skill_name,
                                ),
                              )
                            }
                            aria-label={`Remove ${skill.skill_name}`}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          {error ? <div className="resume-field__error">{error}</div> : <span />}
          <div className="resume-import__footer-actions">
            <button
              type="button"
              className="btn btn--ghost btn--danger btn--sm"
              onClick={handleClose}
              disabled={isBusy}
            >
              Cancel
            </button>
            {draft ? (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={isCommitting}
                onClick={() => void handleCommit()}
              >
                {isCommitting ? (
                  <>
                    <LoaderCircle className="resume-import__spinner" size={14} aria-hidden="true" />
                    Applying...
                  </>
                ) : (
                  'Apply Import'
                )}
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleFile(file)
            }
            event.currentTarget.value = ''
          }}
        />
      </div>
    </div>
  )
}
