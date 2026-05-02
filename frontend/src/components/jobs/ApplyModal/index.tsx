'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useApplyFlow } from '@/hooks/useApplyFlow'
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
      title: 'Updating your resume',
      subtitle: 'Applying safe AI suggestions to your selected resume for this job.',
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
      toast.success('Application submitted successfully!')
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
    'patch_done',
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
              <StepGapResults
                onApplyAnyway={() => flow.handleOpenShareStep('gap_results')}
                onAutoPatch={flow.handleAutoPatch}
                onBack={flow.handleBackToChoice}
                result={flow.gapResult}
              />
            ) : null}

            {flow.step === 'patching' ? (
              <StepPatching
                isPatching={flow.patchedFields.length === 0}
                onContinue={flow.handleSubmit}
                patchedFields={flow.patchedFields}
                patchedDiffs={flow.patchedDiffs}
              />
            ) : null}

            {flow.step === 'share_profile' ? (
              <StepShareProfile
                onBack={flow.handleBackFromShare}
                onSubmit={flow.handleSubmit}
                onToggle={flow.updateShareSetting}
                settings={flow.shareSettings}
                submitting={false}
              />
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
            <button className="btn btn--primary btn--full" onClick={flow.handleAutoPatch} type="button">
              Let AI update my resume
            </button>
            <button className="btn btn--secondary btn--full" onClick={() => flow.handleOpenShareStep('gap_results')} type="button">
              Apply with current resume
            </button>
            <button className="btn btn--ghost" onClick={flow.handleBackToChoice} type="button">
              Back
            </button>
          </div>
        ) : null}

        {flow.step === 'share_profile' ? (
          <div className={styles.applyModal__footer}>
            <button className="btn btn--primary btn--full" onClick={flow.handleSubmit} type="button">
              Submit application
            </button>
            <button className="btn btn--secondary btn--full" onClick={flow.handleBackFromShare} type="button">
              Back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
