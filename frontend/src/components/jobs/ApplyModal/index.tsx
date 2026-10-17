'use client'

import { useEffect, useMemo, useState } from 'react'

import { usePathname } from 'next/navigation'

import { readLastResumeId, useApplyFlow } from '@/hooks/useApplyFlow'
import { notify } from '@/lib/notify'
import { useCreateResumeMutation, useGetMyResumesQuery } from '@/store/services/resumeApi'
import { X } from 'lucide-react'

import StepAnalyzing from './StepAnalyzing'
import StepGapResults from './StepGapResults'
import StepPatching from './StepPatching'
import StepReview from './StepReview'
import styles from './applyModal.module.scss'

interface ApplyModalProps {
  isOpen: boolean
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess?: () => void
}

const STEP_ORDER = ['review', 'gap_results', 'patch_preview'] as const

function resolveStepTitle(step: string, jobTitle: string) {
  if (step === 'analyzing') {
    return {
      eyebrow: 'Fit check',
      title: 'Analyzing your resume',
      subtitle: 'We are comparing your resume with the job requirements right now.',
    }
  }

  if (step === 'gap_results') {
    return {
      eyebrow: 'Fit check',
      title: 'Resume gap analysis',
      subtitle: 'Submit now, or let AI suggest safe improvements first.',
    }
  }

  if (step === 'patching') {
    return {
      eyebrow: 'Fit check',
      title: 'Preparing proposed changes',
      subtitle: 'Drafting safe AI suggestions for you to review before anything is saved.',
    }
  }

  if (step === 'patch_preview') {
    return {
      eyebrow: 'Fit check',
      title: 'Review proposed changes',
      subtitle: 'Nothing is saved until you choose. Apply with these changes in one click.',
    }
  }

  if (step === 'committing_patch') {
    return {
      eyebrow: 'Fit check',
      title: 'Updating your resume',
      subtitle: 'Saving the confirmed AI suggestions to your resume.',
    }
  }

  if (step === 'submitting') {
    return {
      eyebrow: 'Submitting',
      title: 'Applying to the job',
      subtitle: 'Submitting your application and selected resume to the recruiter.',
    }
  }

  return {
    eyebrow: 'Apply',
    title: `Apply to ${jobTitle}`,
    subtitle: 'Submit now, or check your fit with AI first.',
  }
}

