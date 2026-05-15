'use client'

import { useMemo, useState } from 'react'

import type { EvaluationCriterion } from '@/store/services/evaluationApi'
import { Plus, Trash2 } from 'lucide-react'

import styles from './EvaluationSchemaBuilder.module.css'

export interface EvaluationSchemaDraft {
  criteria: EvaluationCriterion[]
  human_weight: number
  llm_weight: number
}

type CriterionDraft = EvaluationCriterion & { id: string }

export const DEFAULT_EVALUATION_SCHEMA_DRAFT: EvaluationSchemaDraft = {
  criteria: [{ key: '', label: '', max_score: 10, weight: 1 }],
  human_weight: 0.5,
  llm_weight: 0.5,
}

function createCriterionDraft(index: number): CriterionDraft {
  return {
    id: `criterion-${index}`,
    key: '',
    label: '',
    max_score: 10,
    weight: 1,
  }
}

function toSnakeCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function toCriterionDrafts(criteria: EvaluationCriterion[]): CriterionDraft[] {
  if (criteria.length === 0) return [createCriterionDraft(1)]

  return criteria.map((criterion, index) => ({
    ...criterion,
    id: `criterion-${index + 1}`,
  }))
}

function stripDraftId(criterion: CriterionDraft): EvaluationCriterion {
  return {
    key: criterion.key,
    label: criterion.label,
    max_score: criterion.max_score,
    weight: criterion.weight,
  }
}

export function buildEvaluationSchemaPayload(draft: EvaluationSchemaDraft): EvaluationSchemaDraft {
  return {
    criteria: draft.criteria.map((criterion) => ({
      key: toSnakeCase(criterion.key || criterion.label),
      label: criterion.label.trim(),
      max_score: Number(criterion.max_score),
      weight: Number(criterion.weight),
    })),
    human_weight: Number(draft.human_weight),
    llm_weight: Number(draft.llm_weight),
  }
}

export function validateEvaluationSchemaDraft(draft: EvaluationSchemaDraft): string | null {
  const payload = buildEvaluationSchemaPayload(draft)

  if (payload.criteria.length === 0) {
    return 'Add at least one evaluation criterion.'
  }

  if (payload.criteria.some((criterion) => !criterion.label)) {
    return 'Every evaluation criterion needs a label.'
  }

  if (payload.criteria.some((criterion) => !criterion.key)) {
    return 'Every evaluation criterion needs a valid label.'
  }

  const uniqueKeys = new Set(payload.criteria.map((criterion) => criterion.key))
  if (uniqueKeys.size !== payload.criteria.length) {
    return 'Each evaluation criterion label must be unique.'
  }

  if (Math.round((payload.human_weight + payload.llm_weight) * 100) !== 100) {
    return 'Human and LLM weights must add up to 1.0.'
  }

  return null
}

type EvaluationSchemaSetupCardProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  onChange: (draft: EvaluationSchemaDraft) => void
  disabled?: boolean
  initialValue?: EvaluationSchemaDraft
  subtitle?: string
}

