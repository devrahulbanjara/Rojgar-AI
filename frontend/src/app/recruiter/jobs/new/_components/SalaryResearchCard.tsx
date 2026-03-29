'use client'

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
  if (!research) return null

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

      <div className="job-ai-card__body dash-card__body">
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

        <p className="salary-research-card__rationale">{research.rationale}</p>

        {research.insufficient_evidence ? (
          <div className="job-ai-callout job-ai-callout--warning">
            Evidence is limited, so treat this salary guidance as directional rather than final.
          </div>
        ) : null}

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
