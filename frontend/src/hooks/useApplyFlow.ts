import { useCallback, useState } from 'react'

import { notify } from '@/lib/notify'
import { useApplyToJobMutation } from '@/store/services/applicationsApi'
import {
  type GapAnalysisResult,
  type PatchedFieldDiff,
  useAnalyzeResumeGapMutation,
  useAutoPatchResumeMutation,
  useCommitPendingPatchMutation,
  useDiscardPendingPatchMutation,
} from '@/store/services/resumeGapApi'

export type FlowStep =
  | 'review'
  | 'analyzing'
  | 'gap_results'
  | 'patching'
  | 'patch_preview'
  | 'committing_patch'
  | 'submitting'

const LAST_RESUME_KEY = 'convexhire:lastAppliedResumeId'

export function readLastResumeId(): string | null {
  try {
    return window.localStorage.getItem(LAST_RESUME_KEY)
  } catch {
    return null
  }
}

function rememberResumeId(resumeId: string) {
  try {
    window.localStorage.setItem(LAST_RESUME_KEY, resumeId)
  } catch {
    // Storage unavailable (private mode); remembering is only a convenience.
  }
}

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
  const [step, setStep] = useState<FlowStep>('review')
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null)
  const [patchedFields, setPatchedFields] = useState<string[]>([])
  const [patchedDiffs, setPatchedDiffs] = useState<PatchedFieldDiff[]>([])
  const [patchMessage, setPatchMessage] = useState<string>('')
  const [isPatching, setIsPatching] = useState(false)
  const [hasPendingPatch, setHasPendingPatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareSettings, setShareSettings] = useState<ShareSettingsDraft>(DEFAULT_SHARE_SETTINGS)

  const [analyzeResumeGap] = useAnalyzeResumeGapMutation()
  const [autoPatchResume] = useAutoPatchResumeMutation()
  const [commitPendingPatch] = useCommitPendingPatchMutation()
  const [discardPendingPatch] = useDiscardPendingPatchMutation()
  const [applyToJob] = useApplyToJobMutation()

  const selectResume = useCallback((resumeId: string) => {
    setSelectedResumeId(resumeId)
    setGapResult(null)
    setPatchedFields([])
    setPatchedDiffs([])
    setPatchMessage('')
    setHasPendingPatch(false)
    setError(null)
  }, [])

  const handleBackToReview = useCallback(() => {
    setError(null)
    setStep('review')
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
      notify.error(message)
      setStep('review')
    }
  }, [analyzeResumeGap, jobId, selectedResumeId])

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
      setStep('patch_preview')
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Resume update failed. You can still apply with the current resume.'
      setError(message)
      notify.error(message)
      setIsPatching(false)
      setStep('gap_results')
    }
  }, [autoPatchResume, gapResult, jobId, selectedResumeId])

  const handleConfirmPatch = useCallback(async () => {
    if (!selectedResumeId) return

    setStep('committing_patch')
    setError(null)

    try {
      await commitPendingPatch({
        resume_id: selectedResumeId,
        job_id: jobId,
      }).unwrap()
      setHasPendingPatch(false)
      notify.success('Resume updated. Submit when you are ready.')
      setStep('review')
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Failed to update resume. Please try again.'
      setError(message)
      notify.error(message)
      setStep('patch_preview')
    }
  }, [commitPendingPatch, jobId, selectedResumeId])

  const handleCancelPatch = useCallback(async () => {
    setError(null)
    if (selectedResumeId) {
      try {
        await discardPendingPatch({
          resume_id: selectedResumeId,
          job_id: jobId,
        }).unwrap()
      } catch {
        // Silent: pending patch TTLs out anyway
      }
    }
    setPatchedFields([])
    setPatchedDiffs([])
    setPatchMessage('')
    setHasPendingPatch(false)
    setStep('gap_results')
  }, [discardPendingPatch, jobId, selectedResumeId])

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
      rememberResumeId(selectedResumeId)
      onSuccess()
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        'Failed to submit application.'
      setError(message)
      notify.error(message)
      setStep('review')
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
    hasPendingPatch,
    selectResume,
    handleBackToReview,
    handleAnalyze,
    handleAutoPatch,
    handleConfirmPatch,
    handleCancelPatch,
    handleSubmit,
    updateShareSetting,
  }
}