export default function ApplyModal({
  isOpen,
  jobId,
  jobTitle,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const { data: resumesResponse, isLoading: loadingResumes } = useGetMyResumesQuery(undefined, {
    skip: !isOpen,
  })
  const resumes = useMemo(() => resumesResponse?.data ?? [], [resumesResponse])
  const pathname = usePathname()
  const [createResume, { isLoading: creatingResume }] = useCreateResumeMutation()

  const flow = useApplyFlow({
    jobId,
    onSuccess: () => {
      notify.success('Application submitted successfully!')
      onSuccess?.()
      onClose()
    },
  })

  const { selectResume, selectedResumeId } = flow

  // Pre-select the resume used last time, falling back to the most recent one,
  // so a repeat application is a single "Submit" click.
  useEffect(() => {
    if (!isOpen || resumes.length === 0) return
    if (selectedResumeId && resumes.some((resume) => resume.id === selectedResumeId)) return
    const lastId = readLastResumeId()
    const remembered = resumes.find((resume) => resume.id === lastId)
    const newest = [...resumes].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0]
    selectResume((remembered ?? newest).id)
  }, [isOpen, resumes, selectResume, selectedResumeId])

  const handleCreateFromProfile = async () => {
    try {
      const response = await createResume({
        resume_name: 'My Resume',
        fork_from_profile: true,
      }).unwrap()
      selectResume(response.data.id)
    } catch {
      notify.error('Could not create a resume from your profile. Try importing a PDF.')
    }
  }

  const stepMeta = useMemo(() => resolveStepTitle(flow.step, jobTitle), [flow.step, jobTitle])
  const activeStepIndex = STEP_ORDER.findIndex((step) => step === flow.step)
  const isWideStep = [
    'analyzing',
    'patching',
    'patch_preview',
    'committing_patch',
    'submitting',
  ].includes(flow.step)
  const isResultsStep = flow.step === 'gap_results'
  const isScrollableStep = flow.step === 'review'
  const canSubmit = Boolean(selectedResumeId) && resumes.length > 0

  useEffect(() => {
    if (!isOpen) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={`modal-backdrop ${styles.applyModal__backdrop}`}
      onClick={onClose}
      onWheel={(event) => {
        if (event.target === event.currentTarget) event.preventDefault()
      }}
    >
      <div
        aria-labelledby="apply-flow-title"
        aria-modal="true"
        className={`modal ${styles.applyModal__modal} ${
          isWideStep ? styles['applyModal__modal--wide'] : ''
        } ${isResultsStep ? styles['applyModal__modal--results'] : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal__header">
          <div className={styles.applyModal__titleWrap}>
            <div className={styles.applyModal__eyebrow}>{stepMeta.eyebrow}</div>
            <div className="modal__title" id="apply-flow-title">
              {stepMeta.title}
            </div>
            <p className={styles.applyModal__subtitle}>{stepMeta.subtitle}</p>
            <div className={styles.applyModal__progress} aria-hidden="true">
              {STEP_ORDER.map((step, index) => {
                const isActive = activeStepIndex === index
                const isDone = activeStepIndex > index

                return (
                  <span
                    className={`${styles.applyModal__progressDot} ${
                      isActive ? styles['applyModal__progressDot--active'] : ''
                    } ${!isActive && isDone ? styles['applyModal__progressDot--done'] : ''}`}
                    key={step}
                  />
                )
              })}
            </div>
          </div>
          <button aria-label="Close" className="btn btn--icon btn--sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div
          className={`modal__body ${isScrollableStep ? 'modal__body--scroll' : ''} ${
            isWideStep || isResultsStep
              ? styles['applyModal__body--wide']
              : styles.applyModal__bodyFrame
          }`}
        >
          <div className={styles.applyModal__shell}>
            {flow.error ? <div className={styles.applyModal__alert}>{flow.error}</div> : null}

            {flow.step === 'review' ? (
              <StepReview
                creatingFromProfile={creatingResume}
                hasPendingPatch={flow.hasPendingPatch}
                importHref={`/candidate/profile?import=1&next=${encodeURIComponent(
                  `${pathname}?apply=1`,
                )}`}
                loading={loadingResumes}
                onCreateFromProfile={() => void handleCreateFromProfile()}
                onSelect={selectResume}
                onToggleShare={flow.updateShareSetting}
                resumes={resumes}
                selectedResumeId={selectedResumeId}
                shareSettings={flow.shareSettings}
              />
            ) : null}

            {flow.step === 'analyzing' ? <StepAnalyzing /> : null}

            {flow.step === 'gap_results' && flow.gapResult ? (
              <StepGapResults result={flow.gapResult} />
            ) : null}

            {flow.step === 'patching' ? <StepPatching mode="loading" /> : null}

            {flow.step === 'patch_preview' ? (
              <StepPatching
                mode="preview"
                message={flow.patchMessage}
                patchedDiffs={flow.patchedDiffs}
              />
            ) : null}

            {flow.step === 'committing_patch' ? <StepPatching mode="committing" /> : null}

            {flow.step === 'submitting' ? (
              <StepAnalyzing
                title="Submitting your application"
                subtitle="Sending your resume and profile details to the recruiter."
              />
            ) : null}
          </div>
        </div>

        {flow.step === 'review' && canSubmit ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={() => void flow.handleSubmit()}
              type="button"
            >
              Submit application
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={() => void flow.handleAnalyze()}
              type="button"
            >
              Check my fit first (AI)
            </button>
          </div>
        ) : null}

        {flow.step === 'gap_results' && flow.gapResult ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={() => void flow.handleSubmit()}
              type="button"
            >
              Submit with current resume
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={() => void flow.handleAutoPatch()}
              type="button"
            >
              Let AI improve my resume
            </button>
            <button className="btn btn--ghost" onClick={flow.handleBackToReview} type="button">
              Back
            </button>
          </div>
        ) : null}

        {flow.step === 'patch_preview' ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={() => void flow.handleSubmit()}
              type="button"
              disabled={flow.patchedDiffs.length === 0}
            >
              Apply with these changes
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={() => void flow.handleConfirmPatch()}
              type="button"
              disabled={flow.patchedDiffs.length === 0}
            >
              Save to resume only
            </button>
            <button
              className="btn btn--ghost btn--full"
              onClick={() => void flow.handleCancelPatch()}
              type="button"
            >
              Discard changes
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
