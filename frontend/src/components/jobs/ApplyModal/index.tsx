'use client'

import { useEffect, useMemo, useState } from 'react'

import { useApplyFlow } from '@/hooks/useApplyFlow'
import { notify } from '@/lib/notify'
import { useGetMyResumesQuery } from '@/store/services/resumeApi'
import { X } from 'lucide-react'

import StepAnalyzing from './StepAnalyzing'
import StepGapChoice from './StepGapChoice'
import StepGapResults from './StepGapResults'
import StepPatching from './StepPatching'
import StepSelectResume from './StepSelectResume'
import StepShareProfile from './StepShareProfile'
import styles from './applyModal.module.scss'

interface ApplyModalProps {
  isOpen: boolean
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess?: () => void
}

const STEP_ORDER = ['select_resume', 'gap_choice', 'gap_results', 'share_profile'] as const

function resolveStepTitle(step: string, jobTitle: string) {
  if (step === 'select_resume') {
    return {
      eyebrow: 'Step 1',
      title: `Apply to ${jobTitle}`,
      subtitle: 'Choose your resume first, then decide whether you want a quick AI gap check.',
    }
  }

  if (step === 'gap_choice') {
    return {
      eyebrow: 'Step 2',
      title: 'Before you apply',
      subtitle: 'You can submit immediately, or check how well your selected resume fits this job.',
    }
  }

  if (step === 'analyzing') {
    return {
      eyebrow: 'Step 2',
      title: 'Analyzing your resume',
      subtitle: 'We are comparing your resume with the job requirements right now.',
    }
  }

  if (step === 'gap_results') {
    return {
      eyebrow: 'Step 3',
      title: 'Resume gap analysis',
      subtitle: 'Review the suggestions, improve your resume if you want, or apply as-is.',
    }
  }

  if (step === 'patching') {
    return {
      eyebrow: 'Step 3',
      title: 'Preparing proposed changes',
      subtitle: 'Drafting safe AI suggestions for you to review before anything is saved.',
    }
  }

  if (step === 'patch_preview') {
    return {
      eyebrow: 'Step 3',
      title: 'Review proposed changes',
      subtitle:
        'Nothing has been saved yet. Confirm to apply these updates to your resume, or cancel to keep it as-is.',
    }
  }

  if (step === 'committing_patch') {
    return {
      eyebrow: 'Step 3',
      title: 'Updating your resume',
      subtitle: 'Saving the confirmed AI suggestions to your resume.',
    }
  }

  if (step === 'patch_committed') {
    return {
      eyebrow: 'Step 3',
      title: 'Resume updated',
      subtitle:
        'Your resume has been updated. Apply to this job now, or cancel to keep the changes for later.',
    }
  }

  if (step === 'share_profile') {
    return {
      eyebrow: 'Step 4',
      title: 'Choose what to share',
      subtitle:
        'Your selected resume goes with the application. Here you can control which extra profile details recruiters can see.',
    }
  }

  if (step === 'submitting') {
    return {
      eyebrow: 'Step 4',
      title: 'Applying to the job',
      subtitle: 'Submitting your application and selected resume to the recruiter.',
    }
  }

  return {
    eyebrow: 'Step 4',
    title: 'Ready to submit',
    subtitle: 'Your selected resume is set. Submit the application when you are ready.',
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
  const resumes = resumesResponse?.data ?? []

  const flow = useApplyFlow({
    jobId,
    onSuccess: () => {
      notify.success('Application submitted successfully!')
      onSuccess?.()
      onClose()
    },
  })

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  const stepMeta = useMemo(() => resolveStepTitle(flow.step, jobTitle), [flow.step, jobTitle])
  const activeStepIndex = STEP_ORDER.findIndex((step) => step === flow.step)
  const isScrollableStep = flow.step === 'share_profile'
  const isWideStep = [
    'analyzing',
    'patching',
    'patch_preview',
    'committing_patch',
    'patch_committed',
    'share_profile',
    'submitting',
  ].includes(flow.step)
  const isResultsStep = flow.step === 'gap_results'

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

            {flow.step === 'select_resume' ? (
              <StepSelectResume
                loading={loadingResumes}
                onCancel={onClose}
                onConfirm={() => {
                  if (selectedResumeId) {
                    flow.handleResumeConfirmed(selectedResumeId)
                  }
                }}
                onSelect={setSelectedResumeId}
                resumes={resumes}
                selectedResumeId={selectedResumeId}
              />
            ) : null}

            {flow.step === 'gap_choice' ? (
              <StepGapChoice
                onAnalyze={flow.handleAnalyze}
                onSkip={() => flow.handleOpenShareStep('gap_choice')}
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

            {flow.step === 'patch_committed' ? (
              <StepPatching
                mode="committed"
                message={flow.patchMessage}
                patchedDiffs={flow.patchedDiffs}
              />
            ) : null}

            {flow.step === 'share_profile' ? (
              <StepShareProfile onToggle={flow.updateShareSetting} settings={flow.shareSettings} />
            ) : null}

            {flow.step === 'submitting' ? (
              <StepAnalyzing
                title="Submitting your application"
                subtitle="Sending your resume and profile details to the recruiter."
              />
            ) : null}
          </div>
        </div>

        {flow.step === 'gap_results' && flow.gapResult ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={flow.handleAutoPatch}
              type="button"
            >
              Let AI update my resume
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={() => flow.handleOpenShareStep('gap_results')}
              type="button"
            >
              Apply with current resume
            </button>
            <button className="btn btn--ghost" onClick={flow.handleBackToChoice} type="button">
              Back
            </button>
          </div>
        ) : null}

        {flow.step === 'patch_preview' ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={() => void flow.handleConfirmPatch()}
              type="button"
              disabled={flow.patchedDiffs.length === 0}
            >
              Confirm update
            </button>
            <button
              className="btn btn--ghost btn--full"
              onClick={() => void flow.handleCancelPatch()}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {flow.step === 'patch_committed' ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={() => flow.handleOpenShareStep('patch_committed')}
              type="button"
            >
              Apply now
            </button>
            <button className="btn btn--ghost btn--full" onClick={onClose} type="button">
              Cancel
            </button>
          </div>
        ) : null}

        {flow.step === 'share_profile' ? (
          <div className={styles.applyModal__footer}>
            <button
              className="btn btn--primary btn--full"
              onClick={flow.handleSubmit}
              type="button"
            >
              Submit application
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={flow.handleBackFromShare}
              type="button"
            >
              Back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
