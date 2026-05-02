import { useCallback, useState } from 'react'

import { useApplyToJobMutation } from '@/store/services/applicationsApi'
import {
  type GapAnalysisResult,
  type PatchedFieldDiff,
  useAnalyzeResumeGapMutation,
  useAutoPatchResumeMutation,
} from '@/store/services/resumeGapApi'

export type FlowStep =
  | 'select_resume'
  | 'gap_choice'
  | 'analyzing'
  | 'gap_results'
  | 'patching'
  | 'patch_done'
  | 'share_profile'
  | 'submitting'

export interface ShareSettingsDraft {
  share_profile_all: boolean
  share_avatar: boolean
  share_email: boolean
  share_phone: boolean
  share_location: boolean
  share_links: boolean
  share_headline_summary: boolean
}

const DEFAULT_SHARE_SETTINGS: ShareSettingsDraft = {
  share_profile_all: true,
  share_avatar: true,
  share_email: true,
  share_phone: true,
  share_location: true,
  share_links: true,
  share_headline_summary: true,
}

interface UseApplyFlowOptions {
  jobId: string
  onSuccess: () => void
}

export function useApplyFlow({ jobId, onSuccess }: UseApplyFlowOptions) {
  const [step, setStep] = useState<FlowStep>('select_resume')
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null)
  const [patchedFields, setPatchedFields] = useState<string[]>([])
  const [patchedDiffs, setPatchedDiffs] = useState<PatchedFieldDiff[]>([])
  const [patchMessage, setPatchMessage] = useState<string>('')
  const [isPatching, setIsPatching] = useState(false)
  const [hasPendingPatch, setHasPendingPatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareSettings, setShareSettings] = useState<ShareSettingsDraft>(DEFAULT_SHARE_SETTINGS)
  const [shareReturnStep, setShareReturnStep] = useState<
    'gap_choice' | 'gap_results' | 'patch_done'
  >('gap_choice')

  const [analyzeResumeGap] = useAnalyzeResumeGapMutation()
  const [autoPatchResume] = useAutoPatchResumeMutation()
  const [applyToJob] = useApplyToJobMutation()

  const handleResumeConfirmed = useCallback((resumeId: string) => {
    setSelectedResumeId(resumeId)
    setGapResult(null)
    setPatchedFields([])
    setPatchedDiffs([])
    setPatchMessage('')
    setIsPatching(false)
    setHasPendingPatch(false)
    setShareSettings(DEFAULT_SHARE_SETTINGS)
    setError(null)
    setStep('gap_choice')
  }, [])

  const handleBackToChoice = useCallback(() => {
    setError(null)
    setStep('gap_choice')
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!selectedResumeId) return

    setStep('analyzing')
    setError(null)

    try {
      const response = await analyzeResumeGap({
        resume_id: selectedResumeId,
        job_id: jobId,
      }).unwrap()
      setGapResult(response.data)
      setStep('gap_results')
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Gap analysis failed. You can still apply directly.'
      setError(message)
      setStep('gap_choice')
    }
  }, [analyzeResumeGap, jobId, selectedResumeId])

  const handleOpenShareStep = useCallback(
    (fromStep: 'gap_choice' | 'gap_results' | 'patch_done') => {
      setShareReturnStep(fromStep)
      setError(null)
      setStep('share_profile')
    },
    [],
  )

  const handleAutoPatch = useCallback(async () => {
    if (!selectedResumeId || !gapResult) return

    setStep('patching')
    setIsPatching(true)
    setPatchedFields([])
    setPatchedDiffs([])
    setPatchMessage('')
    setError(null)

    try {
      const response = await autoPatchResume({
        resume_id: selectedResumeId,
        job_id: jobId,
        gap_result: gapResult,
      }).unwrap()
      setPatchedFields(response.data.updated_fields)
      setPatchedDiffs(response.data.diffs)
      setPatchMessage(response.data.message)
      setHasPendingPatch(response.data.updated_fields.length > 0)
      setIsPatching(false)
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Resume update failed. You can still apply with the current resume.'
      setError(message)
      setIsPatching(false)
      setStep('gap_results')
    }
  }, [autoPatchResume, gapResult, jobId, selectedResumeId])

  const handleBackFromShare = useCallback(() => {
    setStep(shareReturnStep)
  }, [shareReturnStep])

  const updateShareSetting = useCallback(
    <K extends keyof ShareSettingsDraft>(key: K, value: ShareSettingsDraft[K]) => {
      setShareSettings((prev) => {
        if (key === 'share_email') {
          return {
            ...prev,
            share_email: true,
          }
        }

        if (key === 'share_profile_all') {
          return value ? DEFAULT_SHARE_SETTINGS : { ...prev, share_profile_all: false }
        }

        return {
          ...prev,
          share_profile_all: false,
          share_email: true,
          [key]: value,
        }
      })
    },
    [],
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedResumeId) return

    setStep('submitting')
    setError(null)

    try {
      await applyToJob({
        job_id: jobId,
        resume_id: selectedResumeId,
        ...shareSettings,
        apply_pending_patch: hasPendingPatch,
      }).unwrap()
      onSuccess()
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Failed to submit application.'
      setError(message)
      setStep('share_profile')
    }
  }, [applyToJob, hasPendingPatch, jobId, onSuccess, selectedResumeId, shareSettings])

  return {
    step,
    selectedResumeId,
    gapResult,
    patchedFields,
    patchedDiffs,
    patchMessage,
    isPatching,
    shareSettings,
    error,
    handleResumeConfirmed,
    handleBackToChoice,
    handleBackFromShare,
    handleAnalyze,
    handleOpenShareStep,
    handleAutoPatch,
    handleSubmit,
    updateShareSetting,
  }
}
