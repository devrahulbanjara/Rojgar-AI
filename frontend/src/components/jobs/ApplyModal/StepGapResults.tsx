import type { GapAnalysisResult, GapItem } from '@/store/services/resumeGapApi'
import { CheckCircle2 } from 'lucide-react'

import styles from './applyModal.module.scss'

interface StepGapResultsProps {
  result: GapAnalysisResult
  onAutoPatch: () => void
  onApplyAnyway: () => void
  onBack: () => void
}

function scoreTone(score: number) {
  if (score >= 70) return styles['applyModal__scoreBadge--good']
  if (score >= 45) return styles['applyModal__scoreBadge--warn']
  return styles['applyModal__scoreBadge--bad']
}

function gapTone(severity: GapItem['severity']) {
  if (severity === 'critical') {
    return {
      row: styles['applyModal__gapItem--critical'],
      badge: styles['applyModal__gapSeverity--critical'],
      label: 'Required',
    }
  }
  if (severity === 'preferred') {
    return {
      row: styles['applyModal__gapItem--preferred'],
      badge: styles['applyModal__gapSeverity--preferred'],
      label: 'Preferred',
    }
  }
  return {
    row: '',
    badge: '',
    label: 'Bonus',
  }
}

function GapList({ items, title }: { items: GapItem[]; title: string }) {
  if (items.length === 0) return null

  return (
    <section className={styles.applyModal__section}>
      <h3 className={styles.applyModal__sectionTitle}>{title}</h3>
      <div className={styles.applyModal__gapList}>
        {items.map((item, index) => {
          const tone = gapTone(item.severity)

          return (
            <div
              className={`${styles.applyModal__gapItem} ${tone.row}`}
              key={`${item.area}-${index}`}
            >
              <div className={styles.applyModal__gapTop}>
                <span className={styles.applyModal__gapArea}>{item.area}</span>
                <span className={`${styles.applyModal__gapSeverity} ${tone.badge}`}>
                  {tone.label}
                </span>
              </div>
              <p className={styles.applyModal__gapSuggestion}>{item.suggestion}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <section className={`${styles.applyModal__section} ${styles.applyModal__sectionBlock}`}>
      <h3 className={styles.applyModal__sectionTitle}>{title}</h3>
      <div className={styles.applyModal__textList}>
        {items.map((item, index) => (
          <p className={styles.applyModal__textRow} key={`${title}-${index}`}>
            {item}
          </p>
        ))}
      </div>
    </section>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const boundedScore = Math.max(0, Math.min(100, score))
  const offset = circumference - (boundedScore / 100) * circumference

  return (
    <div className={styles.applyModal__scoreRingWrap}>
      <svg className={styles.applyModal__scoreRing} viewBox="0 0 72 72" aria-hidden="true">
        <circle className={styles.applyModal__scoreRingTrack} cx="36" cy="36" r={radius} />
        <circle
          className={styles.applyModal__scoreRingProgress}
          cx="36"
          cy="36"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.applyModal__scoreRingValue}>
        <span className={styles.applyModal__scoreRingNumber}>{score}</span>
        <span className={styles.applyModal__scoreRingLabel}>/100</span>
      </div>
    </div>
  )
}

export default function StepGapResults({
  result,
  onAutoPatch,
  onApplyAnyway,
  onBack,
}: StepGapResultsProps) {
  return (
    <div className={styles.applyModal__results}>
      <div className={styles.applyModal__hero}>
        <div className={styles.applyModal__heroScore}>
          <ScoreRing score={result.overall_score_estimate} />
          <span
            className={`${styles.applyModal__scoreBadge} ${scoreTone(result.overall_score_estimate)}`}
          >
            Match estimate
          </span>
        </div>
        <div className={styles.applyModal__heroCopy}>
          <h3 className={styles.applyModal__heroTitle}>How your resume looks right now</h3>
          <p className={styles.applyModal__verdict}>{result.overall_verdict}</p>
        </div>
      </div>

      <div className={styles.applyModal__resultsGrid}>
        <div className={styles.applyModal__resultsColumn}>
          {result.things_already_strong.length > 0 && (
            <section className={styles.applyModal__section}>
              <h3 className={styles.applyModal__sectionTitle}>Already working in your favor</h3>
              <div className={styles.applyModal__checkList}>
                {result.things_already_strong.map((item, index) => (
                  <div className={styles.applyModal__checkItem} key={`${item}-${index}`}>
                    <CheckCircle2 size={12} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <TextList title="Things to add to your summary" items={result.things_to_add_to_summary} />
          <TextList
            title="Things to remove or de-emphasize"
            items={result.things_to_remove_or_deemphasize}
          />
        </div>

        <div className={styles.applyModal__resultsColumn}>
          <GapList items={result.missing_skills} title="Missing skills" />
        </div>
      </div>

      <GapList items={result.experience_gaps} title="Experience gaps" />

      <div className={styles.applyModal__ctaStack}>
        <button className="btn btn--primary" onClick={onAutoPatch} type="button">
          Let AI update my resume
        </button>
        <div className={styles.applyModal__stepActions}>
          <button className="btn btn--ghost" onClick={onBack} type="button">
            Back
          </button>
          <button className="btn btn--outline" onClick={onApplyAnyway} type="button">
            Apply with current resume
          </button>
        </div>
      </div>
    </div>
  )
}
