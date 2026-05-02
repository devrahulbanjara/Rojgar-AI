'use client'

import { useMemo, useState } from 'react'

import { notify } from '@/lib/notify'
import {
  type EvaluationCriterion,
  type JobEvaluationSchema,
  useGetJobEvaluationSchemaQuery,
  useUpsertJobEvaluationSchemaMutation,
} from '@/store/services/evaluationApi'
import { Plus, Trash2 } from 'lucide-react'

import styles from './EvaluationSchemaBuilder.module.css'

interface Props {
  jobId: string
  readOnly?: boolean
}

type CriterionDraft = EvaluationCriterion & { id: string }

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

function getInitialCriteria(schema: JobEvaluationSchema | null | undefined): CriterionDraft[] {
  if (!schema) return [createCriterionDraft(1)]
  return schema.criteria.map((criterion, index) => ({
    ...criterion,
    id: `criterion-${index + 1}`,
  }))
}

function SchemaEditor({
  jobId,
  schema,
}: {
  jobId: string
  schema: JobEvaluationSchema | null | undefined
}) {
  const [upsertSchema, { isLoading: isSaving }] = useUpsertJobEvaluationSchemaMutation()
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() => getInitialCriteria(schema))
  const [humanWeight, setHumanWeight] = useState(() => schema?.human_weight ?? 0.5)
  const [llmWeight, setLlmWeight] = useState(() => schema?.llm_weight ?? 0.5)

  const hasEmptyLabels = useMemo(
    () => criteria.some((criterion) => !criterion.label.trim()),
    [criteria],
  )

  function updateCriterion(id: string, next: Partial<CriterionDraft>) {
    setCriteria((current) =>
      current.map((criterion) => {
        if (criterion.id !== id) return criterion
        const updated = { ...criterion, ...next }
        if ('label' in next) updated.key = toSnakeCase(updated.label)
        return updated
      }),
    )
  }

  function addCriterion() {
    setCriteria((current) => [...current, createCriterionDraft(current.length + 1)])
  }

  function removeCriterion(id: string) {
    setCriteria((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    )
  }

  async function handleSave() {
    if (hasEmptyLabels) {
      notify.error('Every criterion needs a label before saving.')
      return
    }

    const payload = criteria.map((criterion) => ({
      key: toSnakeCase(criterion.key || criterion.label),
      label: criterion.label.trim(),
      max_score: Number(criterion.max_score),
      weight: Number(criterion.weight),
    }))

    if (payload.some((criterion) => !criterion.key)) {
      notify.error('Every criterion needs a valid key.')
      return
    }

    try {
      await upsertSchema({
        jobId,
        criteria: payload,
        human_weight: humanWeight,
        llm_weight: llmWeight,
      }).unwrap()
      notify.success('Evaluation schema saved.')
    } catch {
      notify.error('Could not save the evaluation schema.')
    }
  }

  return (
    <>
      <div className={styles.criteriaList}>
        {criteria.map((criterion) => (
          <div key={criterion.id} className={styles.criteriaRow}>
            <label className={styles.field}>
              <span className={styles.label}>Label</span>
              <input
                className={styles.input}
                value={criterion.label}
                onChange={(event) => updateCriterion(criterion.id, { label: event.target.value })}
                placeholder="Confidence"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Max Score</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={criterion.max_score}
                onChange={(event) =>
                  updateCriterion(criterion.id, {
                    max_score: Number(event.target.value || 10),
                  })
                }
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Criterion Weight</span>
              <input
                className={styles.input}
                type="number"
                min={0.1}
                step={0.1}
                value={criterion.weight}
                onChange={(event) =>
                  updateCriterion(criterion.id, {
                    weight: Number(event.target.value || 1),
                  })
                }
              />
            </label>

            <button
              type="button"
              className={`btn btn--secondary btn--sm ${styles.removeButton}`}
              onClick={() => removeCriterion(criterion.id)}
              disabled={criteria.length === 1}
            >
              <Trash2 size={14} aria-hidden="true" />
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addCriterion}>
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
            onChange={(event) => {
              const next = Math.min(Math.max(Number(event.target.value || 0), 0), 1)
              setHumanWeight(next)
              setLlmWeight(Number((1 - next).toFixed(2)))
            }}
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
            onChange={(event) => {
              const next = Math.min(Math.max(Number(event.target.value || 0), 0), 1)
              setLlmWeight(next)
              setHumanWeight(Number((1 - next).toFixed(2)))
            }}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`btn btn--primary btn--sm${isSaving ? ' btn--loading' : ''}`}
          onClick={() => void handleSave()}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save schema'}
        </button>
        <span className={styles.helper}>
          Current blend: {(humanWeight * 100).toFixed(0)}% human, {(llmWeight * 100).toFixed(0)}%{' '}
          LLM
        </span>
      </div>
    </>
  )
}

function SchemaReadOnly({ schema }: { schema: JobEvaluationSchema | null | undefined }) {
  if (!schema || schema.criteria.length === 0) {
    return <p className={styles.intro}>No evaluation schema defined yet.</p>
  }

  return (
    <>
      <div className={styles.criteriaList}>
        {schema.criteria.map((criterion) => (
          <div key={criterion.key} className={styles.criteriaRow}>
            <div className={styles.field}>
              <span className={styles.label}>Label</span>
              <span className={styles.input}>{criterion.label}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Max Score</span>
              <span className={styles.input}>{criterion.max_score}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Criterion Weight</span>
              <span className={styles.input}>{criterion.weight}</span>
            </div>
          </div>
        ))}
      </div>
      <p className={styles.helper}>
        Score blend: {((schema.human_weight ?? 0.5) * 100).toFixed(0)}% human,{' '}
        {((schema.llm_weight ?? 0.5) * 100).toFixed(0)}% LLM
      </p>
    </>
  )
}

export default function EvaluationSchemaBuilder({ jobId, readOnly = false }: Props) {
  const { data: schemaResp, isLoading } = useGetJobEvaluationSchemaQuery(jobId)
  const schema = schemaResp?.data

  return (
    <section className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title dash-card__title--sm">Evaluation Schema</div>
          <div className="dash-card__subtitle">
            Define the scorecard for this job, then reuse it across every interview.
          </div>
        </div>
      </div>

      <div className={`dash-card__body ${styles.cardBody}`}>
        <p className={styles.intro}>
          Recruiters and the LLM score candidates against the same criteria. Weighted totals are
          normalized to 100 so scores stay comparable.
        </p>

        {isLoading ? (
          <div className={styles.helper}>Loading schema...</div>
        ) : readOnly ? (
          <SchemaReadOnly schema={schema} />
        ) : (
          <SchemaEditor key={schema?.updated_at ?? 'new'} jobId={jobId} schema={schema} />
        )}
      </div>
    </section>
  )
}
