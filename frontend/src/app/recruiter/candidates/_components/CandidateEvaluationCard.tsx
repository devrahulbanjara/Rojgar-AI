'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import {
  type CombinedEvaluation,
  useGetCombinedEvaluationQuery,
  useRunLlmEvaluationMutation,
  useSubmitHumanEvaluationMutation,
} from '@/store/services/evaluationApi'
import { useGetRecordingsQuery } from '@/store/services/recordingsApi'

import ButtonSpinner from '@/components/common/ButtonSpinner'

import styles from './CandidateEvaluationCard.module.css'

interface Props {
  applicationId: string
}

function getScoreTone(score: number | null) {
  if (score == null) return ''
  if (score >= 75) return styles.scoreGood
  if (score >= 50) return styles.scoreOkay
  return styles.scoreLow
}

function EvaluationForm({
  applicationId,
  evaluation,
  onRefresh,
}: {
  applicationId: string
  evaluation: CombinedEvaluation
  onRefresh: () => void
}) {
  const [submitHumanEvaluation, { isLoading: isSaving }] = useSubmitHumanEvaluationMutation()
  const [runLlmEvaluation, { isLoading: isRunningLlm }] = useRunLlmEvaluationMutation()
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      (evaluation.schema?.criteria ?? []).map((criterion) => [
        criterion.key,
        evaluation.human?.scores?.[criterion.key] ?? 0,
      ]),
    ),
  )
  const [notes, setNotes] = useState(() => evaluation.human?.notes ?? '')

  async function handleSave() {
    if (!evaluation.schema) {
      toast.error('Create the job evaluation schema first.')
      return
    }

    try {
      await submitHumanEvaluation({
        applicationId,
        scores,
        notes,
      }).unwrap()
      toast.success('Human evaluation saved.')
      onRefresh()
    } catch {
      toast.error('Could not save the human evaluation.')
    }
  }

  async function handleRunLlm() {
    try {
      await runLlmEvaluation(applicationId).unwrap()
      toast.success('LLM evaluation complete.')
      onRefresh()
    } catch {
      toast.error('Could not run the LLM evaluation.')
    }
  }

  return (
    <>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Human Score</span>
          <span
            className={`${styles.summaryValue} ${getScoreTone(evaluation.human?.weighted_total ?? null)}`}
          >
            {evaluation.human?.weighted_total != null
              ? `${evaluation.human.weighted_total}/100`
              : '-'}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>LLM Score</span>
          <span
            className={`${styles.summaryValue} ${getScoreTone(evaluation.llm?.weighted_total ?? null)}`}
          >
            {evaluation.llm?.weighted_total != null ? `${evaluation.llm.weighted_total}/100` : '-'}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span
            className={`${styles.summaryValue} ${getScoreTone(evaluation.final_score ?? null)}`}
          >
            {evaluation.final_score != null ? `${evaluation.final_score}/100` : '-'}
          </span>
          <span className={styles.summaryLabel}>Final Score</span>
        </div>
      </div>

      <div className={styles.criteriaList}>
        {evaluation.schema?.criteria.map((criterion) => (
          <div key={criterion.key} className={styles.criterionRow}>
            <div className={styles.criterionMeta}>
              <div className={styles.criterionLabel}>{criterion.label}</div>
              <div className={styles.criterionHint}>
                Key: {criterion.key} | Max {criterion.max_score} | Weight {criterion.weight}
              </div>
            </div>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={criterion.max_score}
              value={scores[criterion.key] ?? 0}
              onChange={(event) =>
                setScores((current) => ({
                  ...current,
                  [criterion.key]: Number(event.target.value || 0),
                }))
              }
            />
          </div>
        ))}
      </div>

      <label>
        <span className={styles.summaryLabel}>Recruiter Notes</span>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add context from the live interview, concerns, or strengths."
        />
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => void handleSave()}
          disabled={isSaving}
        >
          {isSaving ? <ButtonSpinner label="Saving..." /> : 'Save Human Scores'}
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => void handleRunLlm()}
          disabled={isRunningLlm}
        >
          {isRunningLlm ? <ButtonSpinner label="Running..." /> : 'Run LLM Evaluation'}
        </button>
      </div>

      <div className={styles.notesList}>
        {evaluation.human?.notes ? (
          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>Recruiter Notes</p>
            <p className={styles.noteText}>{evaluation.human.notes}</p>
          </div>
        ) : null}
        {evaluation.llm?.notes ? (
          <div className={styles.noteCard}>
            <p className={styles.noteTitle}>LLM Summary</p>
            <p className={styles.noteText}>{evaluation.llm.notes}</p>
          </div>
        ) : null}
      </div>
    </>
  )
}

export default function CandidateEvaluationCard({ applicationId }: Props) {
  const { data: combinedResp, isLoading, refetch } = useGetCombinedEvaluationQuery(applicationId)
  const { data: recordingsResp } = useGetRecordingsQuery(applicationId)

  const evaluation = combinedResp?.data
  const transcriptExists = useMemo(
    () => (recordingsResp?.data ?? []).some((recording) => Boolean(recording.transcript)),
    [recordingsResp?.data],
  )

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">Interview evaluation</div>
          <div className="dash-card__subtitle">
            Score the transcript with the recruiter schema, then blend it with the LLM score.
          </div>
        </div>
      </div>

      <div className={`dash-card__body ${styles.cardBody}`}>
        {isLoading ? (
          <div className={styles.emptyState}>Loading evaluation...</div>
        ) : !evaluation?.schema ? (
          <div className={styles.emptyState}>
            This job does not have an evaluation schema yet. Add it from the job page before scoring
            candidates.
          </div>
        ) : !transcriptExists ? (
          <div className={styles.emptyState}>
            A transcript is required before structured evaluation can start. Upload and transcribe
            the interview recording first.
          </div>
        ) : (
          <EvaluationForm
            key={`${evaluation.schema.version}-${evaluation.human?.updated_at ?? 'fresh'}-${evaluation.llm?.updated_at ?? 'fresh'}`}
            applicationId={applicationId}
            evaluation={evaluation}
            onRefresh={() => void refetch()}
          />
        )}
      </div>
    </div>
  )
}