export default function EvaluationSchemaSetupCard({
  enabled,
  onEnabledChange,
  onChange,
  disabled = false,
  initialValue = DEFAULT_EVALUATION_SCHEMA_DRAFT,
  subtitle = 'Optionally define the interview scorecard during posting. It can still be edited later from the job page.',
}: EvaluationSchemaSetupCardProps) {
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() =>
    toCriterionDrafts(initialValue.criteria),
  )
  const [humanWeight, setHumanWeight] = useState(initialValue.human_weight)
  const [llmWeight, setLlmWeight] = useState(initialValue.llm_weight)

  const currentDraft = useMemo<EvaluationSchemaDraft>(
    () => ({
      criteria: criteria.map(stripDraftId),
      human_weight: humanWeight,
      llm_weight: llmWeight,
    }),
    [criteria, humanWeight, llmWeight],
  )

  const validationMessage = useMemo(
    () => validateEvaluationSchemaDraft(currentDraft),
    [currentDraft],
  )

  function syncDraft(
    nextCriteria: CriterionDraft[],
    nextHumanWeight = humanWeight,
    nextLlmWeight = llmWeight,
  ) {
    onChange({
      criteria: nextCriteria.map(stripDraftId),
      human_weight: nextHumanWeight,
      llm_weight: nextLlmWeight,
    })
  }

  function updateCriterion(id: string, next: Partial<CriterionDraft>) {
    const updatedCriteria = criteria.map((criterion) => {
      if (criterion.id !== id) return criterion
      const updated = { ...criterion, ...next }
      if ('label' in next) updated.key = toSnakeCase(updated.label)
      return updated
    })
    setCriteria(updatedCriteria)
    syncDraft(updatedCriteria)
  }

  function addCriterion() {
    const updatedCriteria = [...criteria, createCriterionDraft(criteria.length + 1)]
    setCriteria(updatedCriteria)
    syncDraft(updatedCriteria)
  }

  function removeCriterion(id: string) {
    const updatedCriteria =
      criteria.length === 1 ? criteria : criteria.filter((criterion) => criterion.id !== id)
    setCriteria(updatedCriteria)
    syncDraft(updatedCriteria)
  }

  function updateHumanWeight(next: number) {
    const clamped = Math.min(Math.max(next, 0), 1)
    const paired = Number((1 - clamped).toFixed(2))
    setHumanWeight(clamped)
    setLlmWeight(paired)
    syncDraft(criteria, clamped, paired)
  }

  function updateLlmWeight(next: number) {
    const clamped = Math.min(Math.max(next, 0), 1)
    const paired = Number((1 - clamped).toFixed(2))
    setLlmWeight(clamped)
    setHumanWeight(paired)
    syncDraft(criteria, paired, clamped)
  }

  return (
    <section className="job-ai-card job-ai-form dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <div className="dash-card__title">Evaluation Schema</div>
          <div className="dash-card__subtitle">{subtitle}</div>
        </div>
      </div>

      <div className={`job-ai-card__body dash-card__body ${styles.cardBody}`}>
        <div className="job-ai-field job-ai-field--manual">
          <label className="job-editor-toggle" htmlFor="job-evaluation-schema-toggle">
            <div className="job-editor-toggle__copy">
              <span className="job-editor-toggle__title">Set up scorecard now</span>
              <span className="job-editor-toggle__description">
                Turn this on to define the interview scorecard during posting. You can edit it later
                from the job details page.
              </span>
            </div>

            <span className="job-editor-toggle__control">
              <span className="job-editor-toggle__state" aria-hidden="true">
                {enabled ? 'On' : 'Off'}
              </span>
              <span className="job-editor-toggle__switch">
                <input
                  id="job-evaluation-schema-toggle"
                  type="checkbox"
                  className="job-editor-toggle__input"
                  checked={enabled}
                  onChange={(event) => onEnabledChange(event.target.checked)}
                  disabled={disabled}
                />
                <span className="job-editor-toggle__track" aria-hidden="true">
                  <span className="job-editor-toggle__thumb" />
                </span>
              </span>
            </span>
          </label>
        </div>

        {enabled ? (
          <>
            <p className={styles.intro}>
              Recruiters and the LLM will score candidates against the same schema. This schema will
              be saved when the job is posted.
            </p>

            <div className={styles.criteriaList}>
              {criteria.map((criterion) => (
                <div key={criterion.id} className={styles.criteriaRow}>
                  <label className={styles.field}>
                    <span className={styles.label}>Label</span>
                    <input
                      className={styles.input}
                      value={criterion.label}
                      maxLength={120}
                      onChange={(event) =>
                        updateCriterion(criterion.id, { label: event.target.value })
                      }
                      placeholder="Communication"
                      disabled={disabled}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Max Score</span>
                    <input
                      className={styles.input}
                      type="number"
                      min={1}
                      max={100}
                      value={criterion.max_score}
                      onChange={(event) =>
                        updateCriterion(criterion.id, {
                          max_score: Number(event.target.value || 10),
                        })
                      }
                      disabled={disabled}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Criterion Weight</span>
                    <input
                      className={styles.input}
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={criterion.weight}
                      onChange={(event) =>
                        updateCriterion(criterion.id, {
                          weight: Number(event.target.value || 1),
                        })
                      }
                      disabled={disabled}
                    />
                  </label>

                  <button
                    type="button"
                    className={`btn btn--secondary btn--sm ${styles.removeButton}`}
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={disabled || criteria.length === 1}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={addCriterion}
                disabled={disabled}
              >
                <Plus size={14} aria-hidden="true" />
                Add criterion
              </button>
            </div>

            <div className={styles.weightGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Human Weight</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={humanWeight}
                  onChange={(event) => updateHumanWeight(Number(event.target.value || 0))}
                  disabled={disabled}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>LLM Weight</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={llmWeight}
                  onChange={(event) => updateLlmWeight(Number(event.target.value || 0))}
                  disabled={disabled}
                />
              </label>
            </div>

            <div className={styles.actions}>
              <span className={styles.helper}>
                Current blend: {(humanWeight * 100).toFixed(0)}% human,{' '}
                {(llmWeight * 100).toFixed(0)}% LLM
              </span>
              {validationMessage ? (
                <span className={styles.helper} role="alert">
                  {validationMessage}
                </span>
              ) : (
                <span className={styles.helper}>
                  This scorecard can still be adjusted later if the interview process changes.
                </span>
              )}
            </div>
          </>
        ) : (
          <p className={styles.intro}>
            Leave this off to post faster. You can add or edit the evaluation schema later from the
            job details page before interviews start.
          </p>
        )}
      </div>
    </section>
  )
}
