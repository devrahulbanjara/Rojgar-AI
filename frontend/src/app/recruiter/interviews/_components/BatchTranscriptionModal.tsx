'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import {
  useBatchTranscribeMutation,
  useGetBatchTranscribeCandidatesQuery,
} from '@/store/services/recordingsApi'
import { X } from 'lucide-react'

import styles from './BatchTranscriptionModal.module.css'

interface Props {
  jobId: string
  onClose: () => void
}

export default function BatchTranscriptionModal({ jobId, onClose }: Props) {
  const { data: candidatesResp, isLoading } = useGetBatchTranscribeCandidatesQuery(jobId)
  const [batchTranscribe, { isLoading: isRunning }] = useBatchTranscribeMutation()
  const candidates = useMemo(() => candidatesResp?.data ?? [], [candidatesResp?.data])
  const selectable = useMemo(
    () => candidates.filter((candidate) => candidate.can_batch_transcribe),
    [candidates],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hasEditedSelection, setHasEditedSelection] = useState(false)
  const [phase, setPhase] = useState<'select' | 'progress' | 'done'>('select')
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [attemptedIds, setAttemptedIds] = useState<string[]>([])

  const effectiveSelectedIds = hasEditedSelection
    ? selectedIds
    : selectable.map((candidate) => candidate.application_id)

  const failedIds = attemptedIds.filter((id) => !completedIds.includes(id))

  async function runBatch(applicationIds: string[]) {
    setAttemptedIds(applicationIds)
    setPhase('progress')
    try {
      const response = await batchTranscribe({ jobId, applicationIds }).unwrap()
      const transcribed = response.data.map((recording) => recording.application_id)
      setCompletedIds((current) => Array.from(new Set([...current, ...transcribed])))
      setPhase('done')
      const failedCount = applicationIds.length - transcribed.length
      if (failedCount > 0) {
        toast.info(
          `${transcribed.length} transcribed, ${failedCount} failed. The HF Space may have been cold — use Retry failed.`,
        )
      } else {
        toast.success('Batch transcription complete.')
      }
    } catch {
      setPhase('done')
      toast.error('Batch transcription failed.')
    }
  }

  async function handleRun() {
    if (effectiveSelectedIds.length === 0) {
      toast.error('Select at least one candidate to batch transcribe.')
      return
    }
    setCompletedIds([])
    await runBatch(effectiveSelectedIds)
  }

  async function handleRetryFailed() {
    if (failedIds.length === 0) return
    await runBatch(failedIds)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Batch Transcribe</h3>
            <p className={styles.subtitle}>
              Run transcription for the latest uploaded recording on selected candidates in this
              job.
            </p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
            <X size={14} aria-hidden="true" />
            Close
          </button>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div>Loading candidates...</div>
          ) : phase === 'select' ? (
            <div className={styles.list}>
              {candidates.map((candidate) => {
                const checked = effectiveSelectedIds.includes(candidate.application_id)
                const disabled = !candidate.can_batch_transcribe
                return (
                  <label
                    key={candidate.application_id}
                    className={`${styles.row} ${disabled ? styles.rowDisabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        setHasEditedSelection(true)
                        setSelectedIds((current) =>
                          checked
                            ? current.filter((id) => id !== candidate.application_id)
                            : [...current, candidate.application_id],
                        )
                      }}
                    />
                    <div className={styles.candidate}>
                      <span className={styles.candidateName}>{candidate.candidate_name}</span>
                      <span className={styles.candidateMeta}>
                        {candidate.candidate_email}
                        {candidate.latest_recording_duration_seconds != null
                          ? ` | ${candidate.latest_recording_duration_seconds}s`
                          : ''}
                      </span>
                    </div>
                    <span className={styles.status}>
                      {candidate.latest_recording_status ?? 'No recording'}
                    </span>
                    <span className={styles.status}>
                      {candidate.transcript_available ? 'Transcript ready' : 'Needs transcription'}
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className={styles.progressBox}>
              {phase === 'done' && failedIds.length > 0 ? (
                <div className={styles.row}>
                  First request may have woken the model — failed candidates can be retried.
                </div>
              ) : null}
              {attemptedIds.map((applicationId, index) => {
                const candidate = candidates.find((item) => item.application_id === applicationId)
                const isDone = completedIds.includes(applicationId)
                const isActive = isRunning && !isDone && index === completedIds.length
                const stateClass = isDone
                  ? styles.done
                  : isActive
                    ? styles.active
                    : phase === 'done'
                      ? styles.failed
                      : styles.waiting

                return (
                  <div key={applicationId} className={styles.progressRow}>
                    <span>{candidate?.candidate_name ?? applicationId}</span>
                    <span className={stateClass}>
                      {isDone
                        ? 'Done'
                        : isActive
                          ? 'Transcribing...'
                          : phase === 'done'
                            ? 'Failed'
                            : 'Waiting'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>{effectiveSelectedIds.length} selected</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
              Cancel
            </button>
            {phase === 'select' ? (
              <button
                type="button"
                className={`btn btn--primary btn--sm${isRunning ? ' btn--loading' : ''}`}
                onClick={() => void handleRun()}
                disabled={isRunning || effectiveSelectedIds.length === 0}
              >
                {isRunning ? 'Running...' : 'Run transcription'}
              </button>
            ) : phase === 'done' ? (
              <>
                {failedIds.length > 0 ? (
                  <button
                    type="button"
                    className={`btn btn--secondary btn--sm${isRunning ? ' btn--loading' : ''}`}
                    onClick={() => void handleRetryFailed()}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Retrying...' : `Retry failed (${failedIds.length})`}
                  </button>
                ) : null}
                <button type="button" className="btn btn--primary btn--sm" onClick={onClose}>
                  Close
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--primary btn--sm btn--loading" disabled>
                Running...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
