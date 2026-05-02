'use client'

import { useRef, useState } from 'react'

import type { SalaryResearch } from '@/store/services/jobAiApi'

function formatMoney(value: number | null, currency: string | null) {
  if (value == null) return 'N/A'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || 'USD'} ${value.toLocaleString()}`
  }
}

export default function SalaryResearchCard({ research }: { research: SalaryResearch | null }) {
  const [expanded, setExpanded] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  if (!research) return null

  const isLong = research.rationale.length > 200
  const displayText =
    isLong && !expanded ? `${research.rationale.slice(0, 200)}...` : research.rationale

  const handleWheel = (e: React.WheelEvent) => {
    if (bodyRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = bodyRef.current
      const atTop = scrollTop === 0
      const atBottom = scrollTop >= scrollHeight - clientHeight - 1

      if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        return
      }
      e.stopPropagation()
    }
  }

  return (
    <section className="job-ai-card salary-research-card dash-card">
      <div className="job-ai-card__header dash-card__header">
        <div>
          <h2 className="job-ai-card__title dash-card__title">Salary Research</h2>
          <p className="job-ai-card__subtitle dash-card__subtitle">
            Evidence-backed guidance for {research.role} in {research.country}
          </p>
        </div>
      </div>

      <div
        ref={bodyRef}
        className="job-ai-card__body dash-card__body salary-research-card__body"
        onWheel={handleWheel}
      >
        <div className="salary-research-card__range">
          <div className="salary-research-card__range-item">
            <span className="salary-research-card__range-label">Suggested Min</span>
            <strong>{formatMoney(research.recommended_min, research.currency)}</strong>
          </div>
          <div className="salary-research-card__range-item">
            <span className="salary-research-card__range-label">Suggested Max</span>
            <strong>{formatMoney(research.recommended_max, research.currency)}</strong>
          </div>
        </div>

        <p className="salary-research-card__rationale">
          {displayText}
          {isLong && (
            <button
              type="button"
              className="salary-research-card__toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? ' Show less' : ' Read more'}
            </button>
          )}
        </p>

        {research.sources.length > 0 ? (
          <div className="salary-research-card__sources">
            <div className="job-ai-section-title">Sources</div>
            <ul className="salary-research-card__source-list">
              {research.sources.map((source) => (
                <li
                  key={`${source.source_name}-${source.url}`}
                  className="salary-research-card__source"
                >
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.source_name}
                  </a>
                  <span>
                    {source.country}
                    {source.quoted_min != null || source.quoted_max != null
                      ? ` · ${formatMoney(source.quoted_min, source.currency)} to ${formatMoney(source.quoted_max, source.currency)}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
