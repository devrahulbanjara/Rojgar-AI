import type { GapAnalysisResult, GapItem } from '@/store/services/resumeGapApi'
import { CheckCircle2, Minus, Plus } from 'lucide-react'

import styles from './applyModal.module.scss'

interface StepGapResultsProps {
  result: GapAnalysisResult
}

type Tone = 'good' | 'warn' | 'bad'

function scoreTone(score: number): Tone {
  if (score >= 70) return 'good'
  if (score >= 45) return 'warn'
  return 'bad'
}

function severityLabel(severity: GapItem['severity']): string {
  if (severity === 'critical') return 'Required'
  if (severity === 'preferred') return 'Preferred'
  return 'Bonus'
}

function severityPillClass(severity: GapItem['severity']): string {
  if (severity === 'critical') return styles['applyModal__pill--danger']
  if (severity === 'preferred') return styles['applyModal__pill--warning']
  return styles['applyModal__pill--muted']
}

function ScoreRing({ score }: { score: number }) {
  const tone = scoreTone(score)
  const bounded = Math.max(0, Math.min(100, score))
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (bounded / 100) * circumference

  return (
    <div
      className={styles.applyModal__scoreRing}
      role="progressbar"
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Resume match estimate"
    >
      <svg viewBox="0 0 104 104" width="104" height="104" aria-hidden="true">
        <circle cx="52" cy="52" r={radius} className={styles.applyModal__scoreRingTrack} />
        <circle
          cx="52"
          cy="52"
          r={radius}
          className={`${styles.applyModal__scoreRingProgress} ${
            styles[`applyModal__scoreRingProgress--${tone}`]
          }`}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <div className={styles.applyModal__scoreRingValue}>
        <span className={styles.applyModal__scoreRingInner}>
          <span
            className={`${styles.applyModal__scoreRingNumber} ${
              styles[`applyModal__scoreRingNumber--${tone}`]
            }`}
          >
            {score}
          </span>
          <span className={styles.applyModal__scoreRingUnit}>/100</span>
        </span>
      </div>
    </div>
  )
}

function GapCard({ item }: { item: GapItem }) {
  return (
    <div className={styles.applyModal__gapCard}>
      <div className={styles.applyModal__gapCardHead}>
        <p className={styles.applyModal__gapCardTitle}>{item.area}</p>
        <span className={`${styles.applyModal__pill} ${severityPillClass(item.severity)}`}>
          {severityLabel(item.severity)}
        </span>
      </div>
      <p className={styles.applyModal__gapCardBody}>{item.suggestion}</p>
    </div>
  )
}

function GapSection({ items, title }: { items: GapItem[]; title: string }) {
  if (items.length === 0) return null
  return (
    <section className={styles.applyModal__sectionCard}>
      <h3 className={styles.applyModal__sectionCardTitle}>{title}</h3>
      <div className={styles.applyModal__gapCardList}>
        {items.map((item, index) => (
          <GapCard key={`${item.area}-${index}`} item={item} />
        ))}
      </div>
    </section>
  )
}

interface IconListProps {
  title: string
  items: string[]
  icon: 'check' | 'plus' | 'minus'
  tone: 'good' | 'primary' | 'muted'
}

function IconList({ title, items, icon, tone }: IconListProps) {
  if (items.length === 0) return null
  const Icon = icon === 'check' ? CheckCircle2 : icon === 'plus' ? Plus : Minus

  return (
    <section className={styles.applyModal__sectionCard}>
      <h3 className={styles.applyModal__sectionCardTitle}>{title}</h3>
      <ul className={styles.applyModal__iconList}>
        {items.map((item, index) => (
          <li
            className={`${styles.applyModal__iconListItem} ${
              styles[`applyModal__iconListItem--${tone}`]
            }`}
            key={`${title}-${index}`}
          >
            <span className={styles.applyModal__iconListIcon}>
              <Icon size={14} aria-hidden="true" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function StepGapResults({ result }: StepGapResultsProps) {
  return (
    <div className={styles.applyModal__results} onWheel={(e) => e.stopPropagation()}>
      <div className={styles.applyModal__hero}>
        <ScoreRing score={result.overall_score_estimate} />
        <div className={styles.applyModal__heroCopy}>
          <span className={styles.applyModal__heroEyebrow}>Resume gap analysis</span>
          <h3 className={styles.applyModal__heroTitle}>How your resume looks right now</h3>
        </div>
      </div>

      <p className={styles.applyModal__verdictCallout}>{result.overall_verdict}</p>

      <div className={styles.applyModal__sectionStack}>
        <IconList
          title="Already working in your favor"
          items={result.things_already_strong}
          icon="check"
          tone="good"
        />
        <GapSection items={result.missing_skills} title="Skills you're missing" />
        <GapSection items={result.experience_gaps} title="Experience you're missing" />
        <IconList
          title="Consider adding to your summary"
          items={result.things_to_add_to_summary}
          icon="plus"
          tone="primary"
        />
        <IconList
          title="Consider removing or de-emphasizing"
          items={result.things_to_remove_or_deemphasize}
          icon="minus"
          tone="muted"
        />
      </div>
    </div>
  )
}
