'use client'

import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import {
  type CombinedEvaluation,
  type EvaluationCriterion,
  type HumanEvaluatorScore,
  useCreateHumanEvaluationMutation,
  useDeleteHumanEvaluationMutation,
  useGetCombinedEvaluationQuery,
  useRunLlmEvaluationMutation,
  useUpdateHumanEvaluationMutation,
} from '@/store/services/evaluationApi'
import { useGetRecordingsQuery } from '@/store/services/recordingsApi'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'

import styles from './CandidateEvaluationCard.module.css'

interface Props {
  applicationId: string
}

type DraftState = {
  label: string
  rated: Record<string, boolean>
  scores: Record<string, number>
  notes: string
}

function getScoreTone(score: number | null) {
  if (score == null) return ''
  if (score >= 75) return styles.scoreGood
  if (score >= 50) return styles.scoreOkay
  return styles.scoreLow
}

function fmtScore(value: number | null | undefined) {
  if (value == null) return '-'
  return `${value}/100`
}

function fmtCell(value: number | null | undefined) {
  if (value == null) return null
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function buildDraft(
  criteria: EvaluationCriterion[],
  existing: HumanEvaluatorScore | null,
): DraftState {
  return {
    label: existing?.evaluator_label ?? '',
    rated: Object.fromEntries(
      criteria.map((c) => [c.key, existing ? existing.scores?.[c.key] != null : true]),
    ),
    scores: Object.fromEntries(
      criteria.map((c) => [c.key, Math.max(0, Number(existing?.scores?.[c.key] ?? 0))]),
    ),
    notes: existing?.notes ?? '',
  }
}

function RecruiterRowEditor({
  draft,
  setDraft,
  criteria,
  onSave,
  onCancel,
  isSaving,
  saveLabel,
}: {
  draft: DraftState
  setDraft: (next: DraftState) => void
  criteria: EvaluationCriterion[]
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  saveLabel: string
}) {
  return (
    <div className={styles.editorCard}>
      <label className={styles.editorField}>
        <span className={styles.summaryLabel}>Recruiter name / role</span>
        <input
          className={styles.input}
          type="text"
          placeholder="e.g. Ravi (Tech Lead) or HR — Priya"
          value={draft.label}
          onChange={(event) => setDraft({ ...draft, label: event.target.value })}
        />
      </label>

      <div className={styles.criteriaList}>
        {criteria.map((criterion) => {
          const isRated = draft.rated[criterion.key] ?? true
          return (
            <div key={criterion.key} className={styles.criterionRowToggle}>
              <div className={styles.criterionMeta}>
                <div className={styles.criterionLabel}>{criterion.label}</div>
                <div className={styles.criterionHint}>
                  Max {criterion.max_score} | Weight {criterion.weight}
                </div>
              </div>
              <label className={styles.rateToggle}>
                <input
                  type="checkbox"
                  checked={isRated}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      rated: { ...draft.rated, [criterion.key]: event.target.checked },
                    })
                  }
                />
                Rate this
              </label>
              <input
                className={`${styles.input} ${isRated ? '' : styles.inputDisabled}`}
                type="number"
                min={0}
                max={criterion.max_score}
                value={draft.scores[criterion.key] ?? 0}
                disabled={!isRated}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    scores: {
                      ...draft.scores,
                      [criterion.key]: Number(event.target.value || 0),
                    },
                  })
                }
              />
            </div>
          )
        })}
      </div>

      <label>
        <span className={styles.summaryLabel}>Recruiter notes</span>
        <textarea
          className={styles.textarea}
          value={draft.notes}
          onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
          placeholder="Add context: strengths, concerns, signals from this round."
        />
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? <ButtonSpinner label="Saving..." /> : saveLabel}
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function RecruiterRowView({
  row,
  criteria,
  onEdit,
  onDelete,
  isDeleting,
}: {
  row: HumanEvaluatorScore
  criteria: EvaluationCriterion[]
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const label = row.evaluator_label ?? row.submitted_by?.full_name ?? 'Recruiter'
  return (
    <div className={styles.recruiterCard}>
      <div className={styles.recruiterCardHeader}>
        <div className={styles.evaluatorCell}>
          <span className={styles.evaluatorAvatar}>{initials(label)}</span>
          <div>
            <div className={styles.evaluatorName}>{label}</div>
            <div className={styles.evaluatorEmail}>Total: {fmtScore(row.weighted_total)}</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onEdit}
            aria-label="Edit recruiter row"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete recruiter row"
          >
            {isDeleting ? (
              <ButtonSpinner label="Deleting..." />
            ) : (
              <>
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.recruiterScoreGrid}>
        {criteria.map((criterion) => {
          const value = row.scores?.[criterion.key]
          return (
            <div key={criterion.key} className={styles.recruiterScoreCell}>
              <span className={styles.recruiterScoreLabel}>{criterion.label}</span>
              <span className={styles.recruiterScoreValue}>
                {value == null ? (
                  <span className={styles.cellNull}>not rated</span>
                ) : (
                  `${fmtCell(value)} / ${criterion.max_score}`
                )}
              </span>
            </div>
          )
        })}
      </div>

      {row.notes ? <p className={styles.noteText}>{row.notes}</p> : null}
    </div>
  )
}

function HumansSection({
  applicationId,
  evaluation,
  onRefresh,
}: {
  applicationId: string
  evaluation: CombinedEvaluation
  onRefresh: () => void
}) {
  const criteria = useMemo(() => evaluation.schema?.criteria ?? [], [evaluation.schema])
  const [createHuman, { isLoading: isCreating }] = useCreateHumanEvaluationMutation()
  const [updateHuman, { isLoading: isUpdating }] = useUpdateHumanEvaluationMutation()
  const [deleteHuman, { isLoading: isDeleting }] = useDeleteHumanEvaluationMutation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  function startEdit(row: HumanEvaluatorScore) {
    setEditingId(row.id)
    setDraft(buildDraft(criteria, row))
  }

  function startCreate() {
    setEditingId('__new__')
    setDraft(buildDraft(criteria, null))
  }

  function cancel() {
    setEditingId(null)
    setDraft(null)
  }

  function buildScorePayload(): Record<string, number | null> {
    if (!draft) return {}
    const payload: Record<string, number | null> = {}
    for (const c of criteria) {
      payload[c.key] = draft.rated[c.key] ? Number(draft.scores[c.key] ?? 0) : null
    }
    return payload
  }

  async function handleSave() {
    if (!draft) return
    const label = draft.label.trim()
    if (!label) {
      toast.error('Enter recruiter name (e.g. "Ravi (Tech Lead)").')
      return
    }
    try {
      if (editingId === '__new__') {
        await createHuman({
          applicationId,
          evaluator_label: label,
          scores: buildScorePayload(),
          notes: draft.notes,
        }).unwrap()
        toast.success('Recruiter row added.')
      } else if (editingId) {
        await updateHuman({
          applicationId,
          scoreId: editingId,
          evaluator_label: label,
          scores: buildScorePayload(),
          notes: draft.notes,
        }).unwrap()
        toast.success('Recruiter row updated.')
      }
      cancel()
      onRefresh()
    } catch {
      toast.error('Could not save recruiter row.')
    }
  }

  async function handleDelete(row: HumanEvaluatorScore) {
    const label = row.evaluator_label ?? 'this recruiter'
    if (!confirm(`Delete evaluation row for ${label}?`)) return
    setPendingDeleteId(row.id)
    try {
      await deleteHuman({ applicationId, scoreId: row.id }).unwrap()
      toast.success('Recruiter row deleted.')
      if (editingId === row.id) cancel()
      onRefresh()
    } catch {
      toast.error('Could not delete recruiter row.')
    } finally {
      setPendingDeleteId(null)
    }
  }

  if (!criteria.length) return null

  return (
    <div className={styles.humansSection}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>Recruiter evaluations</div>
          <div className={styles.sectionSubtitle}>
            Add one row per recruiter. Leave any criterion unrated if they did not judge it.
          </div>
        </div>
        {editingId === '__new__' ? null : (
          <button type="button" className="btn btn--primary btn--sm" onClick={startCreate}>
            <Plus size={14} aria-hidden="true" />
            Add recruiter
          </button>
        )}
      </div>

      <div className={styles.recruiterList}>
        {evaluation.humans.length === 0 && editingId !== '__new__' ? (
          <div className={styles.emptyState}>
            No recruiter scores yet. Click <strong>Add recruiter</strong> to enter one.
          </div>
        ) : null}

        {evaluation.humans.map((row) =>
          editingId === row.id && draft ? (
            <RecruiterRowEditor
              key={row.id}
              draft={draft}
              setDraft={setDraft}
              criteria={criteria}
              onSave={() => void handleSave()}
              onCancel={cancel}
              isSaving={isUpdating}
              saveLabel="Update"
            />
          ) : (
            <RecruiterRowView
              key={row.id}
              row={row}
              criteria={criteria}
              onEdit={() => startEdit(row)}
              onDelete={() => void handleDelete(row)}
              isDeleting={isDeleting && pendingDeleteId === row.id}
            />
          ),
        )}

        {editingId === '__new__' && draft ? (
          <RecruiterRowEditor
            draft={draft}
            setDraft={setDraft}
            criteria={criteria}
            onSave={() => void handleSave()}
            onCancel={cancel}
            isSaving={isCreating}
            saveLabel="Save recruiter"
          />
        ) : null}
      </div>

      {evaluation.human_average && evaluation.humans.length > 0 ? (
        <div className={styles.averageStrip}>
          <span>
            Average across {evaluation.human_average.evaluator_count} recruiter
            {evaluation.human_average.evaluator_count === 1 ? '' : 's'}
          </span>
          <span
            className={`${styles.summaryValue} ${getScoreTone(evaluation.human_average.weighted_total)}`}
          >
            {fmtScore(evaluation.human_average.weighted_total)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function LlmCard({
  applicationId,
  evaluation,
  onRefresh,
}: {
  applicationId: string
  evaluation: CombinedEvaluation
  onRefresh: () => void
}) {
  const [runLlmEvaluation, { isLoading: isRunningLlm }] = useRunLlmEvaluationMutation()

  async function handleRunLlm() {
    try {
      await runLlmEvaluation(applicationId).unwrap()
      toast.success('AI recruiter evaluation complete.')
      onRefresh()
    } catch {
      toast.error('Could not run the AI evaluation.')
    }
  }

  return (
    <div className={styles.noteCard}>
      <p className={styles.noteTitle}>AI Recruiter</p>
      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => void handleRunLlm()}
          disabled={isRunningLlm}
        >
          {isRunningLlm ? (
            <ButtonSpinner label="Running..." />
          ) : evaluation.llm ? (
            'Re-run AI evaluation'
          ) : (
            'Run AI evaluation'
          )}
        </button>
      </div>
      {evaluation.llm?.notes ? (
        <p className={styles.noteText} style={{ marginTop: '0.6rem' }}>
          {evaluation.llm.notes}
        </p>
      ) : null}
    </div>
  )
}

function EvaluationBody({
  applicationId,
  evaluation,
  onRefresh,
}: {
  applicationId: string
  evaluation: CombinedEvaluation
  onRefresh: () => void
}) {
  const humanAvg = evaluation.human_average?.weighted_total ?? null
  const llmTotal = evaluation.llm?.weighted_total ?? null
  const finalScore = evaluation.final_score ?? null
  const humanWeight = evaluation.schema?.human_weight ?? 0
  const llmWeight = evaluation.schema?.llm_weight ?? 0

  return (
    <>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Avg Human</span>
          <span className={`${styles.summaryValue} ${getScoreTone(humanAvg)}`}>
            {fmtScore(humanAvg)}
          </span>
          <span className={styles.summaryMeta}>
            {evaluation.human_average?.evaluator_count ?? 0} recruiter
            {evaluation.human_average?.evaluator_count === 1 ? '' : 's'}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>AI Recruiter</span>
          <span className={`${styles.summaryValue} ${getScoreTone(llmTotal)}`}>
            {fmtScore(llmTotal)}
          </span>
          <span className={styles.summaryMeta}>{evaluation.llm ? 'Scored' : 'Not run'}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Final blended</span>
          <span className={`${styles.summaryValue} ${getScoreTone(finalScore)}`}>
            {fmtScore(finalScore)}
          </span>
          <span className={styles.summaryMeta}>
            {Math.round(humanWeight * 100)}% human / {Math.round(llmWeight * 100)}% AI
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Schema version</span>
          <span className={styles.summaryValue}>v{evaluation.schema?.version ?? 0}</span>
          <span className={styles.summaryMeta}>
            {evaluation.schema?.criteria.length ?? 0} criteria
          </span>
        </div>
      </div>

      <HumansSection applicationId={applicationId} evaluation={evaluation} onRefresh={onRefresh} />

      <LlmCard applicationId={applicationId} evaluation={evaluation} onRefresh={onRefresh} />
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
            Add a row for each recruiter who scored this candidate. Final = average of recruiters
            blended with the AI recruiter using the per-job weights.
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
          <EvaluationBody
            applicationId={applicationId}
            evaluation={evaluation}
            onRefresh={() => void refetch()}
          />
        )}
      </div>
    </div>
  )
}
